import {test} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {randomUUID,createECDH} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {loadConfig} from '../src/config.js';
import {createPool,rows,write} from '../src/db.js';
import {createApp} from '../src/app.js';
import {configureMoodle,syncMoodle,disconnectMoodle} from '../src/modules/moodle/service.js';
import {runMoodleMonitoring} from '../src/modules/moodle/worker.js';
import {deliverPush,enqueuePush} from '../src/modules/push/service.js';
import {fixtureBrowserAdapter,type VerifiedFixturePage} from '../src/modules/moodle/browser-boundary.js';
import {encryptToken} from '../src/modules/moodle/security.js';
import type {MoodleSnapshot,MoodleAdapter} from '../src/modules/moodle/adapter.js';
import {sqlDate} from '../src/modules/productivity/time.js';
test('Phase 8B: isolated monitoring, baseline, resources, deadlines, consent and durable private device push',async t=>{
 const base=loadConfig();assert.equal(base.NODE_ENV,'test');assert.ok(base.DB_NAME.endsWith('_test'));
 const vapid=createECDH('prime256v1');vapid.generateKeys();
 const c={...base,PUSH_ENABLED:true,PUSH_ENCRYPTION_KEY:'b'.repeat(64),VAPID_PUBLIC_KEY:vapid.getPublicKey().toString('base64url'),VAPID_PRIVATE_KEY:vapid.getPrivateKey().toString('base64url'),VAPID_SUBJECT:'mailto:test@example.test',MOODLE_BASE_URL:'https://moodle.alaqsa.edu.ps',MOODLE_ENCRYPTION_KEY:'c'.repeat(64),MOODLE_SYNC_ENABLED:true};
 const pool=createPool(c);t.after(()=>pool.end());let now=new Date('2026-10-17T08:00:00Z');
 const page=JSON.parse(await readFile(new URL('./fixtures/moodle-authorized-page.json',import.meta.url),'utf8')) as VerifiedFixturePage;
 let snapshot=structuredClone(page.snapshot),calls=0;const adapter:MoodleAdapter={fetchSnapshot:async()=>{calls++;return structuredClone(snapshot);}},app=createApp(pool,c,200,()=>now,{moodle:adapter});
 const plan=(await rows(pool,'SELECT id,major_id FROM curriculum_plans LIMIT 1'))[0];
 async function account(){const agent=request.agent(app),csrf=(await agent.get('/api/v1/auth/csrf')).body.csrf_token;const r=await agent.post('/api/v1/auth/register').set('X-CSRF-Token',csrf).send({full_name:'Phase8B fixture',email:randomUUID()+'@example.test',password:'Phase8B-fixture-only',major_id:String(plan.major_id),curriculum_plan_id:String(plan.id),max_semester_credit_hours:18,preferred_study_mode:'BALANCED'}).expect(201);return {agent,user:String(r.body.user.id),csrf:r.body.csrf_token};}
 const a=await account(),b=await account(),path='/api/v1/students/me';const mutate=(suffix:string,body:unknown)=>a.agent.post(path+suffix).set('X-CSRF-Token',a.csrf).send(body);
 const notices=async()=>rows(pool,'SELECT * FROM student_notifications WHERE user_id=?',[a.user]);
 await t.test('A fixture browser driver is test-only, isolated, and detects expired login pages',async()=>{
  let owner='';const fixture=fixtureBrowserAdapter(c,a.user,async user=>{owner=user;return page;});assert.equal((await fixture.fetchSnapshot('',now,AbortSignal.timeout(1000))).items.length,1);assert.equal(owner,a.user);
  const expired=JSON.parse(await readFile(new URL('./fixtures/moodle-expired-page.json',import.meta.url),'utf8'));await assert.rejects(()=>fixtureBrowserAdapter(c,a.user,async()=>expired).fetchSnapshot('',now,AbortSignal.timeout(1000)),/MOODLE_AUTHENTICATION_FAILED/);
  assert.throws(()=>fixtureBrowserAdapter({...c,NODE_ENV:'production'},a.user,async()=>page),/MOODLE_BROWSER_NOT_VERIFIED/);
 });
 await t.test('Monitoring requires explicit student opt-in; initial snapshot is a silent baseline',async()=>{
  await configureMoodle(pool,c,a.user,'fixture-institution-token',true,now);
  assert.equal((await runMoodleMonitoring(pool,c,now,adapter)).attempted,0);assert.equal(calls,0);
  await mutate('/moodle/monitoring',{enabled:true}).expect(200);await runMoodleMonitoring(pool,c,now,adapter);assert.equal((await notices()).length,0);assert.equal(calls,1);
  assert.equal((await runMoodleMonitoring(pool,c,new Date(now.getTime()+359*60000),adapter)).attempted,0);
 });
 await t.test('Verified new assignment and resource produce unique notices and calendar projections',async()=>{
  snapshot.items.push({external_id:'assignment:1',external_course_id:'91',kind:'ASSIGNMENT',title:'واجب محلي',description:'fixture',due_at:'2026-10-20T12:00:00Z',published_at:null,source_url:c.MOODLE_BASE_URL+'/mod/assign/view.php?id=1',metadata:{fixture:true}},{...snapshot.items[0],external_id:'module:602',title:'مورد ثانٍ'});
  snapshot.items.push({...snapshot.items[0],external_id:'file:602:fixture',title:'ملف تابع للمورد الجديد'});
  now=new Date(now.getTime()+360*60000);await runMoodleMonitoring(pool,c,now,adapter);const first=await notices();assert.equal(first.filter(n=>n.type==='MOODLE_NEW_ITEM').length,2);assert.equal(first.length,2,'New assignment must not generate a second deadline notification for the same addition');assert.ok(first.some(n=>n.message.includes('مساق اختبار محلي')));
  await syncMoodle(pool,c,a.user,new Date(now.getTime()+31000),adapter);assert.equal((await notices()).length,first.length);assert.equal(first.filter(n=>n.type==='MOODLE_NEW_ITEM').length,2,'Module plus its child metadata must not create duplicate notices');
  const calendar=await a.agent.get(path+'/calendar?from=2026-10-19T00:00:00Z&to=2026-10-22T00:00:00Z').expect(200);assert.equal(calendar.body.data.moodle_events.length,1);assert.equal((await b.agent.get(path+'/moodle/events')).body.data.length,0);
  snapshot.items.find(i=>i.kind==='ASSIGNMENT')!.due_at='2026-10-21T12:00:00Z';await syncMoodle(pool,c,a.user,new Date(now.getTime()+62000),adapter);assert.ok((await rows(pool,"SELECT due_at FROM moodle_items WHERE user_id=? AND kind='ASSIGNMENT'",[a.user]))[0].due_at.startsWith('2026-10-21 12:00:00'));
 });
 let device:string;
 await t.test('Device subscriptions are encrypted, owner-scoped and endpoint-validated',async()=>{
  const ec=createECDH('prime256v1');ec.generateKeys();const subscription={endpoint:'https://fcm.googleapis.com/fcm/send/'+randomUUID(),keys:{p256dh:ec.getPublicKey().toString('base64url'),auth:Buffer.alloc(16,3).toString('base64url')}};
  await mutate('/push/subscriptions',{subscription,device_label:'هاتف اختبار'}).expect(201);const r=await a.agent.get(path+'/push/status').expect(200);device=r.body.data.devices[0].id;assert.equal(r.body.data.devices[0].detailed,0);assert.equal(r.body.data.devices[0].subscription_cipher,undefined);
  const saved=(await rows(pool,'SELECT subscription_cipher FROM push_subscriptions WHERE id=?',[device]))[0];assert.ok(!saved.subscription_cipher.includes(subscription.endpoint));
  await b.agent.post(path+'/push/subscriptions').set('X-CSRF-Token',b.csrf).send({subscription,device_label:'other'}).expect(409);
  await b.agent.delete(path+'/push/subscriptions/'+device).set('X-CSRF-Token',b.csrf).expect(204);assert.equal((await rows(pool,'SELECT id FROM push_subscriptions WHERE id=?',[device])).length,1);
  await mutate('/push/subscriptions',{subscription:{...subscription,endpoint:'https://127.0.0.1/private'},device_label:'bad'}).expect(400);
  await write(pool,'UPDATE push_subscriptions SET created_at=? WHERE id=?',[sqlDate(new Date(now.getTime()-86400000)),device]);
 });
 await t.test('Durable outbox deduplicates; default payload is private and permanent expiry disables device',async()=>{
  await enqueuePush(pool,now);await enqueuePush(pool,now);const jobs=await rows(pool,'SELECT * FROM push_deliveries WHERE user_id=?',[a.user]);assert.ok(jobs.length>0);const replayJob=(await rows(pool,"SELECT d.id FROM push_deliveries d JOIN student_notifications n ON n.id=d.notification_id WHERE d.user_id=? AND n.type='MOODLE_NEW_ITEM' AND n.dismissed_at IS NULL ORDER BY d.id LIMIT 1",[a.user]))[0];assert.ok(replayJob);assert.equal(new Set(jobs.map(j=>String(j.notification_id))).size,jobs.length);
  const payloads:string[]=[];const sender=async(_s:unknown,payload:string)=>{payloads.push(payload);return 201;};await deliverPush(pool,c,now,sender);await deliverPush(pool,c,now,sender);assert.ok(payloads.length);assert.ok(payloads.every(p=>!p.includes('مساق اختبار محلي')&&!p.includes('واجب محلي')));
  await write(pool,'UPDATE push_subscriptions SET detailed=1 WHERE id=?',[device]);await write(pool,"UPDATE push_deliveries SET status='PENDING',next_attempt_at=?,attempts=0 WHERE id=?",[sqlDate(now),replayJob.id]);await deliverPush(pool,c,now,sender);assert.ok(payloads.at(-1)!.includes('مساق اختبار محلي'));
  await write(pool,'UPDATE push_subscriptions SET detailed=1 WHERE id=?',[device]);await write(pool,"UPDATE push_deliveries d JOIN student_notifications n ON n.id=d.notification_id SET d.status='PENDING',d.next_attempt_at=?,d.attempts=0 WHERE d.user_id=? AND n.type='MOODLE_NEW_ITEM' AND n.dismissed_at IS NULL",[sqlDate(now),a.user]);const consentPayloads:string[]=[];await deliverPush(pool,c,now,async(_s,payload)=>{consentPayloads.push(payload);await write(pool,'UPDATE push_subscriptions SET detailed=0 WHERE id=?',[device]);return 201;});assert.ok(consentPayloads.length>=2);assert.ok(consentPayloads[0].includes('مساق اختبار محلي'));assert.ok(!consentPayloads[1].includes('مساق اختبار محلي'),'Revoked details must be rechecked for the next message in the batch');
  
  await write(pool,"UPDATE push_deliveries SET status='PENDING',next_attempt_at=?,attempts=0 WHERE id=?",[sqlDate(now),replayJob.id]);await deliverPush(pool,c,now,async()=>410);assert.equal((await rows(pool,'SELECT enabled FROM push_subscriptions WHERE id=?',[device]))[0].enabled,0);
  await write(pool,"UPDATE push_deliveries SET status='PENDING',attempts=4,next_attempt_at=? WHERE id=?",[sqlDate(now),replayJob.id]);let unexpectedSend=false;await deliverPush(pool,c,now,async()=>{unexpectedSend=true;return 201;});assert.equal(unexpectedSend,false);assert.equal((await rows(pool,'SELECT status,error_code FROM push_deliveries WHERE id=?',[replayJob.id]))[0].error_code,'PUSH_RETRY_LIMIT');
 });
 await t.test('Categories suppress new resource notices; disconnect stops schedules and preserves records',async()=>{
  const n=(await notices()).length;await a.agent.patch(path+'/moodle/preferences').set('X-CSRF-Token',a.csrf).send({notifications_enabled:true,notification_categories:['QUIZ']}).expect(200);
  snapshot.items.push({...snapshot.items[0],external_id:'module:603'});await syncMoodle(pool,c,a.user,new Date(now.getTime()+93000),adapter);assert.equal((await notices()).length,n);
  const oldCalls=calls;await disconnectMoodle(pool,c,a.user,now);await runMoodleMonitoring(pool,c,new Date(now.getTime()+86400000),adapter);assert.equal(calls,oldCalls);assert.equal((await rows(pool,'SELECT token_cipher,monitoring_opt_in FROM moodle_connections WHERE user_id=?',[a.user]))[0].token_cipher,null);
 });
 await t.test('Failed sync keeps prior snapshot, persists retry history and stops expired authorizations',async()=>{
  await configureMoodle(pool,c,b.user,'fixture-second-token',true,now);await write(pool,'UPDATE moodle_connections SET monitoring_opt_in=1 WHERE user_id=?',[b.user]);
  const expired=fixtureBrowserAdapter(c,b.user,async()=>JSON.parse(await readFile(new URL('./fixtures/moodle-expired-page.json',import.meta.url),'utf8')));await runMoodleMonitoring(pool,c,now,expired);
  const state=(await rows(pool,'SELECT state,enabled,retry_count,next_sync_at FROM moodle_connections WHERE user_id=?',[b.user]))[0];assert.equal(state.state,'AUTHENTICATION_FAILED');assert.equal(state.enabled,0);assert.equal(state.retry_count,1);assert.ok(state.next_sync_at);assert.equal((await runMoodleMonitoring(pool,c,new Date(now.getTime()+360*60000),adapter)).attempted,0);
 });
});
