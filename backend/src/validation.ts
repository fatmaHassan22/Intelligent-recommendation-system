import { z } from 'zod';
export const id=z.union([z.string().regex(/^[1-9][0-9]{0,19}$/),z.number().int().positive().max(Number.MAX_SAFE_INTEGER)]).transform(String);
export const code=z.string().min(1).max(32).regex(/^[A-Z0-9]+$/);
export const email=z.string().trim().email().max(254).regex(/^[\x21-\x7e]+$/).transform(s=>s.toLowerCase());
export const password=z.string().min(12).refine(s=>Buffer.byteLength(s,'utf8')<=72,'Password exceeds bcrypt byte limit');
export const profileFields={
 university_student_number:z.string().trim().min(1).max(64).nullable().optional(),
 major_id:id, curriculum_plan_id:id,
 max_semester_credit_hours:z.number().int().positive().max(65535),
 preferred_study_mode:z.enum(['LIGHT','BALANCED','FAST_GRADUATION']),
 career_interest:z.string().trim().min(1).max(255).nullable().optional()
};
export const registerSchema=z.object({full_name:z.string().trim().min(1).max(255),email,password,...profileFields}).strict();
export const loginSchema=z.object({email,password:z.string().min(1).refine(s=>Buffer.byteLength(s,'utf8')<=72)}).strict();
export const updateProfileSchema=z.object({full_name:z.string().trim().min(1).max(255).optional(),
 ...Object.fromEntries(Object.entries(profileFields).map(([k,v])=>[k,v.optional()])),
 confirm_plan_change:z.boolean().optional()}).strict().refine(v=>Object.keys(v).some(k=>k!=='confirm_plan_change'),'Empty update');
export const courseQuery=z.object({page:z.coerce.number().int().min(1).max(1000000).default(1),limit:z.coerce.number().int().min(1).max(100).default(20),
 level:z.coerce.number().int().positive().max(65535).optional(),requirement_type:z.enum(['REQUIRED','ELECTIVE','UNVERIFIED']).optional(),search:z.string().trim().max(100).optional()}).strict();
