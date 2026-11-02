import type {Pool} from 'mysql2/promise';
import {transaction,rows} from '../../db.js';
import {getProfile} from '../profiles/repository.js';
import {membershipCourses} from '../completions/repository.js';
import {electiveGroups} from '../catalog/repository.js';
import {ApiError} from '../../errors.js';
export function creditSummary(courses:any[]) {
 const known=courses.filter(c=>c.credit_hours!==null),unknown=courses.filter(c=>c.credit_hours===null);
 return {known_credit_hours:known.length===0&&unknown.length>0?null:known.reduce((sum,c)=>sum+Number(c.credit_hours),0),unknown_credit_course_count:unknown.length,is_complete:unknown.length===0};
}
export async function progress(pool:Pool,userId:string) {
 return transaction(pool,async db=>{
  const p=await getProfile(db,userId);if(!p)throw new ApiError(404,'PROFILE_NOT_FOUND');
  const all=await membershipCourses(db,userId,p.curriculum_plan_id),completed=all.filter(c=>Number(c.completed)===1),remaining=all.filter(c=>!Number(c.completed));
  const required=completed.filter(c=>c.requirement_type==='REQUIRED'),elective=completed.filter(c=>c.requirement_type==='ELECTIVE');
  const groups=await electiveGroups(db,p.curriculum_plan_id),completedCodes=new Set(completed.map(c=>c.course_code));
  const groupProgress=groups.map(g=>{const selected=g.courses.filter((c:any)=>completedCodes.has(c.course_code));return {id:g.id,code:g.code,required_credit_hours:g.required_credit_hours,required_course_count:g.required_course_count,completed_course_count:selected.length,...creditSummary(selected)};});
  const knownTargets=groups.filter(g=>g.required_credit_hours!==null);
  const plan=await rows(db,'SELECT total_credit_hours FROM curriculum_plans WHERE id=?',[p.curriculum_plan_id]);
  return {curriculum_plan_id:p.curriculum_plan_id,total_plan_credit_hours:plan[0].total_credit_hours,total_known_curriculum_courses:all.length,
   completed_course_count:completed.length,remaining_course_count:remaining.length,completed_required_courses:required.length,completed_elective_courses:elective.length,
   completed_unverified_courses:completed.filter(c=>c.requirement_type==='UNVERIFIED').length,
   known_completed_credit_hours:creditSummary(completed).known_credit_hours,completed_credit_summary:creditSummary(completed),
   required_elective_hours:knownTargets.length&&knownTargets.length===groups.length?knownTargets.reduce((n,g)=>n+Number(g.required_credit_hours),0):null,
   completed_elective_hours:all.some(c=>c.requirement_type==='UNVERIFIED')?null:creditSummary(elective).known_credit_hours,
   known_completed_elective_hours:creditSummary(elective).known_credit_hours,elective_groups:groupProgress,
   completed_courses:completed,remaining_courses:remaining,remaining_courses_are_not_all_mandatory:true,
   is_degree_audit_complete:false,degree_audit_limitations:['DEGREE_WIDE_REQUIREMENTS_NOT_FULLY_SUPPLIED',...(all.some(c=>c.requirement_type==='UNVERIFIED')?['UNVERIFIED_CLASSIFICATIONS']:[]),...(all.some(c=>c.credit_hours===null)?['UNKNOWN_CREDIT_HOURS']:[])],
   completion_source:'STUDENT_DECLARED_NOT_UNIVERSITY_VERIFIED',elective_group_totals_may_overlap:groups.length>1};
 });
}
