import {createHash} from 'node:crypto';
import type {Pool} from 'mysql2/promise';
import {rows,transaction} from '../../db.js';
import {logger} from '../../errors.js';
import {preferences,notify} from './notifications.js';
import {reconcile} from './pomodoro.js';
import {isoDate,sqlDate,dayKey,parts,dayRange} from './time.js';
const windowKey=(value:string)=>createHash('sha256').update(value).digest('hex');
export async function runReminders(pool:Pool,now=new Date()){
 const connection=await pool.getConnection();let acquired=false;
 try{
  acquired=Number((await rows(connection,"SELECT GET_LOCK(CONCAT(DATABASE(),':productivity_scheduler'),0) AS acquired"))[0].acquired)===1;
  if(!acquired)return {skipped:true};
  const expired=await rows(connection,"SELECT id,user_id FROM student_pomodoro_sessions WHERE state='RUNNING' AND ends_at<=?",[sqlDate(now)]);
  for(const item of expired)await transaction(pool,async db=>{const r=(await rows(db,'SELECT * FROM student_pomodoro_sessions WHERE id=? FOR UPDATE',[item.id]))[0];if(r)await reconcile(db,r,now);});
  const tasks=await rows(connection,"SELECT t.* FROM student_tasks t JOIN users u ON u.id=t.user_id WHERE t.status<>'COMPLETED' AND t.due_at IS NOT NULL AND u.is_active=1 AND u.role='STUDENT'");
  const cache=new Map<string,Awaited<ReturnType<typeof preferences>>>();
  const pref=async(user:string)=>{if(!cache.has(user))cache.set(user,await preferences(connection,user));return cache.get(user)!;};
  for(const candidate of tasks)await transaction(pool,async db=>{
   // Source locks make completion/deletion and reminder generation consistent.
   const t=(await rows(db,'SELECT * FROM student_tasks WHERE id=? AND user_id=? FOR UPDATE',[candidate.id,candidate.user_id]))[0];
   if(!t||t.status==='COMPLETED'||!t.due_at)return;
   const p=await pref(String(t.user_id)),due=new Date(isoDate(t.due_at)!).getTime(),distance=due-now.getTime(),key=windowKey(isoDate(t.due_at)!);
   if(distance<0&&p.task_overdue)await notify(db,String(t.user_id),`TASK_OVERDUE:${t.id}:${key}`,'TASK_OVERDUE','تجاوزت مهمة موعدها',`المهمة «${t.title}» لم تكتمل بعد. يمكنك تحديث حالتها أو موعدها.`,now,{task_id:String(t.id)});
   else if(distance>=0&&distance<=p.task_reminder_minutes*60000&&p.task_upcoming)await notify(db,String(t.user_id),`TASK_UPCOMING:${t.id}:${key}`,'TASK_UPCOMING','اقترب موعد مهمة',`اقترب موعد «${t.title}». راجعي وقتك وخطتك.`,now,{task_id:String(t.id)});
  });
  const catchup=sqlDate(new Date(now.getTime()-86400000)),horizon=sqlDate(new Date(now.getTime()+10080*60000));
  const events=await rows(connection,"SELECT e.* FROM student_calendar_events e JOIN users u ON u.id=e.user_id WHERE e.start_at<=? AND (e.start_at>=? OR e.end_at>?) AND u.is_active=1 AND u.role='STUDENT'",[horizon,catchup,sqlDate(now)]);
  for(const candidate of events)await transaction(pool,async db=>{
   const e=(await rows(db,'SELECT * FROM student_calendar_events WHERE id=? AND user_id=? FOR UPDATE',[candidate.id,candidate.user_id]))[0];if(!e)return;
   const p=await pref(String(e.user_id)),distance=new Date(isoDate(e.start_at)!).getTime()-now.getTime();
   if(!p.event_reminders||distance>p.event_reminder_minutes*60000||distance<-86400000&&new Date(isoDate(e.end_at)!).getTime()<=now.getTime())return;
   const upcoming=distance>=0,title=upcoming?'موعدك الشخصي قريب':'تذكير بموعدك الشخصي',message=upcoming?`سيبدأ «${e.title}» قريبًا. هذا حدث شخصي أضفتِه، وليس موعدًا جامعيًا رسميًا.`:`كان موعد بداية «${e.title}» قبل وصول هذا التذكير. راجعي الحدث الشخصي في التقويم.`;
   await notify(db,String(e.user_id),`EVENT:${e.id}:${windowKey(isoDate(e.start_at)!)}`,'EVENT_REMINDER',title,message,now,{event_id:String(e.id)});
  });
  const pendingUsers=await rows(connection,"SELECT DISTINCT t.user_id FROM student_tasks t JOIN users u ON u.id=t.user_id WHERE t.status<>'COMPLETED' AND u.is_active=1 AND u.role='STUDENT'");
  for(const row of pendingUsers){const user=String(row.user_id),p=await pref(user);if(!p.general_reminders||Number(parts(now,p.timezone).hour)<9)continue;const range=dayRange(now,p.timezone);const completed=await rows(connection,"SELECT id FROM student_pomodoro_sessions WHERE user_id=? AND mode='FOCUS' AND state='COMPLETED' AND completed_at>=? AND completed_at<? LIMIT 1",[user,sqlDate(range.from),sqlDate(range.to)]);if(!completed.length)await notify(connection,user,`GENERAL:${dayKey(now,p.timezone)}`,'GENERAL_REMINDER','خطوة صغيرة ليومك','لديك مهام غير مكتملة. اختاري مهمة مناسبة أو ابدئي جلسة تركيز عندما يناسبك.',now);}
  return {skipped:false};
 }finally{if(acquired)await connection.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(),':productivity_scheduler'))");connection.release();}
}
export function startScheduler(pool:Pool){let running=false,stopped=false;const tick=async()=>{if(running||stopped)return;running=true;try{await runReminders(pool);}catch{logger.error({event:'productivity_scheduler_failed'});}finally{running=false;}};const timer=setInterval(()=>void tick(),60000);timer.unref();void tick();return async()=>{stopped=true;clearInterval(timer);while(running)await new Promise(resolve=>setTimeout(resolve,25));};}
