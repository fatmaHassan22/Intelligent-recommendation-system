import {Router} from 'express';
import type {Pool} from 'mysql2/promise';
import {id,code,courseQuery} from '../../validation.js';
import {assertPlan,electiveGroups,getCourse,listCourses,listMajors,listPlans} from './repository.js';
export function catalogRoutes(pool:Pool) {
 const r=Router();
 r.get('/majors',async(req,res)=>res.json({data:await listMajors(pool)}));
 r.get('/majors/:majorId/plans',async(req,res)=>res.json({data:await listPlans(pool,id.parse(req.params.majorId))}));
 r.get('/plans/:planId/courses',async(req,res)=>res.json(await listCourses(pool,id.parse(req.params.planId),courseQuery.parse(req.query))));
 r.get('/plans/:planId/courses/:courseCode',async(req,res)=>res.json({data:await getCourse(pool,id.parse(req.params.planId),code.parse(req.params.courseCode))}));
 r.get('/plans/:planId/elective-groups',async(req,res)=>res.json({data:await electiveGroups(pool,id.parse(req.params.planId))}));
 return r;
}
