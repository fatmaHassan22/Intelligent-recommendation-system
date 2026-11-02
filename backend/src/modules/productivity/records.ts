import type {Config} from '../../config.js';
import type {Pool} from 'mysql2/promise';
import {rows,write,transaction,type Executor} from '../../db.js';
import {ApiError} from '../../errors.js';
import {getProfile} from '../profiles/repository.js';
import {deadline,isoDate,sqlDate,dayKey,dayRange} from './time.js';
import {taskSchema,eventSchema,taskQuery} from './validation.js';
import type {z} from 'zod';
import {recordActivity} from '../engagement/service.js';
import {moodleCalendar} from '../moodle/service.js';
export type Clock=()=>Date;
export const tables={task:'student_tasks',event:'student_calendar_events'} as const;
export type Kind=keyof typeof tables;
export function checkRevision(row:Record<string,any>,expected:number){if(Number(row.revision)!==expected)throw new ApiError(409,'PRODUCTIVITY_REVISION_CONFLICT');}
export async function owned(db:Executor,kind:Kind,user:string,id:string,lock=false){
 const result=await rows(db,`SELECT * FROM ${tables[kind]} WHERE id=? AND user_id=?${lock?' FOR UPDATE':''}`,[id,user]);
 if(!result[0])throw new ApiError(404,kind==='task'?'TASK_NOT_FOUND':'EVENT_NOT_FOUND');return result[0];
}
export async function courseAssociation(db:Executor,user:string,code:string|null){
 if(!code)return {course_id:null,curriculum_plan_id:null};
 const profile=await getProfile(db,user);if(!profile)throw new ApiError(404,'PROFILE_NOT_FOUND');
 const match=await rows(db,'SELECT c.id FROM curriculum_courses cc JOIN courses c ON c.id=cc.course_id WHERE cc.curriculum_plan_id=? AND c.course_code=?',[profile.curriculum_plan_id,code]);
 if(!match[0])throw new ApiError(400,'COURSE_NOT_IN_SELECTED_PLAN');return {course_id:String(match[0].id),curriculum_plan_id:String(profile.curriculum_plan_id)};
}
const projection=(kind:Kind)=>`SELECT r.*,c.course_code,COALESCE(cc.source_name_ar,c.name_ar) AS course_name FROM ${tables[kind]} r LEFT JOIN courses c ON c.id=r.course_id LEFT JOIN curriculum_courses cc ON cc.course_id=r.course_id AND cc.curriculum_plan_id=r.curriculum_plan_id`;
export function recordDto(row:Record<string,any>,kind:Kind,now:Date){const result={...row};for(const key of ['created_at','updated_at','due_at','completed_at','start_at','end_at'])if(key in result)result[key]=isoDate(result[key]);if(result.due_time)result.due_time=String(result.due_time).slice(0,5);result.revision=Number(result.revision);if(kind==='event')result.all_day=!!result.all_day;if(kind==='task')result.is_overdue=result.status!=='COMPLETED'&&!!result.due_at&&Date.parse(result.due_at)<now.getTime();return result;}
export async function getRecord(db:Executor,kind:Kind,user:string,id:string,now:Date){const data=await rows(db,projection(kind)+' WHERE r.id=? AND r.user_id=?',[id,user]);if(!data[0])throw new ApiError(404,kind==='task'?'TASK_NOT_FOUND':'EVENT_NOT_FOUND');return recordDto(data[0],kind,now);}
export async function dismissRelated(db:Executor,user:string,kind:Kind,id:string,now:Date){await write(db,`UPDATE student_notifications SET dismissed_at=? WHERE user_id=? AND ${kind}_id=? AND dismissed_at IS NULL`,[sqlDate(now),user,id]);}
export async function saveRecord(pool:Pool,kind:Kind,user:string,input:Record<string,any>,now:Date,id?:string){
 const saved=await transaction(pool,async db=>{
  await getProfile(db,user,true);
  const previous=id?await owned(db,kind,user,id,true):null;
  if(previous)checkRevision(previous,input.expected_revision);
  const old=previous?recordDto(previous,kind,now):{};
  const merged={...old,...input};
  const fields=kind==='task'?['title','description','priority','status','due_date','due_time','timezone']:['title','description','start_at','end_at','all_day','timezone'];
  const data=Object.fromEntries(fields.map(k=>[k,merged[k]]));
  const association='course_code' in input?await courseAssociation(db,user,input.course_code):previous?{course_id:previous.course_id,curriculum_plan_id:previous.curriculum_plan_id}:{course_id:null,curriculum_plan_id:null};
  const parsed=kind==='task'?taskSchema.parse(data):eventSchema.parse(data);
  const stored:Record<string,any>={...parsed,...association};delete stored.course_code;
  if(kind==='task'){
   stored.due_at=stored.due_date?sqlDate(deadline(stored.due_date,stored.due_time,stored.timezone)!):null;
   stored.completed_at=stored.status==='COMPLETED'?previous?.status==='COMPLETED'?previous.completed_at:sqlDate(now):null;
  }else{stored.start_at=sqlDate(new Date(stored.start_at));stored.end_at=sqlDate(new Date(stored.end_at));}
  stored.updated_at=sqlDate(now);
  if(previous){
   const keys=Object.keys(stored);await write(db,`UPDATE ${tables[kind]} SET ${keys.map(k=>k+'=?').join(',')},revision=revision+1 WHERE id=? AND user_id=?`,[...keys.map(k=>stored[k]),id,user]);
   if(kind==='event'&&(stored.start_at!==previous.start_at||stored.end_at!==previous.end_at)||kind==='task'&&(stored.due_at!==previous.due_at||stored.status==='COMPLETED'))await dismissRelated(db,user,kind,id!,now);
   if(kind==='task'&&stored.status==='COMPLETED'&&previous.status!=='COMPLETED')await recordActivity(db,user,'TASK',id!,`TASK:${id}`,now);
   return id!;
  }
  stored.created_at=sqlDate(now);stored.user_id=user;const keys=Object.keys(stored);const result=await write(db,`INSERT INTO ${tables[kind]}(${keys.join(',')}) VALUES(${keys.map(()=>'?').join(',')})`,keys.map(k=>stored[k]));const savedId=String(result.insertId);if(kind==='task'&&stored.status==='COMPLETED')await recordActivity(db,user,'TASK',savedId,`TASK:${savedId}`,now);return savedId;
 });return getRecord(pool,kind,user,saved,now);
}
export async function deleteRecord(pool:Pool,kind:Kind,user:string,id:string,revision:number,now:Date){return transaction(pool,async db=>{await getProfile(db,user,true);const record=await owned(db,kind,user,id,true);checkRevision(record,revision);await dismissRelated(db,user,kind,id,now);await write(db,`DELETE FROM ${tables[kind]} WHERE id=? AND user_id=?`,[id,user]);});}
export async function allTasks(db:Executor,user:string,now:Date){return (await rows(db,projection('task')+' WHERE r.user_id=? ORDER BY r.id DESC',[user])).map(r=>recordDto(r,'task',now));}
export async function listTasks(db:Executor,user:string,q:z.infer<typeof taskQuery>,now:Date){
 const today=dayKey(now,q.timezone),all=await allTasks(db,user,now);
 const data=all.filter(t=>(!q.search||String(t.title+' '+(t.description??'')+' '+(t.course_code??'')).toLocaleLowerCase().includes(q.search.toLocaleLowerCase()))&&(!q.status||t.status===q.status)&&(!q.priority||t.priority===q.priority)&&
  (q.view==='ALL'||q.view==='COMPLETED'&&t.status==='COMPLETED'||q.view==='OVERDUE'&&t.is_overdue||q.view==='TODAY'&&t.due_at&&dayKey(new Date(t.due_at),q.timezone)===today||q.view==='UPCOMING'&&t.status!=='COMPLETED'&&t.due_at&&dayKey(new Date(t.due_at),q.timezone)>today));
 const priorities:Record<string,number>={HIGH:0,MEDIUM:1,LOW:2};data.sort((a,b)=>q.sort==='PRIORITY'?priorities[a.priority]-priorities[b.priority]||String(a.id).localeCompare(String(b.id)):q.sort==='CREATED'?b.created_at.localeCompare(a.created_at)||Number(b.id)-Number(a.id):(a.due_at??'9999').localeCompare(b.due_at??'9999')||Number(a.id)-Number(b.id));
 return {data:data.slice((q.page-1)*q.limit,q.page*q.limit),pagination:{page:q.page,limit:q.limit,total:data.length},server_now:now.toISOString()};
}
export async function calendar(db:Executor,user:string,from:string,to:string,now:Date,c?:Config){
 const tasks=await rows(db,projection('task')+' WHERE r.user_id=? AND r.due_at>=? AND r.due_at<? ORDER BY r.due_at,r.id',[user,sqlDate(new Date(from)),sqlDate(new Date(to))]);
 const events=await rows(db,projection('event')+' WHERE r.user_id=? AND r.start_at<? AND r.end_at>? ORDER BY r.start_at,r.id',[user,sqlDate(new Date(to)),sqlDate(new Date(from))]);
 return {tasks:tasks.map(t=>recordDto(t,'task',now)),events:events.map(e=>recordDto(e,'event',now)),moodle_events:await moodleCalendar(db,user,from,to,c),from,to,server_now:now.toISOString()};
}
export async function taskSummary(db:Executor,user:string,timezone:string,now:Date){const all=await allTasks(db,user,now),today=dayKey(now,timezone),range=dayRange(now,timezone);
 return {today_tasks:all.filter(t=>t.due_at&&dayKey(new Date(t.due_at),timezone)===today),upcoming_tasks:all.filter(t=>t.status!=='COMPLETED'&&t.due_at&&Date.parse(t.due_at)>=now.getTime()).sort((a,b)=>a.due_at.localeCompare(b.due_at)).slice(0,5),overdue_count:all.filter(t=>t.is_overdue).length,completed_today:all.filter(t=>t.completed_at&&Date.parse(t.completed_at)>=range.from.getTime()&&Date.parse(t.completed_at)<range.to.getTime()).length};}
