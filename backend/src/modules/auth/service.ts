import bcrypt from 'bcryptjs';
import {randomBytes} from 'node:crypto';
import type {Pool} from 'mysql2/promise';
import type {Config} from '../../config.js';
import {transaction,write} from '../../db.js';
import {ApiError} from '../../errors.js';
import {hashToken} from '../../middleware/security.js';
import {insertSession,revokeSession} from './repository.js';
import {findUser,insertUser,publicUser} from '../users/repository.js';
import {validPlan} from '../profiles/repository.js';
export function authService(pool:Pool,c:Config) {
 const dummy=bcrypt.hash(randomBytes(32).toString('hex'),c.BCRYPT_ROUNDS);
 return {
  async register(data:any){
   const passwordHash=await bcrypt.hash(data.password,c.BCRYPT_ROUNDS),token=randomBytes(32).toString('hex');
   const user=await transaction(pool,async db=>{
    if(!await validPlan(db,data.major_id,data.curriculum_plan_id))throw new ApiError(400,'INVALID_CURRICULUM_SELECTION');
    const userId=await insertUser(db,data,passwordHash);
    await write(db,'INSERT INTO student_profiles(user_id,university_student_number,curriculum_plan_id,max_semester_credit_hours,preferred_study_mode,career_interest) VALUES(?,?,?,?,?,?)',[userId,data.university_student_number??null,data.curriculum_plan_id,data.max_semester_credit_hours,data.preferred_study_mode,data.career_interest??null]);
    await insertSession(db,hashToken(token),userId,c.SESSION_TTL_HOURS);return publicUser(await findUser(db,data.email));
   });return {user,token};
  },
  async login(data:any,oldHash?:string){
   const user=await findUser(pool,data.email);
   const matches=await bcrypt.compare(data.password,user?.password_hash??await dummy);
   if(!user||!matches||!Number(user.is_active))throw new ApiError(401,'INVALID_CREDENTIALS');
   const token=randomBytes(32).toString('hex');
   await transaction(pool,async db=>{if(oldHash)await revokeSession(db,oldHash);await insertSession(db,hashToken(token),String(user.id),c.SESSION_TTL_HOURS);});
   return {user:publicUser(user),token};
  }
 };
}
