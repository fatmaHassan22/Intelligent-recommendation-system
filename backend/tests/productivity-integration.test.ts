import {test} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {randomUUID,createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {loadConfig} from '../src/config.js';
import {createPool,rows} from '../src/db.js';
import {createApp} from '../src/app.js';
import {snapshot} from '../scripts/snapshot.js';
import {runReminders} from '../src/modules/productivity/scheduler.js';

test('Productivity works across private APIs and preserves previous data',async t=>{
 const c=loadConfig();assert.equal(c.NODE_ENV,'test');assert.ok(c.DB_NAME.endsWith('_test')&&c.DB_NAME!=='academic_support');
 const pool=createPool(c),live=createPool({...c,DB_NAME:'academic_support'}),before=await snapshot(live),testBefore=await snapshot(pool);
 const prior=async()=>{const data:Record<string,unknown>={};for(const name of ['users','student_profiles','auth_sessions','student_completed_courses','student_semester_plans','student_semester_plan_courses','planner_offering_evidence'])data[name]=createHash('sha256').update((await rows(live,`SELECT * FROM ${name}`)).map(r=>JSON.stringify(r)).sort().join('\n')).digest('hex');return data;};const studentBefore=await prior();
 t.after(async()=>{try{assert.deepEqual(await snapshot(live),before);assert.deepEqual(await snapshot(pool),testBefore);assert.deepEqual(await prior(),studentBefore);await writeFile(new URL('../../reports/phase5-test-preservation.json',import.meta.url),JSON.stringify({test_database:c.DB_NAME,academic_source_unchanged:true,existing_student_source_unchanged:true,before,after:await snapshot(live)},null,2));}finally{await pool.end();await live.end();}});
 let now=new Date('2026-10-11T08:00:00.000Z');const app=createApp(pool,c,100,()=>new Date(now)),base='/api/v1/students/me';
 const plans=await rows(pool,"SELECT p.id,p.major_id,m.code FROM curriculum_plans p JOIN majors m ON m.id=p.major_id WHERE p.plan_number=4"),cs=plans.find(p=>p.code==='CS')!;
 async function account(){const agent=request.agent(app),token=(await agent.get('/api/v1/auth/csrf')).body.csrf_token;const r=await agent.post('/api/v1/auth/register').set('X-CSRF-Token',token).send({full_name:'اختبار الإنتاجية',email:randomUUID()+'@example.test',password:'Productivity-test-2026!',major_id:String(cs.major_id),curriculum_plan_id:String(cs.id),max_semester_credit_hours:18,preferred_study_mode:'BALANCED'}).expect(201);return {agent,token:r.body.csrf_token,user:r.body.user,cookies:r.headers['set-cookie']};}
 const a=await account(),b=await account();const post=(path:string,body:unknown)=>a.agent.post(base+path).set('X-CSRF-Token',a.token).send(body),patch=(path:string,body:unknown)=>a.agent.patch(base+path).set('X-CSRF-Token',a.token).send(body),remove=(path:string,body:unknown)=>a.agent.delete(base+path).set('X-CSRF-Token',a.token).send(body);let task:any,event:any,session:any;
 await t.test('Authentication, CSRF, owner fields and course membership are enforced',async()=>{
  for(const path of ['/tasks','/calendar?from=2026-10-11T00:00:00Z&to=2026-10-12T00:00:00Z','/pomodoro/active','/notifications','/productivity/summary'])await request(app).get(base+path).expect(401);
  for(const path of ['/tasks','/calendar/events','/pomodoro/sessions','/notifications/read-all'])await a.agent.post(base+path).send({}).expect(403);
  await post('/tasks',{title:'bad',user_id:b.user.id}).expect(400);await post('/tasks',{title:'bad',course_code:'ABC9999'}).expect(400);
  await post('/tasks',{title:'bad',due_time:'12:00'}).expect(400);await post('/tasks',{title:'bad',timezone:'Invalid/Zone'}).expect(400);
 });
 await t.test('Task persistence, search, priority and today/upcoming/overdue filters',async()=>{
  task=(await post('/tasks',{title:'مراجعة البرمجة',description:'وصف واضح',priority:'HIGH',due_date:'2026-10-11',due_time:'08:30',timezone:'UTC',course_code:'ITCS1311'}).expect(201)).body.data;
  assert.equal(task.revision,1);assert.equal(task.due_at,'2026-10-11T08:30:00.000Z');assert.equal(task.is_overdue,false);
  assert.equal((await a.agent.get(base+'/tasks/'+task.id).expect(200)).body.data.title,task.title);
  await post('/tasks',{title:'مهمة الغد',due_date:'2026-10-12',priority:'LOW'}).expect(201);
  await post('/tasks',{title:'مهمة متأخرة',due_date:'2026-10-10',timezone:'UTC'}).expect(201);
  assert.equal((await a.agent.get(base+'/tasks?view=TODAY&timezone=UTC')).body.pagination.total,1);
  assert.equal((await a.agent.get(base+'/tasks?view=UPCOMING')).body.pagination.total,1);
  assert.equal((await a.agent.get(base+'/tasks?view=OVERDUE')).body.pagination.total,1);
  assert.equal((await a.agent.get(base+'/tasks?search='+encodeURIComponent('مراجعة'))).body.data[0].id,task.id);
  assert.equal((await a.agent.get(base+'/tasks?sort=PRIORITY')).body.data[0].id,task.id);
 });
 await t.test('Personal event CRUD, invalid ranges and calendar task projection',async()=>{
  const data={title:'مراجعة شخصية',start_at:'2026-10-11T08:15:00Z',end_at:'2026-10-11T08:45:00Z',timezone:'UTC',course_code:'ITCS1311'};
  await post('/calendar/events',{...data,end_at:data.start_at}).expect(400);
  event=(await post('/calendar/events',data).expect(201)).body.data;
  assert.equal((await a.agent.get(base+'/calendar/events/'+event.id)).body.data.title,event.title);
  await patch('/calendar/events/'+event.id,{end_at:'2026-10-11T07:00:00Z',expected_revision:event.revision}).expect(400);
  const cal=(await a.agent.get(base+'/calendar?from=2026-10-11T00:00:00Z&to=2026-10-12T00:00:00Z').expect(200)).body.data;assert.ok(cal.tasks.some((x:any)=>x.id===task.id));assert.ok(cal.events.some((x:any)=>x.id===event.id));
  await a.agent.get(base+'/calendar?from=2026-01-01T00:00:00Z&to=2026-12-31T00:00:00Z').expect(400);
 });
 await t.test('Server scheduler creates all due windows, survives restart and prevents duplicates',async()=>{
  await patch('/notifications/preferences',{general_reminders:false}).expect(200);
  await runReminders(pool,now);const first=(await a.agent.get(base+'/notifications')).body;assert.ok(first.data.some((n:any)=>n.type==='TASK_UPCOMING'&&n.task_id===task.id));assert.ok(first.data.some((n:any)=>n.type==='EVENT_REMINDER'&&n.event_id===event.id));assert.ok(first.data.some((n:any)=>n.type==='TASK_OVERDUE'));
  const count=first.pagination.total;await Promise.all([runReminders(pool,now),runReminders(pool,now)]);await runReminders(pool,now);assert.equal((await a.agent.get(base+'/notifications')).body.pagination.total,count);
  const n=first.data[0];await a.agent.patch(base+'/notifications/'+n.id).send({read:true}).expect(403);await patch('/notifications/'+n.id,{read:true}).expect(204);assert.equal((await a.agent.get(base+'/notifications?state=READ')).body.pagination.total,1);
  await post('/notifications/read-all',{}).expect(204);assert.equal((await a.agent.get(base+'/notifications/count')).body.data.unread_count,0);
  await patch('/notifications/'+n.id,{read:false}).expect(204);assert.equal((await a.agent.get(base+'/notifications/count')).body.data.unread_count,1);
  await remove('/notifications/'+n.id,{}).expect(204);await runReminders(pool,now);assert.equal((await a.agent.get(base+'/notifications')).body.pagination.total,count-1);
 });
 await t.test('Restart catches a missed recent event without falsely describing it as upcoming',async()=>{
  const late=(await post('/calendar/events',{title:'حدث بدأ أثناء توقف الخادم',start_at:'2026-10-11T07:45:00Z',end_at:'2026-10-11T07:55:00Z',timezone:'UTC'}).expect(201)).body.data;
  await runReminders(pool,now);await runReminders(pool,now);const items=(await a.agent.get(base+'/notifications?limit=100')).body.data.filter((n:any)=>n.event_id===late.id);assert.equal(items.length,1);assert.equal(items[0].title,'تذكير بموعدك الشخصي');assert.ok(items[0].message.includes('قبل وصول هذا التذكير'));
  await remove('/calendar/events/'+late.id,{expected_revision:late.revision}).expect(204);
 });
 await t.test('Concurrent task completion and scheduler never leave an active stale task reminder',async()=>{
  const raced=(await post('/tasks',{title:'فحص التزامن',due_date:'2026-10-11',due_time:'07:00',timezone:'UTC'}).expect(201)).body.data;
  const [,response]=await Promise.all([runReminders(pool,now),patch('/tasks/'+raced.id,{status:'COMPLETED',expected_revision:raced.revision})]);assert.equal(response.status,200);const count=(await rows(pool,'SELECT COUNT(*) AS count FROM student_notifications WHERE task_id=? AND user_id=? AND dismissed_at IS NULL',[raced.id,a.user.id]))[0].count;assert.equal(Number(count),0);
  await remove('/tasks/'+raced.id,{expected_revision:response.body.data.revision}).expect(204);
 });
 await t.test('Ownership isolates task/event/notification reads and all mutations',async()=>{
  for(const path of ['/tasks/'+task.id,'/calendar/events/'+event.id]){await b.agent.get(base+path).expect(404);await b.agent.patch(base+path).set('X-CSRF-Token',b.token).send({title:'intrusion',expected_revision:1}).expect(404);await b.agent.delete(base+path).set('X-CSRF-Token',b.token).send({expected_revision:1}).expect(404);}
  const n=(await a.agent.get(base+'/notifications')).body.data[0];await b.agent.patch(base+'/notifications/'+n.id).set('X-CSRF-Token',b.token).send({read:true}).expect(404);await b.agent.delete(base+'/notifications/'+n.id).set('X-CSRF-Token',b.token).send({}).expect(404);assert.equal((await b.agent.get(base+'/tasks')).body.pagination.total,0);
 });
 await t.test('Task editing synchronizes calendar and completion timestamps everywhere',async()=>{
  task=(await patch('/tasks/'+task.id,{due_date:'2026-10-12',due_time:null,status:'IN_PROGRESS',expected_revision:task.revision}).expect(200)).body.data;
  assert.equal(task.due_time,null);assert.equal(task.status,'IN_PROGRESS');assert.ok(!(await a.agent.get(base+'/calendar?from=2026-10-11T00:00:00Z&to=2026-10-12T00:00:00Z')).body.data.tasks.some((x:any)=>x.id===task.id));
  await patch('/tasks/'+task.id,{title:'stale',expected_revision:1}).expect(409);
  task=(await patch('/tasks/'+task.id,{status:'COMPLETED',expected_revision:task.revision}).expect(200)).body.data;assert.equal(task.completed_at,now.toISOString());assert.ok((await a.agent.get(base+'/tasks?view=COMPLETED')).body.data.some((x:any)=>x.id===task.id));
  task=(await patch('/tasks/'+task.id,{status:'TODO',expected_revision:task.revision}).expect(200)).body.data;assert.equal(task.completed_at,null);
  event=(await patch('/calendar/events/'+event.id,{title:'حدث معدل',start_at:'2026-10-11T09:15:00Z',end_at:'2026-10-11T09:45:00Z',expected_revision:event.revision}).expect(200)).body.data;assert.equal(event.title,'حدث معدل');
 });
 await t.test('Pomodoro settings, start, single active constraint and ownership',async()=>{
  assert.equal((await a.agent.get(base+'/pomodoro/settings')).body.data.focus_minutes,25);
  await patch('/pomodoro/settings',{focus_minutes:1,short_break_minutes:1,long_break_minutes:2,long_break_after:2}).expect(200);
  await patch('/pomodoro/settings',{focus_minutes:0,short_break_minutes:1,long_break_minutes:2,long_break_after:2}).expect(400);
  session=(await post('/pomodoro/sessions',{mode:'FOCUS',task_id:task.id}).expect(201)).body.data;assert.equal(session.duration_ms,60000);assert.equal(session.task_id,task.id);
  await post('/pomodoro/sessions',{mode:'FOCUS'}).expect(409);await post('/pomodoro/sessions/'+session.id+'/actions',{action:'COMPLETE',expected_revision:session.revision}).expect(409);
  await b.agent.post(base+'/pomodoro/sessions/'+session.id+'/actions').set('X-CSRF-Token',b.token).send({action:'CANCEL',expected_revision:session.revision}).expect(404);
 });
 await t.test('Pause/resume restores exact milliseconds across app restart and background time',async()=>{
  now=new Date(now.getTime()+10250);session=(await post('/pomodoro/sessions/'+session.id+'/actions',{action:'PAUSE',expected_revision:session.revision}).expect(200)).body.data;assert.equal(session.remaining_ms,49750);
  now=new Date(now.getTime()+3600000);const restarted=createApp(pool,c,100,()=>new Date(now));const restored=(await request(restarted).get(base+'/pomodoro/active').set('Cookie',a.cookies).expect(200)).body.data;assert.equal(restored.state,'PAUSED');assert.equal(restored.remaining_ms,49750);
  const old=session.revision;session=(await post('/pomodoro/sessions/'+session.id+'/actions',{action:'RESUME',expected_revision:old}).expect(200)).body.data;
  await post('/pomodoro/sessions/'+session.id+'/actions',{action:'PAUSE',expected_revision:old}).expect(409);assert.equal(Date.parse(session.ends_at)-now.getTime(),49750);
 });
 await t.test('Concurrent completion is idempotent and focus minutes are counted once',async()=>{
  now=new Date(now.getTime()+49750);const body={action:'COMPLETE',expected_revision:session.revision};const responses=await Promise.all([post('/pomodoro/sessions/'+session.id+'/actions',body),post('/pomodoro/sessions/'+session.id+'/actions',body)]);assert.ok(responses.every(r=>r.status===200));
  assert.equal((await a.agent.get(base+'/pomodoro/statistics?timezone=UTC')).body.data.total_focus_minutes,1);assert.equal(Number((await rows(pool,'SELECT COUNT(*) AS count FROM student_notifications WHERE user_id=? AND session_id=?',[a.user.id,session.id]))[0].count),1);
  await post('/pomodoro/sessions/'+session.id+'/actions',{action:'CANCEL',expected_revision:1}).expect(200);assert.equal((await a.agent.get(base+'/pomodoro/statistics?timezone=UTC')).body.data.total_focus_minutes,1);
 });
 await t.test('Cancelled sessions and completed breaks do not increase focus statistics',async()=>{
  session=(await post('/pomodoro/sessions',{mode:'FOCUS'}).expect(201)).body.data;now=new Date(now.getTime()+30000);session=(await post('/pomodoro/sessions/'+session.id+'/actions',{action:'CANCEL',expected_revision:session.revision}).expect(200)).body.data;assert.equal(session.state,'CANCELLED');
  session=(await post('/pomodoro/sessions',{mode:'SHORT_BREAK'}).expect(201)).body.data;now=new Date(now.getTime()+60000);await runReminders(pool,now);assert.equal((await a.agent.get(base+'/pomodoro/active')).body.data,null);
  const stats=(await a.agent.get(base+'/pomodoro/statistics?timezone=UTC')).body.data;assert.equal(stats.total_completed_focus_sessions,1);assert.equal(stats.total_focus_minutes,1);assert.equal(stats.today_focus_minutes,1);assert.equal(stats.weekly_focus_minutes,1);
 });
 await t.test('Expired running focus reconciles without browser, recommends long break and preserves history',async()=>{
  session=(await post('/pomodoro/sessions',{mode:'FOCUS',task_id:task.id}).expect(201)).body.data;now=new Date(now.getTime()+120000);await runReminders(pool,now);await runReminders(pool,now);
  const active=(await a.agent.get(base+'/pomodoro/active')).body;assert.equal(active.data,null);assert.equal(active.suggested_break_mode,'LONG_BREAK');const stats=(await a.agent.get(base+'/pomodoro/statistics?timezone=UTC')).body.data;assert.equal(stats.total_focus_minutes,2);assert.equal(stats.total_completed_focus_sessions,2);
  const r=await rows(pool,'SELECT completed_at,ends_at FROM student_pomodoro_sessions WHERE id=?',[session.id]);assert.equal(r[0].completed_at,r[0].ends_at);
 });
 await t.test('General reminders and preferences are persistent and idempotent',async()=>{
  await b.agent.post(base+'/tasks').set('X-CSRF-Token',b.token).send({title:'مهمة للتذكير العام'}).expect(201);await runReminders(pool,now);await runReminders(pool,now);
  const notifications=(await b.agent.get(base+'/notifications')).body.data;assert.equal(notifications.filter((n:any)=>n.type==='GENERAL_REMINDER').length,1);
  const config=(await patch('/notifications/preferences',{timezone:'Asia/Hebron',task_upcoming:false,event_reminders:false,task_reminder_minutes:120}).expect(200)).body.data;assert.equal(config.task_upcoming,false);assert.equal(config.timezone,'Asia/Hebron');assert.equal(config.configured,true);
 });
 await t.test('Dashboard statistics reflect task completion and focus history',async()=>{
  task=(await patch('/tasks/'+task.id,{status:'COMPLETED',expected_revision:task.revision}).expect(200)).body.data;
  const summary=(await a.agent.get(base+'/productivity/summary?timezone=UTC').expect(200)).body.data;assert.equal(summary.completed_today,1);assert.equal(summary.focus.today_focus_minutes,2);assert.ok(summary.overdue_count>=1);assert.ok(Array.isArray(summary.today_tasks));
 });
 await t.test('Editing a task after curriculum change preserves original course association',async()=>{
  const wmm=plans.find(p=>p.code==='WMM')!;const exclusive=(await rows(pool,'SELECT c.course_code FROM curriculum_courses cc JOIN courses c ON c.id=cc.course_id WHERE cc.curriculum_plan_id=? AND NOT EXISTS(SELECT 1 FROM curriculum_courses other WHERE other.curriculum_plan_id=? AND other.course_id=c.id) LIMIT 1',[cs.id,wmm.id]))[0].course_code;
  const old=(await post('/tasks',{title:'مهمة الخطة السابقة',course_code:exclusive}).expect(201)).body.data;
  await patch('',{major_id:String(wmm.major_id),curriculum_plan_id:String(wmm.id),confirm_plan_change:true}).expect(200);
  const changed=(await patch('/tasks/'+old.id,{title:'عنوان جديد',expected_revision:old.revision}).expect(200)).body.data;assert.equal(changed.course_code,exclusive);
  await post('/tasks',{title:'خارج الحالية',course_code:exclusive}).expect(400);
 });
 await t.test('Deleting source records removes calendar items and links without deleting focus history',async()=>{
  await remove('/tasks/'+task.id,{expected_revision:task.revision}).expect(204);await a.agent.get(base+'/tasks/'+task.id).expect(404);
  await remove('/calendar/events/'+event.id,{expected_revision:event.revision}).expect(204);await a.agent.get(base+'/calendar/events/'+event.id).expect(404);
  const cal=(await a.agent.get(base+'/calendar?from=2026-10-11T00:00:00Z&to=2026-10-13T00:00:00Z')).body.data;assert.ok(!cal.tasks.some((x:any)=>x.id===task.id));assert.ok(!cal.events.some((x:any)=>x.id===event.id));
  assert.equal((await a.agent.get(base+'/pomodoro/statistics')).body.data.total_focus_minutes,2);assert.equal((await rows(pool,'SELECT task_id FROM student_pomodoro_sessions WHERE id=?',[session.id]))[0].task_id,null);
 });
});
