import {test} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {loadConfig} from '../src/config.js';
import {createPool,rows} from '../src/db.js';
import {createApp} from '../src/app.js';
import {snapshot} from '../scripts/snapshot.js';

test('Planner APIs use isolated MySQL, own drafts and preserve academic records',async t=>{
 const config=loadConfig();assert.equal(config.NODE_ENV,'test');assert.ok(config.DB_NAME.endsWith('_test')&&config.DB_NAME!=='academic_support');
 const pool=createPool(config),live=createPool({...config,DB_NAME:'academic_support'}),before=await snapshot(live),testBefore=await snapshot(pool),app=createApp(pool,config,100);
 t.after(async()=>{try{const after=await snapshot(live),testAfter=await snapshot(pool);assert.deepEqual(after,before);assert.deepEqual(testAfter,testBefore);await writeFile(new URL('../../reports/phase4-test-preservation.json',import.meta.url),JSON.stringify({production_database:'academic_support',test_database:config.DB_NAME,academic_tables_unchanged:true,before,after},null,2));}finally{await pool.end();await live.end();}});
 const majors=await rows(pool,'SELECT p.id,p.major_id,m.code FROM curriculum_plans p JOIN majors m ON m.id=p.major_id WHERE p.plan_number=4');
 async function account(code='CS'){
  const major=majors.find(m=>m.code===code)!,agent=request.agent(app),token=(await agent.get('/api/v1/auth/csrf')).body.csrf_token;
  const data={full_name:'اختبار المخطط',email:randomUUID()+'@example.test',password:'Planner-test-2026!',major_id:String(major.major_id),curriculum_plan_id:String(major.id),max_semester_credit_hours:5,preferred_study_mode:'BALANCED'};
  const r=await agent.post('/api/v1/auth/register').set('X-CSRF-Token',token).send(data).expect(201);
  return {agent,token:r.body.csrf_token,data,major};
 }
 const cs=await account(),wmm=await account('WMM'),iat=await account('IAT');let draft:any;
 const post=(path:string,body:unknown)=>cs.agent.post('/api/v1/students/me'+path).set('X-CSRF-Token',cs.token).send(body);
 await t.test('Current curricula stay distinct, with plan-specific prerequisite alternatives',async()=>{
  for(const [a,n] of [[cs,40],[wmm,38],[iat,38]] as const){const r=await a.agent.get('/api/v1/students/me/recommendations?limit=100').expect(200);assert.equal(r.body.pagination.total,n);assert.equal(r.body.curriculum_plan_id,String(a.major.id));}
  const c=(await cs.agent.get('/api/v1/students/me/recommendations/ITCS2323')).body.data,w=(await wmm.agent.get('/api/v1/students/me/recommendations/ITCS2323')).body.data;
  assert.deepEqual(c.prerequisites.groups[0].courses,['ITCS1315']);assert.deepEqual(w.prerequisites.groups[0].courses,['ITMM1303']);
  const i=(await iat.agent.get('/api/v1/students/me/recommendations/ITAP3200')).body.data;assert.equal(i.credit_hours,null);assert.equal(i.category,'UNVERIFIED');assert.equal(i.offering_status,'NOT_RECORDED');
  const review=(await cs.agent.get('/api/v1/students/me/recommendations/ITCS3329')).body.data;assert.equal(review.category,'UNVERIFIED');assert.ok(review.reasons.some((r:any)=>r.code==='OPEN_ACADEMIC_REVIEW'));
 });
 await t.test('CSRF and unknown identity fields rejected',async()=>{
  await cs.agent.post('/api/v1/students/me/semester-plans').send({name:'bad'}).expect(403);
  await post('/semester-plans',{name:'bad',user_id:'2'}).expect(400);
  await request(app).get('/api/v1/students/me/semester-plans').expect(401);
 });
 await t.test('Create, save, reopen and list persistent drafts',async()=>{
  draft=(await post('/semester-plans',{name:'مسودة اختبار'}).expect(201)).body.data;
  assert.equal(draft.curriculum_plan_id,String(cs.major.id));assert.equal(draft.status,'DRAFT');
  const reopened=(await cs.agent.get(`/api/v1/students/me/semester-plans/${draft.id}`).expect(200)).body.data;assert.equal(reopened.name,'مسودة اختبار');assert.equal(reopened.validation.fully_validated,false);
  assert.ok((await cs.agent.get('/api/v1/students/me/semester-plans')).body.data.some((p:any)=>p.id===draft.id));
 });
 await t.test('Cross-user read, patch, delete, add, remove, validation and recommendations rejected',async()=>{
  for(const suffix of ['', '/validation'])await wmm.agent.get(`/api/v1/students/me/semester-plans/${draft.id}${suffix}`).expect(404);
  await wmm.agent.patch(`/api/v1/students/me/semester-plans/${draft.id}`).set('X-CSRF-Token',wmm.token).send({name:'bad',expected_revision:1}).expect(404);
  await wmm.agent.delete(`/api/v1/students/me/semester-plans/${draft.id}`).set('X-CSRF-Token',wmm.token).send({expected_revision:1}).expect(404);
  await wmm.agent.post(`/api/v1/students/me/semester-plans/${draft.id}/courses`).set('X-CSRF-Token',wmm.token).send({course_code:'ITCS1311',expected_revision:1}).expect(404);
  await wmm.agent.delete(`/api/v1/students/me/semester-plans/${draft.id}/courses/ITCS1311`).set('X-CSRF-Token',wmm.token).send({expected_revision:1}).expect(404);
  await wmm.agent.get(`/api/v1/students/me/recommendations?draft_id=${draft.id}`).expect(404);
 });
 await t.test('Add, duplicate prevention and membership enforced in database',async()=>{
  draft=(await post(`/semester-plans/${draft.id}/courses`,{course_code:'ITCS1311',expected_revision:draft.revision}).expect(201)).body.data;
  assert.equal(draft.validation.credit_summary.known_credit_hours,3);
  await post(`/semester-plans/${draft.id}/courses`,{course_code:'ITCS1311',expected_revision:draft.revision}).expect(409);
  await post(`/semester-plans/${draft.id}/courses`,{course_code:'ITMM1201',expected_revision:draft.revision}).expect(400);
 });
 await t.test('Stale edits and concurrent writes cannot silently overwrite newer drafts',async()=>{
  await cs.agent.patch(`/api/v1/students/me/semester-plans/${draft.id}`).set('X-CSRF-Token',cs.token).send({name:'stale',expected_revision:1}).expect(409);
  const responses=await Promise.all(['ITCS1313','ITAP1311'].map(code=>post(`/semester-plans/${draft.id}/courses`,{course_code:code,expected_revision:draft.revision})));
  assert.deepEqual(responses.map(r=>r.status).sort(),[201,409]);draft=responses.find(r=>r.status===201)!.body.data;
  assert.equal(draft.validation.credit_summary.known_credit_hours,6);assert.equal(draft.validation.fully_validated,false);assert.equal(draft.validation.credit_summary.exceeds_configured_max,true);
 });
 await t.test('Over-limit recommendations block further known credits',async()=>{
  const r=await cs.agent.get(`/api/v1/students/me/recommendations/ITCS2323?draft_id=${draft.id}`).expect(200);assert.equal(r.body.data.category,'BLOCKED');assert.ok(r.body.data.reasons.some((x:any)=>x.code==='CREDIT_LIMIT'));
 });
 await t.test('Completed exclusion, revalidation and no automatic prerequisites',async()=>{
  await post('/completed-courses',{course_code:'ITCS1311'}).expect(201);
  const r=await cs.agent.get('/api/v1/students/me/recommendations?limit=100').expect(200);assert.ok(!r.body.data.some((c:any)=>c.course_code==='ITCS1311'));
  assert.equal((await cs.agent.get('/api/v1/students/me/recommendations/ITCS1311')).body.data.category,'BLOCKED');
  const another=(await post('/semester-plans',{name:'مسودة ثانية'}).expect(201)).body.data;
  await post(`/semester-plans/${another.id}/courses`,{course_code:'ITCS1311',expected_revision:another.revision}).expect(409);
  assert.equal((await cs.agent.get(`/api/v1/students/me/semester-plans/${draft.id}/validation`)).body.data.fully_validated,false);
  const completed=(await cs.agent.get('/api/v1/students/me/completed-courses')).body.data;assert.equal(completed.length,1);
 });
 await t.test('Rename and study mode saved; invalid term or validated flag rejected',async()=>{
  await cs.agent.patch(`/api/v1/students/me/semester-plans/${draft.id}`).set('X-CSRF-Token',cs.token).send({status:'VALIDATED',expected_revision:draft.revision}).expect(400);
  await post('/semester-plans',{name:'bad',academic_term_id:'9999999'}).expect(400);
  draft=(await cs.agent.patch(`/api/v1/students/me/semester-plans/${draft.id}`).set('X-CSRF-Token',cs.token).send({name:'مسودة معدلة',study_mode:'LIGHT',expected_revision:draft.revision}).expect(200)).body.data;assert.equal(draft.name,'مسودة معدلة');assert.equal(draft.study_mode,'LIGHT');
 });
 await t.test('Curriculum changes preserve old drafts and use their original curriculum',async()=>{
  await cs.agent.patch('/api/v1/students/me').set('X-CSRF-Token',cs.token).send({major_id:String(wmm.major.major_id),curriculum_plan_id:String(wmm.major.id),confirm_plan_change:true}).expect(200);
  const old=(await cs.agent.get(`/api/v1/students/me/semester-plans/${draft.id}`)).body.data;assert.equal(old.curriculum_plan_id,String(cs.major.id));assert.equal(old.is_current_curriculum_plan,false);
  assert.equal((await cs.agent.get(`/api/v1/students/me/recommendations?draft_id=${draft.id}`)).body.curriculum_plan_id,String(cs.major.id));
  const newPlan=(await post('/semester-plans',{name:'خطة التخصص الجديد'}).expect(201)).body.data;assert.equal(newPlan.curriculum_plan_id,String(wmm.major.id));
  await cs.agent.patch('/api/v1/students/me').set('X-CSRF-Token',cs.token).send({major_id:String(cs.major.major_id),curriculum_plan_id:String(cs.major.id),confirm_plan_change:true}).expect(200);
 });
 await t.test('Remove and delete persist, with child course cleanup',async()=>{
  const code=draft.validation.courses[0].course_code;
  draft=(await cs.agent.delete(`/api/v1/students/me/semester-plans/${draft.id}/courses/${code}`).set('X-CSRF-Token',cs.token).send({expected_revision:draft.revision}).expect(200)).body.data;
  assert.equal(draft.validation.courses.length,1);
  await cs.agent.delete(`/api/v1/students/me/semester-plans/${draft.id}`).set('X-CSRF-Token',cs.token).send({expected_revision:draft.revision}).expect(204);
  await cs.agent.get(`/api/v1/students/me/semester-plans/${draft.id}`).expect(404);
  assert.equal(Number((await rows(pool,'SELECT COUNT(*) AS n FROM student_semester_plan_courses WHERE semester_plan_id=?',[draft.id]))[0].n),0);
 });
 await t.test('Recommendation modes, deterministic ranking, filters and terms API',async()=>{
  for(const mode of ['LIGHT','BALANCED','FAST_GRADUATION']){const a=(await cs.agent.get(`/api/v1/students/me/recommendations?study_mode=${mode}&limit=100`)).body,b=(await cs.agent.get(`/api/v1/students/me/recommendations?study_mode=${mode}&limit=100`)).body;assert.deepEqual(a,b);assert.equal(a.study_mode,mode);assert.ok(a.data.every((c:any)=>c.workload_score===null));}
  const a=await cs.agent.get('/api/v1/students/me/recommendations?category=SUITABLE&requirement_type=REQUIRED&search=رياضيات').expect(200);assert.ok(a.body.data.every((c:any)=>c.category==='SUITABLE'&&c.requirement_type==='REQUIRED'&&c.name_ar.includes('رياضيات')));
  await cs.agent.get('/api/v1/students/me/academic-terms').expect(200);
 });
 await t.test('Student database account cannot manufacture official offering evidence',async()=>{await assert.rejects(()=>pool.execute('UPDATE planner_offering_evidence SET source_reference=source_reference WHERE course_offering_id=0'),e=>(e as any).code==='ER_TABLEACCESS_DENIED_ERROR');});
});

