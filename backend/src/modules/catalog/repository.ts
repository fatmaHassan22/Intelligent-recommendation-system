import {rows,type Executor} from '../../db.js';
import {ApiError} from '../../errors.js';
export const listMajors=(db:Executor)=>rows(db,'SELECT id,code,name_ar,name_en,is_active FROM majors WHERE is_active=1 ORDER BY code');
export const listPlans=(db:Executor,majorId:string)=>rows(db,'SELECT id,major_id,plan_number,total_credit_hours,verification_status FROM curriculum_plans WHERE major_id=? ORDER BY plan_number',[majorId]);
export async function assertPlan(db:Executor,planId:string) {
 const result=await rows(db,'SELECT id,major_id,plan_number,total_credit_hours,verification_status FROM curriculum_plans WHERE id=?',[planId]);
 if(!result[0])throw new ApiError(404,'PLAN_NOT_FOUND');return result[0];
}
export async function listCourses(db:Executor,planId:string,filter:any) {
 await assertPlan(db,planId);
 const conditions=['cc.curriculum_plan_id=?'],args:any[]=[planId];
 if(filter.level!==undefined){conditions.push('c.level=?');args.push(filter.level);}
 if(filter.requirement_type){conditions.push('cc.requirement_type=?');args.push(filter.requirement_type);}
 if(filter.search){conditions.push("(CONVERT(c.course_code USING utf8mb4) COLLATE utf8mb4_0900_as_cs LIKE CONVERT(? USING utf8mb4) COLLATE utf8mb4_0900_as_cs OR c.name_ar COLLATE utf8mb4_0900_as_cs LIKE CONVERT(? USING utf8mb4) COLLATE utf8mb4_0900_as_cs OR cc.source_name_ar COLLATE utf8mb4_0900_as_cs LIKE CONVERT(? USING utf8mb4) COLLATE utf8mb4_0900_as_cs)");const term='%'+filter.search.replace(/[\\%_]/g,'\\$&')+'%';args.push(term,term,term);}
 const from=' FROM curriculum_courses cc JOIN courses c ON c.id=cc.course_id LEFT JOIN requirement_categories rc ON rc.id=cc.requirement_category_id WHERE '+conditions.join(' AND ');
 const count=await rows(db,'SELECT COUNT(*) AS total'+from,args);
 // Pagination values are validated integers; MySQL LIMIT parameters have version-specific typing.
 const data=await rows(db,'SELECT c.id,c.course_code,c.name_ar,c.name_en,c.credit_hours,c.level,c.is_active,cc.source_name_ar,cc.requirement_type,rc.code AS requirement_category,cc.prerequisite_status,cc.verification_status'+from+` ORDER BY c.course_code LIMIT ${filter.limit} OFFSET ${(filter.page-1)*filter.limit}`,args);
 return {data,pagination:{page:filter.page,limit:filter.limit,total:Number(count[0].total)}};
}
export async function getPrerequisites(db:Executor,planId:string,courseId:string) {
 const clauses=await rows(db,'SELECT g.group_number,g.alternatives_operator,g.verification_status,c.course_code FROM prerequisite_groups g LEFT JOIN course_prerequisites cp ON cp.curriculum_plan_id=g.curriculum_plan_id AND cp.course_id=g.course_id AND cp.group_number=g.group_number LEFT JOIN courses c ON c.id=cp.prerequisite_course_id WHERE g.curriculum_plan_id=? AND g.course_id=? ORDER BY g.group_number,c.course_code',[planId,courseId]);
 const map=new Map<number,any>();
 for(const row of clauses){if(!map.has(row.group_number))map.set(row.group_number,{group_number:row.group_number,operator:row.alternatives_operator,verification_status:row.verification_status,courses:[]});if(row.course_code)map.get(row.group_number).courses.push(row.course_code);}
 return {operator:'AND' as const,groups:[...map.values()]};
}
export async function getCourse(db:Executor,planId:string,courseCode:string):Promise<Record<string,any>> {
 const result=await rows(db,'SELECT c.*,cc.source_name_ar,cc.requirement_type,cc.prerequisite_status,cc.verification_status AS membership_verification_status,rc.code AS requirement_category FROM curriculum_courses cc JOIN courses c ON c.id=cc.course_id LEFT JOIN requirement_categories rc ON rc.id=cc.requirement_category_id WHERE cc.curriculum_plan_id=? AND c.course_code=?',[planId,courseCode]);
 const course=result[0];if(!course)throw new ApiError(404,'COURSE_NOT_IN_PLAN');
 const typical=await rows(db,'SELECT s.code,s.name_ar,t.source_reference,t.verification_status FROM course_typical_semesters t JOIN semester_definitions s ON s.id=t.semester_definition_id WHERE t.course_id=? ORDER BY s.id',[course.id]);
 const offerings=await rows(db,'SELECT y.code AS academic_year,s.code AS semester,o.is_offered FROM course_offerings o JOIN academic_terms t ON t.id=o.academic_term_id JOIN academic_years y ON y.id=t.academic_year_id JOIN semester_definitions s ON s.id=t.semester_definition_id WHERE o.course_id=? ORDER BY y.code,s.id',[course.id]);
 return {...course,prerequisites:await getPrerequisites(db,planId,String(course.id)),typical_semesters:{status:typical.length?'RECORDED':'UNKNOWN',records:typical},live_offerings:{status:offerings.length?'RECORDED':'UNRECORDED',records:offerings}};
}
export async function electiveGroups(db:Executor,planId:string) {
 await assertPlan(db,planId);
 const groups=await rows(db,'SELECT id,code,name_ar,required_credit_hours,required_course_count,verification_status FROM elective_groups WHERE curriculum_plan_id=? ORDER BY id',[planId]);
 for(const group of groups)group.courses=await rows(db,'SELECT c.course_code,c.name_ar,c.credit_hours FROM elective_group_courses e JOIN courses c ON c.id=e.course_id WHERE e.curriculum_plan_id=? AND e.elective_group_id=? ORDER BY c.course_code',[planId,group.id]);
 return groups;
}
