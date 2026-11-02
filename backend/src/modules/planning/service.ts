import type {Pool} from 'mysql2/promise';
import {transaction,rows,write} from '../../db.js';
import {ApiError} from '../../errors.js';
import {getProfile} from '../profiles/repository.js';
import {assertTerm,checkRevision,ownedPlan,planningContext} from './repository.js';
import {recommendations,validateDraft,type StudyMode} from './engine.js';
import {recordPlan} from '../engagement/service.js';

export async function listDrafts(pool:Pool,userId:string){
 return rows(pool,'SELECT p.*,m.code AS major_code,m.name_ar AS major_name_ar,cp.plan_number,COUNT(pc.course_id) AS course_count FROM student_semester_plans p JOIN curriculum_plans cp ON cp.id=p.curriculum_plan_id JOIN majors m ON m.id=cp.major_id LEFT JOIN student_semester_plan_courses pc ON pc.semester_plan_id=p.id WHERE p.user_id=? GROUP BY p.id,m.code,m.name_ar,cp.plan_number ORDER BY p.updated_at DESC,p.id DESC',[userId]);
}
export async function getDraft(pool:Pool,userId:string,planId:string){
 return transaction(pool,async db=>{const {ctx,draft,profile}=await planningContext(db,userId,{draft_id:planId});return {...draft,
  is_current_curriculum_plan:ctx.curriculum_plan_id===String(profile.curriculum_plan_id),status:'DRAFT',validation:validateDraft(ctx)};});
}
export async function getRecommendations(pool:Pool,userId:string,options:{draft_id?:string;academic_term_id?:string|null;study_mode?:StudyMode}={}){
 return transaction(pool,async db=>{const {ctx,draft,profile}=await planningContext(db,userId,options);return {...recommendations(ctx),draft_id:draft?String(draft.id):null,
  is_current_curriculum_plan:ctx.curriculum_plan_id===String(profile.curriculum_plan_id)};});
}
export async function createDraft(pool:Pool,userId:string,data:{name:string;academic_term_id?:string|null;study_mode?:StudyMode}){
 const id=await transaction(pool,async db=>{
  const profile=await getProfile(db,userId,true);if(!profile)throw new ApiError(404,'PROFILE_NOT_FOUND');
  await assertTerm(db,data.academic_term_id??null);
  const result=await write(db,'INSERT INTO student_semester_plans(user_id,curriculum_plan_id,academic_term_id,name,study_mode) VALUES(?,?,?,?,?)',[userId,profile.curriculum_plan_id,data.academic_term_id??null,data.name,data.study_mode??profile.preferred_study_mode]);
  return String(result.insertId);
 });return getDraft(pool,userId,id);
}
export async function changeDraft(pool:Pool,userId:string,planId:string,data:{expected_revision:number;name?:string;academic_term_id?:string|null;study_mode?:StudyMode},action:'patch'|'delete'='patch'){
 await transaction(pool,async db=>{
  await getProfile(db,userId,true);const draft=await ownedPlan(db,userId,planId,true);checkRevision(draft,data.expected_revision);
  if(action==='delete'){await write(db,'DELETE FROM student_semester_plans WHERE id=? AND user_id=?',[planId,userId]);return;}
  const term=data.academic_term_id!==undefined?data.academic_term_id:draft.academic_term_id;
  await assertTerm(db,term===null?null:String(term));
  await write(db,'UPDATE student_semester_plans SET name=?,academic_term_id=?,study_mode=?,revision=revision+1 WHERE id=? AND user_id=?',[data.name??draft.name,term,data.study_mode??draft.study_mode,planId,userId]);
  if(String(term)!==String(draft.academic_term_id)||(data.study_mode??draft.study_mode)!==draft.study_mode)await recordPlan(db,userId,planId,new Date());
 });return action==='delete'?undefined:getDraft(pool,userId,planId);
}
export async function changeDraftCourse(pool:Pool,userId:string,planId:string,courseCode:string,revision:number,remove=false){
 await transaction(pool,async db=>{
  await getProfile(db,userId,true);const draft=await ownedPlan(db,userId,planId,true);checkRevision(draft,revision);
  const {ctx}=await planningContext(db,userId,{draft_id:planId});
  const course=ctx.courses.find(c=>c.course_code===courseCode);if(!course)throw new ApiError(400,'COURSE_NOT_IN_PLAN');
  if(remove){const result=await write(db,'DELETE FROM student_semester_plan_courses WHERE semester_plan_id=? AND course_id=?',[planId,course.id]);if(!result.affectedRows)throw new ApiError(404,'PLAN_COURSE_NOT_FOUND');}
  else {
   if(ctx.completed_codes.includes(courseCode))throw new ApiError(409,'COURSE_ALREADY_COMPLETED');
   if(ctx.selected_codes.includes(courseCode))throw new ApiError(409,'COURSE_ALREADY_SELECTED');
   // Drafts may store uncertain/blocked choices for review. Their validation is always recomputed.
   await write(db,'INSERT INTO student_semester_plan_courses(semester_plan_id,curriculum_plan_id,course_id) VALUES(?,?,?)',[planId,draft.curriculum_plan_id,course.id]);
  }
  await write(db,'UPDATE student_semester_plans SET revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=?',[planId]);
  await recordPlan(db,userId,planId,new Date());
 });return getDraft(pool,userId,planId);
}
