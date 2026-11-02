import type {Pool} from 'mysql2/promise';
import {transaction,write,rows} from '../../db.js';
import {getProfile} from '../profiles/repository.js';
import {ApiError} from '../../errors.js';
import {recordActivity} from '../engagement/service.js';
export async function changeCompletion(pool:Pool,userId:string,code:string,remove=false) {
 return transaction(pool,async db=>{
  const p=await getProfile(db,userId,true);if(!p)throw new ApiError(404,'PROFILE_NOT_FOUND');
  const courses=await rows(db,'SELECT c.id FROM curriculum_courses cc JOIN courses c ON c.id=cc.course_id WHERE cc.curriculum_plan_id=? AND c.course_code=?',[p.curriculum_plan_id,code]);
  if(!courses[0])throw new ApiError(400,'COURSE_NOT_IN_SELECTED_PLAN');
  if(remove){const r=await write(db,'DELETE FROM student_completed_courses WHERE user_id=? AND curriculum_plan_id=? AND course_id=?',[userId,p.curriculum_plan_id,courses[0].id]);if(!r.affectedRows)throw new ApiError(404,'COMPLETION_NOT_FOUND');}
  else {await write(db,'INSERT INTO student_completed_courses(user_id,curriculum_plan_id,course_id) VALUES(?,?,?)',[userId,p.curriculum_plan_id,courses[0].id]);await recordActivity(db,userId,'COURSE',String(courses[0].id),`COURSE:${p.curriculum_plan_id}:${courses[0].id}`,new Date());}
  return {course_code:code,curriculum_plan_id:p.curriculum_plan_id,declaration_status:'STUDENT_DECLARED'};
 });
}
