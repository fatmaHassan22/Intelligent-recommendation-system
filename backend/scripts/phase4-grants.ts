import {readFile} from 'node:fs/promises';
import dotenv from 'dotenv';
import {loadConfig} from '../src/config.js';
import {createPool} from '../src/db.js';
import {academicTables} from './snapshot.js';
const admin=loadConfig(),pool=createPool(admin);
const app=dotenv.parse(await readFile(new URL('../.env',import.meta.url)));
if(!/^[a-zA-Z][a-zA-Z0-9_]{0,31}$/.test(app.DB_USER)||app.DB_USER==='root')throw new Error('Unsafe application user');
try{
 // Existing account: grants are scoped to these student-owned tables only.
 const databases=process.argv.includes('--test-only')?[admin.TEST_DB_NAME]:[admin.DB_NAME,admin.TEST_DB_NAME];
 for(const db of databases){
  if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(db))throw new Error('Unsafe database');
  if(db===admin.TEST_DB_NAME)for(const table of academicTables)await pool.query(`GRANT SELECT ON \`${db}\`.\`${table}\` TO '${app.DB_USER}'@'localhost'`);
  await pool.query(`GRANT SELECT ON \`${db}\`.planner_offering_evidence TO '${app.DB_USER}'@'localhost'`);
  for(const table of ['users','student_profiles','auth_sessions','student_completed_courses','student_semester_plans','student_semester_plan_courses']){
   if(db===admin.DB_NAME&&!table.startsWith('student_semester_'))continue;
   await pool.query(`GRANT SELECT,INSERT,UPDATE,DELETE ON \`${db}\`.\`${table}\` TO '${app.DB_USER}'@'localhost'`);
  }
 }
 console.log('Scoped planner permissions applied; academic tables remain read-only.');
}finally{await pool.end();}
