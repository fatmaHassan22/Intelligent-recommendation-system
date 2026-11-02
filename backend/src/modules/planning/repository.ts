import {rows,type Executor} from '../../db.js';
import {ApiError} from '../../errors.js';
import {getProfile} from '../profiles/repository.js';
import {getPrerequisites} from '../catalog/repository.js';
import {completedCourses} from '../completions/repository.js';
import type {AcademicCourse,PlanningContext,StudyMode,Offering} from './engine.js';

export function offeringStatus(record:{is_offered:number;official_verification:string|null}|undefined):Offering {
 if(!record)return 'NOT_RECORDED';
 if(record.official_verification!=='VERIFIED_OFFICIAL_SOURCE')return 'UNVERIFIED';
 return record.is_offered===0?'CONFIRMED_NOT_OFFERED':record.is_offered===1?'CONFIRMED_OFFERED':'UNVERIFIED';
}

export async function ownedPlan(db:Executor,userId:string,planId:string,lock=false){
 // Lock only the writable student draft. Academic joins stay ordinary read-only queries.
 if(lock){const owned=await rows(db,'SELECT id FROM student_semester_plans WHERE id=? AND user_id=? FOR UPDATE',[planId,userId]);if(!owned.length)throw new ApiError(404,'SEMESTER_PLAN_NOT_FOUND');}
 const result=await rows(db,'SELECT p.*,m.name_ar AS major_name_ar,m.code AS major_code,cp.plan_number FROM student_semester_plans p JOIN curriculum_plans cp ON cp.id=p.curriculum_plan_id JOIN majors m ON m.id=cp.major_id WHERE p.id=? AND p.user_id=?',[planId,userId]);
 if(!result[0])throw new ApiError(404,'SEMESTER_PLAN_NOT_FOUND');return result[0];
}
export const listTerms=(db:Executor)=>rows(db,'SELECT t.id,y.code AS academic_year,s.code AS semester_code,s.name_ar AS semester_name_ar FROM academic_terms t JOIN academic_years y ON y.id=t.academic_year_id JOIN semester_definitions s ON s.id=t.semester_definition_id ORDER BY y.code DESC,s.id');
export async function assertTerm(db:Executor,id:string|null){
 if(id!==null&&!(await rows(db,'SELECT id FROM academic_terms WHERE id=?',[id])).length)throw new ApiError(400,'ACADEMIC_TERM_NOT_FOUND');
}
export async function selectedCodes(db:Executor,planId:string){
 return (await rows(db,'SELECT c.course_code FROM student_semester_plan_courses pc JOIN courses c ON c.id=pc.course_id WHERE pc.semester_plan_id=? ORDER BY c.course_code',[planId])).map(c=>String(c.course_code));
}
export async function planningContext(db:Executor,userId:string,options:{draft_id?:string;academic_term_id?:string|null;study_mode?:StudyMode}={}){
 const profile=await getProfile(db,userId);if(!profile)throw new ApiError(404,'PROFILE_NOT_FOUND');
 const draft=options.draft_id?await ownedPlan(db,userId,options.draft_id):null;
 const planId=String(draft?.curriculum_plan_id??profile.curriculum_plan_id);
 const term=options.academic_term_id!==undefined?options.academic_term_id:draft?.academic_term_id?String(draft.academic_term_id):null;
 await assertTerm(db,term);
 const courseRows=await rows<Omit<AcademicCourse,'groups'|'offering'>&{is_active:number}>(db,'SELECT c.id,c.course_code,c.name_ar,c.credit_hours,c.is_active,c.verification_status,cc.source_name_ar,cc.requirement_type,cc.prerequisite_status,cc.verification_status AS membership_verification_status,md.difficulty_level,md.verification_status AS difficulty_verification_status FROM curriculum_courses cc JOIN courses c ON c.id=cc.course_id LEFT JOIN course_academic_metadata md ON md.course_id=c.id WHERE cc.curriculum_plan_id=? ORDER BY c.course_code',[planId]);
 const offerings=term?await rows<{course_id:string;is_offered:number;official_verification:string|null}>(db,'SELECT o.course_id,o.is_offered,e.verification_status AS official_verification FROM course_offerings o LEFT JOIN planner_offering_evidence e ON e.course_offering_id=o.id WHERE o.academic_term_id=?',[term]):[];
 const issues=await rows<{course_id:string|null;issue_type:string;severity:string}>(db,"SELECT course_id,issue_type,severity FROM data_verification_issues WHERE status='OPEN' AND (curriculum_plan_id=? OR curriculum_plan_id IS NULL) ORDER BY id",[planId]);
 const courses:AcademicCourse[]=await Promise.all(courseRows.map(async c=>({...c,id:String(c.id),credit_hours:c.credit_hours===null?null:Number(c.credit_hours),groups:(await getPrerequisites(db,planId,String(c.id))).groups,
  verification_issues:issues.filter(i=>i.course_id===null||String(i.course_id)===String(c.id)).map(i=>({issue_type:i.issue_type,severity:i.severity})),
  offering:offeringStatus(offerings.find(o=>String(o.course_id)===String(c.id)))})));
 const ctx:PlanningContext={curriculum_plan_id:planId,academic_term_id:term,max_credits:Number(profile.max_semester_credit_hours),study_mode:options.study_mode??draft?.study_mode??profile.preferred_study_mode,
  selected_codes:draft?await selectedCodes(db,String(draft.id)):[],completed_codes:(await completedCourses(db,userId,planId)).map(c=>c.course_code),courses};
 return {ctx,profile,draft};
}
export function checkRevision(plan:Record<string,any>,expected:number){if(Number(plan.revision)!==expected)throw new ApiError(409,'PLAN_REVISION_CONFLICT');}

