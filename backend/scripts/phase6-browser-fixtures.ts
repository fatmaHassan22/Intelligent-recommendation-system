// Disposable browser QA data only. Refuses the actual project database.
import request from 'supertest';
import {loadConfig} from '../src/config.js';
import {createPool,rows,write} from '../src/db.js';
import {createApp} from '../src/app.js';
const c=loadConfig();if(c.NODE_ENV!=='test'||c.DB_NAME!=='academic_support_phase6_test')throw new Error('Isolated browser QA database required');
const pool=createPool(c),app=createApp(pool,c,100);
try{
 const plan=(await rows(pool,"SELECT p.id,p.major_id FROM curriculum_plans p JOIN majors m ON m.id=p.major_id WHERE m.code='CS' AND p.plan_number=4"))[0];
 async function create(email:string,name:string){const agent=request.agent(app),csrf=(await agent.get('/api/v1/auth/csrf')).body.csrf_token;const r=await agent.post('/api/v1/auth/register').set('X-CSRF-Token',csrf).send({email,full_name:name,password:'Engagement-Browser-QA-2026!',major_id:String(plan.major_id),curriculum_plan_id:String(plan.id),max_semester_credit_hours:18,preferred_study_mode:'BALANCED'}).expect(201);return {agent,user:r.body.user.id,token:r.body.csrf_token};}
 if(!(await rows(pool,"SELECT id FROM users WHERE email='phase6.browser.qa@example.test'")).length){await create('phase6.browser.qa@example.test','حساب فحص التفاعل');const admin=await create('phase6.admin.qa@example.test','مسؤول فحص معزول');await write(pool,"UPDATE users SET role='ADMIN' WHERE id=?",[admin.user]);await admin.agent.post('/api/v1/admin/ticker').set('X-CSRF-Token',admin.token).send({title:'خطوة صغيرة تكفي للبداية',description:'رسالة تعليمية أضافها مسؤول الفحص في قاعدة الاختبار: اختاري مهمة تناسب وقتك وطاقتك.',category:'LIGHTHEARTED',published_at:new Date(Date.now()-60000).toISOString(),expires_at:new Date(Date.now()+86400000).toISOString(),is_active:true}).expect(201);}
 console.log('Disposable browser account and administrator-created educational message ready in Phase 6 test database only.');
}finally{await pool.end();}
