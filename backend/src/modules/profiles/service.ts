import type {Pool} from 'mysql2/promise';
import {transaction,write,rows} from '../../db.js';
import {ApiError} from '../../errors.js';
import {getProfile,validPlan} from './repository.js';
export async function updateProfile(pool:Pool,userId:string,data:any) {
 return transaction(pool,async db=>{
  const current=await getProfile(db,userId,true);if(!current)throw new ApiError(404,'PROFILE_NOT_FOUND');
  const newPlan=String(data.curriculum_plan_id??current.curriculum_plan_id),major=String(data.major_id??current.major_id);
  if(!await validPlan(db,major,newPlan))throw new ApiError(400,'INVALID_CURRICULUM_SELECTION');
  if(newPlan!==String(current.curriculum_plan_id)){
   if(data.confirm_plan_change!==true)throw new ApiError(409,'PLAN_CHANGE_CONFIRMATION_REQUIRED','Existing completions stay in their original plan. Confirm explicitly to switch.');
  }
  if(data.full_name!==undefined)await write(db,'UPDATE users SET full_name=? WHERE id=?',[data.full_name,userId]);
  await write(db,'UPDATE student_profiles SET university_student_number=?,curriculum_plan_id=?,max_semester_credit_hours=?,preferred_study_mode=?,career_interest=? WHERE user_id=?',[
   data.university_student_number!==undefined?data.university_student_number:current.university_student_number,newPlan,
   data.max_semester_credit_hours??current.max_semester_credit_hours,data.preferred_study_mode??current.preferred_study_mode,
   data.career_interest!==undefined?data.career_interest:current.career_interest,userId]);
  return {...await getProfile(db,userId),completion_transfer_policy:'PRESERVE_ORIGINAL_PLAN_NO_AUTOMATIC_TRANSFER'};
 });
}
