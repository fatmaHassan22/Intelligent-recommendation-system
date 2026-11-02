import {rows,type Executor} from '../../db.js';
export async function getProfile(db:Executor,userId:string,lock=false) {
 if(lock)await rows(db,'SELECT user_id FROM student_profiles WHERE user_id=? FOR UPDATE',[userId]);
 return rows(db,'SELECT u.id,u.full_name,u.email,u.role,u.created_at,p.university_student_number,p.curriculum_plan_id,cp.major_id,p.max_semester_credit_hours,p.preferred_study_mode,p.career_interest FROM users u JOIN student_profiles p ON p.user_id=u.id JOIN curriculum_plans cp ON cp.id=p.curriculum_plan_id WHERE u.id=?',[userId]).then(r=>r[0]);
}
export const validPlan=async(db:Executor,majorId:string,planId:string)=>{
 const r=await rows(db,'SELECT p.id FROM curriculum_plans p JOIN majors m ON m.id=p.major_id WHERE p.id=? AND p.major_id=? AND m.is_active=1',[planId,majorId]);return r.length===1;
};
