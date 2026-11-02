import type {Pool} from 'mysql2/promise';
import {createHash} from 'node:crypto';
import {rows} from '../src/db.js';
export const academicTables=['academic_terms','academic_years','course_academic_metadata','course_offerings','course_prerequisites','course_typical_semesters','courses','curriculum_courses','curriculum_plans','data_verification_issues','elective_group_courses','elective_groups','majors','prerequisite_groups','requirement_categories','seed_runs','semester_definitions'];
export async function snapshot(pool:Pool) {
 const result:Record<string,any>={};
 for(const name of academicTables){
  const data=await rows(pool,`SELECT * FROM \`${name}\``),ddl=await rows(pool,`SHOW CREATE TABLE \`${name}\``);
  const canonical=data.map(row=>JSON.stringify(row)).sort().join('\n');
  result[name]={rows:data.length,data_sha256:createHash('sha256').update(canonical).digest('hex'),schema_sha256:createHash('sha256').update(ddl[0]['Create Table']).digest('hex')};
 }return result;
}
