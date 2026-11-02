// Browser QA account only, never creates a live Gemini reply or Moodle record.
import request from 'supertest';
import {loadConfig} from '../src/config.js';
import {createPool,rows} from '../src/db.js';
import {createApp} from '../src/app.js';
const c=loadConfig();if(c.NODE_ENV!=='test'||c.DB_NAME!=='academic_support_phase7_test')throw new Error('Isolated Phase 7 browser database required');
const pool=createPool(c),app=createApp(pool,{...c,GEMINI_API_KEY:'',MOODLE_BASE_URL:'',MOODLE_ENCRYPTION_KEY:''},100);
try{if(!(await rows(pool,"SELECT id FROM users WHERE email='phase7.browser.qa@example.test'")).length){const plan=(await rows(pool,"SELECT p.id,p.major_id FROM curriculum_plans p JOIN majors m ON m.id=p.major_id WHERE m.code='CS' AND p.plan_number=4"))[0],agent=request.agent(app),csrf=(await agent.get('/api/v1/auth/csrf')).body.csrf_token;await agent.post('/api/v1/auth/register').set('X-CSRF-Token',csrf).send({email:'phase7.browser.qa@example.test',full_name:'حساب فحص المساعد',password:'Phase7-Browser-QA-2026!',major_id:String(plan.major_id),curriculum_plan_id:String(plan.id),max_semester_credit_hours:18,preferred_study_mode:'BALANCED'}).expect(201);}console.log('Isolated browser student prepared. No Gemini calls or Moodle data were created.');}finally{await pool.end();}
