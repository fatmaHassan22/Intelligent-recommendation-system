import {Router} from 'express';
import type {Pool} from 'mysql2/promise';
import {z} from 'zod';
import {getProfile} from './repository.js';
import {updateProfile} from './service.js';
import {updateProfileSchema,code} from '../../validation.js';
import {ApiError} from '../../errors.js';
import {completedCourses} from '../completions/repository.js';
import {changeCompletion} from '../completions/service.js';
import {progress} from '../progress/service.js';
import {getCourse} from '../catalog/repository.js';
import {evaluatePrerequisites} from '../prerequisites/service.js';
const completionBody=z.object({course_code:code}).strict();
export function studentRoutes(pool:Pool) {
 const r=Router();
 const profile=async(userId:string)=>{const p=await getProfile(pool,userId);if(!p)throw new ApiError(404,'PROFILE_NOT_FOUND');return p;};
 r.get('/me',async(req,res)=>res.json({data:await profile(req.actor!.id)}));
 r.patch('/me',async(req,res)=>res.json({data:await updateProfile(pool,req.actor!.id,updateProfileSchema.parse(req.body))}));
 r.get('/me/completed-courses',async(req,res)=>{const p=await profile(req.actor!.id);res.json({data:await completedCourses(pool,req.actor!.id,p.curriculum_plan_id),completion_source:'STUDENT_DECLARED_NOT_UNIVERSITY_VERIFIED'});});
 r.post('/me/completed-courses',async(req,res)=>res.status(201).json({data:await changeCompletion(pool,req.actor!.id,completionBody.parse(req.body).course_code)}));
 r.delete('/me/completed-courses/:courseCode',async(req,res)=>{await changeCompletion(pool,req.actor!.id,code.parse(req.params.courseCode),true);res.status(204).end();});
 r.get('/me/progress',async(req,res)=>res.json({data:await progress(pool,req.actor!.id)}));
 r.get('/me/remaining-courses',async(req,res)=>{const result=await progress(pool,req.actor!.id);res.json({data:result.remaining_courses,includes_elective_options_not_all_mandatory:true});});
 r.get('/me/courses/:courseCode/prerequisites',async(req,res)=>{
  const p=await profile(req.actor!.id),course=await getCourse(pool,p.curriculum_plan_id,code.parse(req.params.courseCode));
  const completed=await completedCourses(pool,req.actor!.id,p.curriculum_plan_id);
  res.json({data:{curriculum_plan_id:p.curriculum_plan_id,course_code:course.course_code,...evaluatePrerequisites(course.prerequisite_status,course.prerequisites.groups,completed.map(c=>c.course_code))}});
 });return r;
}
