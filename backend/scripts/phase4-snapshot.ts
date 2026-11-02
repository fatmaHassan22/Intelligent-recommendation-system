import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadConfig} from '../src/config.js';
import {createPool,rows} from '../src/db.js';
import {snapshot} from './snapshot.js';
const pool=createPool({...loadConfig(),DB_NAME:'academic_support'});
try {
 const student:Record<string,unknown>={};
 for(const table of ['users','student_profiles','auth_sessions','student_completed_courses']){
  const data=await rows(pool,`SELECT * FROM \`${table}\``);
  student[table]={count:data.length,sha256:createHash('sha256').update(data.map(r=>JSON.stringify(r)).sort().join('\n')).digest('hex')};
 }
 const current={academic:await snapshot(pool),student},path=new URL('../../reports/phase4-preservation.json',import.meta.url);
 if(process.argv.includes('--before'))await writeFile(path,JSON.stringify({before:current},null,2));
 else{const report=JSON.parse(await readFile(path,'utf8'));report.after=current;report.unchanged=JSON.stringify(report.before)===JSON.stringify(current);await writeFile(path,JSON.stringify(report,null,2));if(!report.unchanged)throw new Error('Existing records changed');}
 console.log('Academic and existing student records fingerprinted.');
}finally{await pool.end();}
