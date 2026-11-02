import type {Pool} from 'mysql2/promise';
import {rows,write,type Executor} from '../../db.js';
import {ApiError} from '../../errors.js';
import {isoDate,sqlDate} from './time.js';
import {selectMessage} from '../engagement/messages.js';
export const defaultPreferences={timezone:'UTC',task_upcoming:true,task_overdue:true,event_reminders:true,pomodoro_completion:true,general_reminders:true,task_reminder_minutes:60,event_reminder_minutes:30};
const booleanKeys=['task_upcoming','task_overdue','event_reminders','pomodoro_completion','general_reminders'];
export async function preferences(db:Executor,user:string){const r=(await rows(db,'SELECT * FROM student_notification_preferences WHERE user_id=?',[user]))[0];if(!r)return {...defaultPreferences,configured:false};const result:Record<string,any>={...r,configured:true};delete result.user_id;for(const key of booleanKeys)result[key]=!!result[key];return result as typeof defaultPreferences&{configured:boolean};}
export async function savePreferences(db:Executor,user:string,data:Record<string,any>){const keys=Object.keys(data);await write(db,`INSERT INTO student_notification_preferences(user_id,${keys.join(',')}) VALUES(?,${keys.map(()=>'?').join(',')}) ON DUPLICATE KEY UPDATE ${keys.map(k=>`${k}=?`).join(',')}`,[user,...keys.map(k=>data[k]),...keys.map(k=>data[k])]);return preferences(db,user);}
export async function notify(db:Executor,user:string,key:string,type:string,title:string,message:string,now:Date,links:{task_id?:string;event_id?:string;session_id?:string}={}){
 if((await rows(db,'SELECT id FROM student_notifications WHERE user_id=? AND source_key=?',[user,key])).length)return;
 const selected=await selectMessage(db,user,type,message);
 try{return await write(db,'INSERT INTO student_notifications(user_id,source_key,type,title,message,task_id,event_id,session_id,created_at) VALUES(?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=id',[user,key,type,title,selected,links.task_id??null,links.event_id??null,links.session_id??null,sqlDate(now)]);}catch(e){if((e as {code?:string}).code==='ER_NO_REFERENCED_ROW_2')return;throw e;}
}
export async function unreadCount(db:Executor,user:string){return Number((await rows(db,'SELECT COUNT(*) AS count FROM student_notifications WHERE user_id=? AND read_at IS NULL AND dismissed_at IS NULL',[user]))[0].count);}
export async function listNotifications(db:Executor,user:string,state:string,page:number,limit:number){
 const where='user_id=? AND dismissed_at IS NULL'+(state==='UNREAD'?' AND read_at IS NULL':state==='READ'?' AND read_at IS NOT NULL':'');
 const total=Number((await rows(db,'SELECT COUNT(*) AS count FROM student_notifications WHERE '+where,[user]))[0].count);
 const data=await rows(db,`SELECT id,type,title,message,task_id,event_id,session_id,created_at,read_at FROM student_notifications WHERE ${where} ORDER BY created_at DESC,id DESC LIMIT ${limit} OFFSET ${(page-1)*limit}`,[user]);
 return {data:data.map(n=>({...n,created_at:isoDate(n.created_at),read_at:isoDate(n.read_at),href:n.task_id?`/app/tasks/${n.task_id}`:n.event_id?`/app/calendar?event=${n.event_id}`:n.session_id?'/app/pomodoro':n.type==='GENERAL_REMINDER'?'/app/tasks':n.type==='ACHIEVEMENT'?'/app/achievements':n.type==='STREAK_MILESTONE'?'/app/streaks':n.type.startsWith('MOODLE_')?'/app/moodle':null})),unread_count:await unreadCount(db,user),pagination:{page,limit,total}};
}
export async function changeNotification(pool:Pool,user:string,id:string,action:'read'|'unread'|'dismiss',now:Date){const result=await write(pool,`UPDATE student_notifications SET ${action==='dismiss'?'dismissed_at': 'read_at'}=? WHERE id=? AND user_id=? AND dismissed_at IS NULL`,[action==='unread'?null:sqlDate(now),id,user]);if(!result.affectedRows)throw new ApiError(404,'NOTIFICATION_NOT_FOUND');}

