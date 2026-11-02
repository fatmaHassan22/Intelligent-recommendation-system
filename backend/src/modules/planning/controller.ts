import {Router} from 'express';
import type {Pool} from 'mysql2/promise';
import {z} from 'zod';
import {id,code} from '../../validation.js';
import {ApiError} from '../../errors.js';
import {listTerms} from './repository.js';
import {createDraft,getDraft,listDrafts,changeDraft,changeDraftCourse,getRecommendations} from './service.js';
const mode=z.enum(['LIGHT','BALANCED','FAST_GRADUATION']);
const fields={name:z.string().trim().min(1).max(120),academic_term_id:id.nullable().optional(),study_mode:mode.optional()};
const revision=z.number().int().positive().max(4294967294);
const create=z.object(fields).strict();
const patch=z.object({...fields,name:fields.name.optional(),expected_revision:revision}).strict().refine(v=>v.name!==undefined||v.academic_term_id!==undefined||v.study_mode!==undefined,'Empty update');
const remove=z.object({expected_revision:revision}).strict();
const recommendationQuery=z.object({draft_id:id.optional(),academic_term_id:id.optional(),study_mode:mode.optional(),
 search:z.string().trim().max(100).optional(),category:z.enum(['SUITABLE','BLOCKED','UNVERIFIED','NOT_OFFERED']).optional(),
 requirement_type:z.enum(['REQUIRED','ELECTIVE','UNVERIFIED']).optional(),include_completed:z.enum(['true','false']).default('false'),
 page:z.coerce.number().int().min(1).max(1000000).default(1),limit:z.coerce.number().int().min(1).max(100).default(12)}).strict();
export function planningRoutes(pool:Pool){
 const r=Router();
 r.get('/academic-terms',async(req,res)=>res.json({data:await listTerms(pool)}));
 r.get('/semester-plans',async(req,res)=>res.json({data:await listDrafts(pool,req.actor!.id)}));
 r.post('/semester-plans',async(req,res)=>res.status(201).json({data:await createDraft(pool,req.actor!.id,create.parse(req.body))}));
 r.get('/semester-plans/:planId',async(req,res)=>res.json({data:await getDraft(pool,req.actor!.id,id.parse(req.params.planId))}));
 r.patch('/semester-plans/:planId',async(req,res)=>res.json({data:await changeDraft(pool,req.actor!.id,id.parse(req.params.planId),patch.parse(req.body))}));
 r.delete('/semester-plans/:planId',async(req,res)=>{await changeDraft(pool,req.actor!.id,id.parse(req.params.planId),remove.parse(req.body),'delete');res.status(204).end();});
 r.post('/semester-plans/:planId/courses',async(req,res)=>{const body=z.object({course_code:code,expected_revision:revision}).strict().parse(req.body);res.status(201).json({data:await changeDraftCourse(pool,req.actor!.id,id.parse(req.params.planId),body.course_code,body.expected_revision)});});
 r.delete('/semester-plans/:planId/courses/:courseCode',async(req,res)=>res.json({data:await changeDraftCourse(pool,req.actor!.id,id.parse(req.params.planId),code.parse(req.params.courseCode),remove.parse(req.body).expected_revision,true)}));
 r.get('/semester-plans/:planId/validation',async(req,res)=>res.json({data:(await getDraft(pool,req.actor!.id,id.parse(req.params.planId))).validation}));
 r.get('/recommendations',async(req,res)=>{
  const q=recommendationQuery.parse(req.query),result=await getRecommendations(pool,req.actor!.id,q);
  const filtered=result.data.filter(c=>(q.include_completed==='true'||!c.already_completed)&&(!q.category||c.category===q.category)&&(!q.requirement_type||c.requirement_type===q.requirement_type)&&(!q.search||c.name_ar.includes(q.search)||c.course_code.includes(q.search.toUpperCase())));
  res.json({...result,data:filtered.slice((q.page-1)*q.limit,q.page*q.limit),pagination:{page:q.page,limit:q.limit,total:filtered.length},counts:result.data.reduce((acc,c)=>{acc[c.category]++;return acc;},{SUITABLE:0,BLOCKED:0,UNVERIFIED:0,NOT_OFFERED:0})});
 });
 r.get('/recommendations/:courseCode',async(req,res)=>{
  const q=recommendationQuery.parse(req.query),result=await getRecommendations(pool,req.actor!.id,q),course=result.data.find(c=>c.course_code===code.parse(req.params.courseCode));
  if(!course)throw new ApiError(404,'COURSE_NOT_IN_PLAN');res.json({data:course,credit_summary:result.credit_summary,curriculum_plan_id:result.curriculum_plan_id,study_mode:result.study_mode});
 });
 return r;
}
