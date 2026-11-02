import {test} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {loadConfig} from '../src/config.js';
import {createPool,rows,write} from '../src/db.js';
import {createApp} from '../src/app.js';
import {snapshot} from '../scripts/snapshot.js';

test('MySQL integration: isolated student database and unchanged real academic data',async t=>{
 const config=loadConfig();
 assert.equal(config.NODE_ENV,'test','Integration tests require NODE_ENV=test');
 assert.ok(config.DB_NAME.endsWith('_test')&&config.DB_NAME!=='academic_support','Refusing tests against live database');
 const pool=createPool(config),live=createPool({...config,DB_NAME:'academic_support'});
 const before=await snapshot(live),academicBefore=await snapshot(pool),app=createApp(pool,config,100);
 t.after(async()=>{try{const after=await snapshot(live),academicAfter=await snapshot(pool);const unchanged=JSON.stringify(before)===JSON.stringify(after)&&JSON.stringify(academicBefore)===JSON.stringify(academicAfter);
  await writeFile(new URL('../../reports/phase2-academic-preservation.json',import.meta.url),JSON.stringify({production_database:'academic_support',test_database:config.DB_NAME,academic_data_and_schema_unchanged:unchanged,before,after},null,2));assert.ok(unchanged,'Academic tables were altered');
 }finally{await pool.end();await live.end();}});
 // Cleanup is restricted to student tables of the explicitly guarded _test DB.
 for(const table of ['push_deliveries','push_subscriptions','ai_usage_records','ai_messages','ai_chat_requests','ai_conversations','moodle_sync_runs','moodle_items','moodle_courses','moodle_connections','student_achievements','student_activity_events','student_avatar_preferences','student_engagement_preferences','student_message_history','ticker_items','student_notifications','student_pomodoro_sessions','student_pomodoro_settings','student_notification_preferences','student_calendar_events','student_tasks','student_semester_plan_courses','student_semester_plans','auth_sessions','student_completed_courses','student_profiles','users'])await pool.query(`DELETE FROM \`${table}\``);
 const plans=await rows(pool,'SELECT p.id,p.major_id,m.code FROM curriculum_plans p JOIN majors m ON m.id=p.major_id WHERE p.plan_number=4');
 const cs=plans.find(p=>p.code==='CS')!,wmm=plans.find(p=>p.code==='WMM')!,iat=plans.find(p=>p.code==='IAT')!;
 const suffix=randomUUID(),password='Valid-password-2026';
 async function newAccount(major=cs) {
  const agent=request.agent(app),csrfResponse=await agent.get('/api/v1/auth/csrf').expect(200);
  const data={full_name:'طالب اختبار',email:randomUUID()+'@example.test',password,major_id:String(major.major_id),curriculum_plan_id:String(major.id),max_semester_credit_hours:18,preferred_study_mode:'BALANCED'};
  const response=await agent.post('/api/v1/auth/register').set('X-CSRF-Token',csrfResponse.body.csrf_token).send(data).expect(201);
  return {agent,csrf:response.body.csrf_token,data,user:response.body.user};
 }
 let first:Awaited<ReturnType<typeof newAccount>>,second:Awaited<ReturnType<typeof newAccount>>,information:Awaited<ReturnType<typeof newAccount>>;
 await t.test('Registration, bcrypt hashing, HTTP-only cookies and authenticated user',async()=>{
  first=await newAccount();second=await newAccount();information=await newAccount(iat);
  assert.equal(first.user.role,'STUDENT');const stored=await rows(pool,'SELECT password_hash FROM users WHERE id=?',[first.user.id]);assert.ok(stored[0].password_hash.startsWith('$2'));assert.notEqual(stored[0].password_hash,password);
  const me=await first.agent.get('/api/v1/auth/me').expect(200);assert.equal(me.body.data.email,first.data.email);assert.equal(me.body.data.password_hash,undefined);
  const sessionCookies=(await first.agent.get('/api/v1/auth/csrf')).headers['set-cookie'];assert.ok(sessionCookies.some((s:string)=>s.includes('HttpOnly')));
  // Refresh the session-bound CSRF token after fetching it again.
  first.csrf=(await first.agent.get('/api/v1/auth/csrf')).body.csrf_token;
 });
 await t.test('Duplicate email rejected',async()=>{await first.agent.post('/api/v1/auth/register').set('X-CSRF-Token',first.csrf).send(first.data).expect(409);});
 await t.test('Unauthorized private requests rejected',async()=>{await request(app).get('/api/v1/students/me').expect(401);});
 await t.test('Expired session rejected and opaque token hashes stored',async()=>{
  const expired=await newAccount();const sessions=await rows(pool,'SELECT token_hash FROM auth_sessions WHERE user_id=?',[expired.user.id]);assert.match(sessions[0].token_hash,/^[a-f0-9]{64}$/);
  await write(pool,'UPDATE auth_sessions SET expires_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 HOUR) WHERE user_id=?',[expired.user.id]);await expired.agent.get('/api/v1/auth/me').expect(401);
 });
 await t.test('CSRF and malicious origin rejected',async()=>{await first.agent.patch('/api/v1/students/me').send({full_name:'bad'}).expect(403);await first.agent.get('/api/v1/students/me').set('Origin','https://attacker.example').expect(403);});
 await t.test('Cannot self-assign ADMIN or supply another user identity',async()=>{
  await first.agent.patch('/api/v1/students/me').set('X-CSRF-Token',first.csrf).send({role:'ADMIN'}).expect(400);
  await first.agent.post('/api/v1/auth/register').set('X-CSRF-Token',first.csrf).send({...first.data,email:'admin-'+suffix+'@example.test',role:'ADMIN'}).expect(400);
  await first.agent.get('/api/v1/admin/status').expect(403);
  await first.agent.patch('/api/v1/students/me').set('X-CSRF-Token',first.csrf).send({user_id:second.user.id,full_name:'bad'}).expect(400);
 });
 await t.test('Valid profile update and invalid plan/major mismatch',async()=>{
  await first.agent.patch('/api/v1/students/me').set('X-CSRF-Token',first.csrf).send({career_interest:'علم البيانات',preferred_study_mode:'LIGHT'}).expect(200);
  await first.agent.patch('/api/v1/students/me').set('X-CSRF-Token',first.csrf).send({major_id:String(wmm.major_id),curriculum_plan_id:String(cs.id)}).expect(400);
 });
 await t.test('Registration with invalid curriculum rolls back account creation',async()=>{
  const email='invalid-'+suffix+'@example.test';await first.agent.post('/api/v1/auth/register').set('X-CSRF-Token',first.csrf).send({...first.data,email,major_id:String(wmm.major_id)}).expect(400);
  const count=await rows(pool,'SELECT COUNT(*) AS n FROM users WHERE email=?',[email]);assert.equal(Number(count[0].n),0);
 });
 await t.test('Catalog read from MySQL, pagination, Arabic search and classifications',async()=>{
  const response=await request(app).get(`/api/v1/plans/${cs.id}/courses?limit=5`).expect(200);assert.equal(response.body.pagination.total,40);assert.equal(response.body.data.length,5);
  const electives=await request(app).get(`/api/v1/plans/${cs.id}/courses?requirement_type=ELECTIVE`).expect(200);assert.equal(electives.body.pagination.total,14);assert.ok(electives.body.data.every((c:any)=>c.requirement_type==='ELECTIVE'));
  const search=await request(app).get(`/api/v1/plans/${cs.id}/courses`).query({search:'تحليل وتصميم'}).expect(200);assert.equal(search.body.data[0].course_code,'ITCS2323');
  await request(app).get(`/api/v1/plans/${cs.id}/courses?level=invalid`).expect(400);
  const injection=await request(app).get(`/api/v1/plans/${cs.id}/courses`).query({search:"' OR 1=1 --"}).expect(200);assert.equal(injection.body.pagination.total,0);
 });
 await t.test('Plan-specific prerequisites for CS and WMM',async()=>{
  const a=await request(app).get(`/api/v1/plans/${cs.id}/courses/ITCS2323`).expect(200),b=await request(app).get(`/api/v1/plans/${wmm.id}/courses/ITCS2323`).expect(200);
  assert.deepEqual(a.body.data.prerequisites.groups[0].courses,['ITCS1315']);assert.deepEqual(b.body.data.prerequisites.groups[0].courses,['ITMM1303']);
  const ai=await request(app).get(`/api/v1/plans/${cs.id}/courses/ITCS4312`).expect(200);assert.equal(ai.body.data.prerequisites.operator,'AND');assert.equal(ai.body.data.prerequisites.groups.length,2);
 });
 await t.test('Unknown confirmed offerings stay unrecorded; typical semesters are separate',async()=>{
  const data=(await request(app).get(`/api/v1/plans/${cs.id}/courses/ITCS2323`).expect(200)).body.data;assert.equal(data.live_offerings.status,'UNRECORDED');assert.deepEqual(data.live_offerings.records,[]);assert.ok(data.typical_semesters);
 });
 await t.test('Completion insertion, duplicate prevention and plan membership validation',async()=>{
  await first.agent.post('/api/v1/students/me/completed-courses').set('X-CSRF-Token',first.csrf).send({course_code:'ITCS2314'}).expect(201);
  await first.agent.post('/api/v1/students/me/completed-courses').set('X-CSRF-Token',first.csrf).send({course_code:'ITCS2314'}).expect(409);
  await first.agent.post('/api/v1/students/me/completed-courses').set('X-CSRF-Token',first.csrf).send({course_code:'ITMM1201'}).expect(400);
  await first.agent.post('/api/v1/students/me/completed-courses').set('X-CSRF-Token',first.csrf).send({course_code:'ITCS2321',user_id:second.user.id}).expect(400);
 });
 await t.test('Cross-user completion isolation',async()=>{const data=(await second.agent.get('/api/v1/students/me/completed-courses').expect(200)).body.data;assert.deepEqual(data,[]);await second.agent.delete('/api/v1/students/me/completed-courses/ITCS2314').set('X-CSRF-Token',second.csrf).expect(404);});
 await t.test('AND evaluator from real MySQL responds to declared completions',async()=>{
  let result=(await first.agent.get('/api/v1/students/me/courses/ITCS4312/prerequisites').expect(200)).body.data;assert.equal(result.satisfied,false);assert.deepEqual(result.missing_prerequisite_groups[0].alternatives,['ITCS2321']);
  await first.agent.post('/api/v1/students/me/completed-courses').set('X-CSRF-Token',first.csrf).send({course_code:'ITCS2321'}).expect(201);
  result=(await first.agent.get('/api/v1/students/me/courses/ITCS4312/prerequisites').expect(200)).body.data;assert.equal(result.satisfied,true);
  const noAutomatic=(await first.agent.get('/api/v1/students/me/completed-courses')).body.data;assert.ok(!noAutomatic.some((c:any)=>c.course_code==='ITCS1315'));
  const research=(await first.agent.get('/api/v1/students/me/courses/ITCS4215/prerequisites')).body.data;assert.equal(research.groups.length,2);assert.equal(research.satisfied,false);
 });
 await t.test('Credits and elective targets do not require all elective options',async()=>{
  await first.agent.post('/api/v1/students/me/completed-courses').set('X-CSRF-Token',first.csrf).send({course_code:'ITAP1311'}).expect(201);
  const result=(await first.agent.get('/api/v1/students/me/progress').expect(200)).body.data;
  assert.equal(result.known_completed_credit_hours,9);assert.equal(result.completed_required_courses,2);assert.equal(result.completed_elective_hours,3);assert.equal(result.required_elective_hours,12);assert.equal(result.is_degree_audit_complete,false);assert.equal(result.degree_completion_percentage,undefined);
 });
 await t.test('Plan changes require confirmation and never transfer completions',async()=>{
  const change={major_id:String(wmm.major_id),curriculum_plan_id:String(wmm.id)};
  await first.agent.patch('/api/v1/students/me').set('X-CSRF-Token',first.csrf).send(change).expect(409);
  await first.agent.patch('/api/v1/students/me').set('X-CSRF-Token',first.csrf).send({...change,confirm_plan_change:true}).expect(200);
  assert.deepEqual((await first.agent.get('/api/v1/students/me/completed-courses')).body.data,[]);
  await first.agent.patch('/api/v1/students/me').set('X-CSRF-Token',first.csrf).send({major_id:String(cs.major_id),curriculum_plan_id:String(cs.id),confirm_plan_change:true}).expect(200);
  assert.equal((await first.agent.get('/api/v1/students/me/completed-courses')).body.data.length,3);
 });
 await t.test('Unknown IAT hours and classifications are preserved',async()=>{
  await information.agent.post('/api/v1/students/me/completed-courses').set('X-CSRF-Token',information.csrf).send({course_code:'ITAP3200'}).expect(201);
  const p=(await information.agent.get('/api/v1/students/me/progress').expect(200)).body.data;assert.equal(p.known_completed_credit_hours,null);assert.equal(p.completed_credit_summary.unknown_credit_course_count,1);assert.equal(p.required_elective_hours,null);assert.equal(p.completed_elective_hours,null);assert.equal(p.completed_unverified_courses,1);
  assert.equal((await information.agent.get('/api/v1/students/me/courses/ITCS2323/prerequisites')).body.data.satisfied,null);
 });
 await t.test('Remove completion only from authenticated account',async()=>{await first.agent.delete('/api/v1/students/me/completed-courses/ITAP1311').set('X-CSRF-Token',first.csrf).expect(204);assert.equal((await first.agent.get('/api/v1/students/me/completed-courses')).body.data.length,2);});
 await t.test('Logout revokes server-side session and login rotates it',async()=>{
  await first.agent.post('/api/v1/auth/logout').set('X-CSRF-Token',first.csrf).expect(204);await first.agent.get('/api/v1/auth/me').expect(401);
  const csrf=(await first.agent.get('/api/v1/auth/csrf')).body.csrf_token;
  await first.agent.post('/api/v1/auth/login').set('X-CSRF-Token',csrf).send({email:first.data.email,password:'wrong-password'}).expect(401);
  const login=await first.agent.post('/api/v1/auth/login').set('X-CSRF-Token',csrf).send({email:first.data.email,password}).expect(200);first.csrf=login.body.csrf_token;await first.agent.get('/api/v1/auth/me').expect(200);
 });
 await t.test('Login rate limiting and health',async()=>{
  const limited=request.agent(createApp(pool,config,2)),csrf=(await limited.get('/api/v1/auth/csrf')).body.csrf_token;
  for(let i=0;i<2;i++)await limited.post('/api/v1/auth/login').set('X-CSRF-Token',csrf).send({email:'nobody@example.test',password}).expect(401);
  await limited.post('/api/v1/auth/login').set('X-CSRF-Token',csrf).send({email:'nobody@example.test',password}).expect(429);
  await request(app).get('/health').expect(200);
 });
 await t.test('ADMIN role authorizes only the admin route',async()=>{
  const admin=await newAccount();await write(pool,"UPDATE users SET role='ADMIN' WHERE id=?",[admin.user.id]);await admin.agent.get('/api/v1/admin/status').expect(200);await admin.agent.get('/api/v1/students/me').expect(403);
 });
 await t.test('Application database user cannot write academic tables',async()=>{
  await assert.rejects(()=>write(pool,'UPDATE courses SET name_ar=name_ar WHERE course_code=?',['ITCS2323']),e=>(e as any).code==='ER_TABLEACCESS_DENIED_ERROR');
 });
});
