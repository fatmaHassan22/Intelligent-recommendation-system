import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadConfig} from '../src/config.js';
import {createPool,rows} from '../src/db.js';
import {snapshot} from './snapshot.js';
const c=loadConfig();if(c.DB_NAME!=='academic_support')throw new Error('This script only fingerprints the actual project');const pool=createPool(c);
try{
 const previous:Record<string,unknown>={};
 for(const name of ['users','student_profiles','auth_sessions','student_completed_courses','student_semester_plans','student_semester_plan_courses','planner_offering_evidence','student_tasks','student_calendar_events','student_pomodoro_settings','student_pomodoro_sessions','student_notification_preferences','student_notifications']){const data=await rows(pool,`SELECT * FROM ${name}`);previous[name]={count:data.length,sha256:createHash('sha256').update(data.map(row=>JSON.stringify(row)).sort().join('\n')).digest('hex')};}
 const current={academic:await snapshot(pool),previous},path=new URL('../../reports/phase6-preservation.json',import.meta.url);
 if(process.argv.includes('--before'))await writeFile(path,JSON.stringify({before:current},null,2));
 else{const report=JSON.parse(await readFile(path,'utf8'));report.after=current;report.unchanged=JSON.stringify(report.before)===JSON.stringify(current);await writeFile(path,JSON.stringify(report,null,2));if(!report.unchanged)throw new Error('Prior data changed');}
 console.log('Existing academic and student records fingerprinted.');
}finally{await pool.end();}
