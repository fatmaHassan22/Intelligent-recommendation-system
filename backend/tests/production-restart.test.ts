import {test} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {randomUUID} from 'node:crypto';
import {loadConfig} from '../src/config.js';
import {createPool,rows} from '../src/db.js';
import {createApp} from '../src/app.js';
test('Production sessions and session-bound CSRF survive a fresh app and DB pool',async()=>{
 const base=loadConfig();assert.equal(base.NODE_ENV,'test');assert.ok(base.DB_NAME.endsWith('_test'));
 const c={...base,NODE_ENV:'production' as const,COOKIE_SECURE:true,BCRYPT_ROUNDS:12,CORS_ORIGINS:'https://localhost:8443',TRUST_PROXY_HOPS:1};
 let pool=createPool(c),id:string|undefined;
 try {
  const app=createApp(pool,c),plan=(await rows(pool,'SELECT id,major_id FROM curriculum_plans LIMIT 1'))[0];
  const csrf=await request(app).get('/api/v1/auth/csrf').set('X-Forwarded-Proto','https').expect(200);
  const registered=await request(app).post('/api/v1/auth/register').set('X-Forwarded-Proto','https').set('Origin',c.CORS_ORIGINS).set('Cookie',csrf.headers['set-cookie'].map((s:string)=>s.split(';')[0])).set('X-CSRF-Token',csrf.body.csrf_token).send({full_name:'طالب اختبار إنتاج',email:randomUUID()+'@example.test',password:'Production-fixture-2026',major_id:String(plan.major_id),curriculum_plan_id:String(plan.id),max_semester_credit_hours:18,preferred_study_mode:'BALANCED'}).expect(201);
  id=String(registered.body.user.id);
  const cookies=registered.headers['set-cookie'].map((s:string)=>s.split(';')[0]);
  await pool.end();pool=createPool(c);
  const restarted=createApp(pool,c);
  const me=await request(restarted).get('/api/v1/auth/me').set('X-Forwarded-Proto','https').set('Cookie',cookies).expect(200);assert.equal(String(me.body.data.id),id);
  await request(restarted).post('/api/v1/auth/logout').set('X-Forwarded-Proto','https').set('Cookie',cookies).set('X-CSRF-Token',registered.body.csrf_token).expect(204);
 }finally {try{if(id){await pool.query('DELETE FROM auth_sessions WHERE user_id=?',[id]);await pool.query('DELETE FROM student_profiles WHERE user_id=?',[id]);await pool.query('DELETE FROM users WHERE id=?',[id]);}}finally{await pool.end();}}
});
