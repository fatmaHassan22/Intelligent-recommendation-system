import type {Pool} from 'mysql2/promise';
import {rows,write,transaction,type Executor} from '../../db.js';
import {ApiError} from '../../errors.js';
import {getProfile} from '../profiles/repository.js';
import {courseAssociation,checkRevision} from './records.js';
import {isoDate,sqlDate,remainingMs,dayRange,dayKey,addDays,localDayStart} from './time.js';
import {notify,preferences} from './notifications.js';
import {recordActivity} from '../engagement/service.js';
export const defaultSettings={focus_minutes:25,short_break_minutes:5,long_break_minutes:15,long_break_after:4};
export async function settings(db:Executor,user:string){const r=(await rows(db,'SELECT focus_minutes,short_break_minutes,long_break_minutes,long_break_after FROM student_pomodoro_settings WHERE user_id=?',[user]))[0];return r??{...defaultSettings};}
export async function saveSettings(db:Executor,user:string,input:Record<string,number>){await write(db,'INSERT INTO student_pomodoro_settings(user_id,focus_minutes,short_break_minutes,long_break_minutes,long_break_after) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE focus_minutes=?,short_break_minutes=?,long_break_minutes=?,long_break_after=?',[user,input.focus_minutes,input.short_break_minutes,input.long_break_minutes,input.long_break_after,input.focus_minutes,input.short_break_minutes,input.long_break_minutes,input.long_break_after]);return settings(db,user);}
export function sessionDto(row:Record<string,any>,now:Date){const result={...row};delete result.active_user_id;for(const key of ['started_at','ends_at','completed_at','cancelled_at'])result[key]=isoDate(result[key]);result.duration_ms=Number(result.duration_ms);result.remaining_ms=remainingMs(row as any,now);result.revision=Number(result.revision);return result;}
async function ownedSession(db:Executor,user:string,id:string){const r=await rows(db,'SELECT * FROM student_pomodoro_sessions WHERE id=? AND user_id=? FOR UPDATE',[id,user]);if(!r[0])throw new ApiError(404,'POMODORO_NOT_FOUND');return r[0];}
async function hydrateSession(db:Executor,row:Record<string,any>){const info=(await rows(db,'SELECT t.title AS task_title,c.course_code,COALESCE(cc.source_name_ar,c.name_ar) AS course_name FROM student_pomodoro_sessions s LEFT JOIN student_tasks t ON t.id=s.task_id AND t.user_id=s.user_id LEFT JOIN courses c ON c.id=s.course_id LEFT JOIN curriculum_courses cc ON cc.course_id=s.course_id AND cc.curriculum_plan_id=s.curriculum_plan_id WHERE s.id=? AND s.user_id=?',[row.id,row.user_id]))[0];return {...row,...info};}
export async function reconcile(db:Executor,row:Record<string,any>,now:Date){
 if(row.state!=='RUNNING'||remainingMs(row as any,now)>0)return row;
 const finished=row.ends_at;
 await write(db,"UPDATE student_pomodoro_sessions SET state='COMPLETED',remaining_ms=0,completed_at=?,revision=revision+1 WHERE id=? AND state='RUNNING'",[finished,row.id]);
 if(row.mode==='FOCUS')await recordActivity(db,String(row.user_id),'FOCUS',String(row.id),'FOCUS:'+row.id,new Date(isoDate(finished)!));
 if((await preferences(db,String(row.user_id))).pomodoro_completion)await notify(db,String(row.user_id),'POMODORO:'+row.id,'POMODORO_COMPLETED',row.mode==='FOCUS'?'انتهت جلسة التركيز':'انتهت الاستراحة',row.mode==='FOCUS'?'أحسنتِ! حُفظ وقت التركيز في إحصاءاتك. خذي استراحة مناسبة.':'انتهت الاستراحة. يمكنك العودة إلى جلسة تركيز جديدة.',now,{session_id:String(row.id)});
 return {...row,state:'COMPLETED',remaining_ms:0,completed_at:finished,revision:Number(row.revision)+1};
}
export async function getActive(pool:Pool,user:string,now:Date){return transaction(pool,async db=>{const r=(await rows(db,"SELECT * FROM student_pomodoro_sessions WHERE user_id=? AND state IN ('RUNNING','PAUSED') FOR UPDATE",[user]))[0];return r?sessionDto(await hydrateSession(db,await reconcile(db,r,now)),now):null;});}
export async function nextMode(db:Executor,user:string){const s=await settings(db,user);const r=await rows(db,"SELECT COUNT(*) AS count FROM student_pomodoro_sessions WHERE user_id=? AND mode='FOCUS' AND state='COMPLETED' AND id>COALESCE((SELECT MAX(id) FROM student_pomodoro_sessions WHERE user_id=? AND mode='LONG_BREAK' AND state='COMPLETED'),0)",[user,user]);return Number(r[0].count)>=s.long_break_after?'LONG_BREAK':'SHORT_BREAK';}
export async function startSession(pool:Pool,user:string,input:{mode:string;task_id:string|null;course_code:string|null},now:Date){return transaction(pool,async db=>{
 await getProfile(db,user,true);
 const active=(await rows(db,"SELECT * FROM student_pomodoro_sessions WHERE user_id=? AND state IN ('RUNNING','PAUSED') FOR UPDATE",[user]))[0];
 if(active){const reconciled=await reconcile(db,active,now);if(reconciled.state!=='COMPLETED')throw new ApiError(409,'POMODORO_ALREADY_ACTIVE');}
 let association=await courseAssociation(db,user,input.course_code);
 if(input.task_id){const task=(await rows(db,'SELECT * FROM student_tasks WHERE id=? AND user_id=? FOR UPDATE',[input.task_id,user]))[0];if(!task)throw new ApiError(404,'TASK_NOT_FOUND');if(input.course_code&&task.course_id&&String(task.course_id)!==association.course_id)throw new ApiError(400,'POMODORO_ASSOCIATION_MISMATCH');if(!input.course_code&&task.course_id)association={course_id:String(task.course_id),curriculum_plan_id:String(task.curriculum_plan_id)};}
 const s=await settings(db,user),duration=Number(input.mode==='FOCUS'?s.focus_minutes:input.mode==='SHORT_BREAK'?s.short_break_minutes:s.long_break_minutes)*60000;
 const result=await write(db,'INSERT INTO student_pomodoro_sessions(user_id,mode,duration_ms,remaining_ms,started_at,ends_at,task_id,course_id,curriculum_plan_id) VALUES(?,?,?,?,?,?,?,?,?)',[user,input.mode,duration,duration,sqlDate(now),sqlDate(new Date(now.getTime()+duration)),input.task_id,association.course_id,association.curriculum_plan_id]);
 return sessionDto(await hydrateSession(db,await ownedSession(db,user,String(result.insertId))),now);
 });}
export async function actOnSession(pool:Pool,user:string,id:string,action:string,revision:number,now:Date){return transaction(pool,async db=>{
 let r=await ownedSession(db,user,id);r=await reconcile(db,r,now);
 // Completing an already completed session is idempotent, even after a lost response.
 if(r.state==='COMPLETED')return sessionDto(await hydrateSession(db,r),now);
 checkRevision(r,revision);
 if(action==='COMPLETE')throw new ApiError(409,'POMODORO_NOT_FINISHED');
 if(!['RUNNING','PAUSED'].includes(r.state))throw new ApiError(409,'POMODORO_INVALID_STATE');
 if(action==='PAUSE'){if(r.state!=='RUNNING')throw new ApiError(409,'POMODORO_INVALID_STATE');await write(db,"UPDATE student_pomodoro_sessions SET state='PAUSED',remaining_ms=?,ends_at=NULL,revision=revision+1 WHERE id=?",[remainingMs(r as any,now),id]);}
 else if(action==='RESUME'){if(r.state!=='PAUSED')throw new ApiError(409,'POMODORO_INVALID_STATE');await write(db,"UPDATE student_pomodoro_sessions SET state='RUNNING',ends_at=?,revision=revision+1 WHERE id=?",[sqlDate(new Date(now.getTime()+Number(r.remaining_ms))),id]);}
 else await write(db,"UPDATE student_pomodoro_sessions SET state='CANCELLED',cancelled_at=?,ends_at=NULL,revision=revision+1 WHERE id=?",[sqlDate(now),id]);
 return sessionDto(await hydrateSession(db,await ownedSession(db,user,id)),now);
 });}
export async function focusStats(db:Executor,user:string,zone:string,now:Date){
 const today=dayRange(now,zone),first=addDays(dayKey(now,zone),-6),from=localDayStart(first,zone);
 const all=(await rows(db,"SELECT COUNT(*) AS sessions,COALESCE(SUM(duration_ms),0) AS total_ms FROM student_pomodoro_sessions WHERE user_id=? AND mode='FOCUS' AND state='COMPLETED'",[user]))[0];
 const recent=await rows(db,"SELECT id,duration_ms,completed_at FROM student_pomodoro_sessions WHERE user_id=? AND mode='FOCUS' AND state='COMPLETED' AND completed_at>=? AND completed_at<? ORDER BY completed_at",[user,sqlDate(from),sqlDate(today.to)]);
 const daily=Array.from({length:7},(_,i)=>({date:addDays(first,i),completed_sessions:0,focus_minutes:0}));
 for(const r of recent){const bucket=daily.find(d=>d.date===dayKey(new Date(isoDate(r.completed_at)!),zone));if(bucket){bucket.completed_sessions++;bucket.focus_minutes+=Number(r.duration_ms)/60000;}}
 return {timezone:zone,today_focus_minutes:daily[6].focus_minutes,today_completed_sessions:daily[6].completed_sessions,weekly_focus_minutes:daily.reduce((s,d)=>s+d.focus_minutes,0),weekly_completed_sessions:recent.length,total_completed_focus_sessions:Number(all.sessions),total_focus_minutes:Number(all.total_ms)/60000,daily};
}
