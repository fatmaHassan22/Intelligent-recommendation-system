import {evaluatePrerequisites,type PrerequisiteGroup} from '../prerequisites/service.js';

export type StudyMode='LIGHT'|'BALANCED'|'FAST_GRADUATION';
export type Eligibility='SUITABLE'|'BLOCKED'|'UNVERIFIED';
export type Offering='NOT_RECORDED'|'UNVERIFIED'|'CONFIRMED_OFFERED'|'CONFIRMED_NOT_OFFERED';
export type Category=Eligibility|'NOT_OFFERED';
export interface AcademicCourse {
 id:string;course_code:string;name_ar:string;source_name_ar:string;is_active?:number;
 credit_hours:number|null;requirement_type:string;prerequisite_status:string;
 verification_status:string;membership_verification_status:string;
 groups:PrerequisiteGroup[];
 difficulty_level:string|null;difficulty_verification_status:string|null;
 offering:Offering;
 verification_issues?:{issue_type:string;severity:string}[];
}
export interface PlanningContext {
 curriculum_plan_id:string;academic_term_id:string|null;max_credits:number;study_mode:StudyMode;
 completed_codes:string[];selected_codes:string[];courses:AcademicCourse[];
}
export interface RankingRules {
 difficulty:Readonly<Record<string,number>>;
 modes:Readonly<Record<StudyMode,{required:number;unlock:number;workloadMix:number;difficulty:Readonly<Record<string,number>>;creditFraction:number;maxSuggestedCourses:number}>>;
}
export const rankingRules:RankingRules={
 difficulty:{EASY:1,MEDIUM:2,HARD:3},
 modes:{
  LIGHT:{required:100,unlock:5,workloadMix:0,difficulty:{EASY:30,MEDIUM:15,HARD:0},creditFraction:0.6,maxSuggestedCourses:3},
  BALANCED:{required:200,unlock:10,workloadMix:20,difficulty:{EASY:15,MEDIUM:20,HARD:10},creditFraction:1,maxSuggestedCourses:6},
  FAST_GRADUATION:{required:300,unlock:25,workloadMix:0,difficulty:{EASY:0,MEDIUM:0,HARD:0},creditFraction:1,maxSuggestedCourses:12}
 }
} as const;
export const verified=(status:string|null|undefined)=>['VERIFIED_USER_SOURCE','VERIFIED_OFFICIAL_SOURCE','VERIFIED','OFFICIAL'].includes(status??'');
function needsAcademicReview(c:AcademicCourse){return !!c.verification_issues?.some(i=>['NEEDS_ACADEMIC_VERIFICATION','CATALOG_METADATA_UNVERIFIED','PREREQUISITES_UNVERIFIED'].includes(i.issue_type)||(i.severity==='ERROR'&&!['NAME_VARIANT','INCOMPLETE_DEGREE_REQUIREMENTS','PLAN_TOTAL_UNVERIFIED'].includes(i.issue_type)));}
function academicPrerequisites(c:AcademicCourse,completed:string[]){return evaluatePrerequisites(c.prerequisite_status,c.groups,completed);}
function classificationVerified(c:AcademicCourse){
 return verified(c.membership_verification_status)&&['REQUIRED','ELECTIVE'].includes(c.requirement_type)&&!c.verification_issues?.some(i=>i.issue_type==='CLASSIFICATION_UNVERIFIED');
}
export function verifiedWorkload(c:AcademicCourse,rules=rankingRules):number|null {
 if(!verified(c.difficulty_verification_status))return null;
 const score=rules.difficulty[c.difficulty_level??''];
 return typeof score==='number'&&Number.isFinite(score)&&score>0?score:null;
}
export function creditSummary(courses:Pick<AcademicCourse,'credit_hours'>[],maximum:number){
 const known=courses.reduce((sum,c)=>sum+(c.credit_hours??0),0),unknown=courses.filter(c=>c.credit_hours===null).length;
 return {known_credit_hours:known,unknown_credit_course_count:unknown,total_credit_hours:unknown?null:known,
  configured_max_credit_hours:maximum,remaining_credit_capacity:unknown?null:maximum-known,
  known_credit_capacity:maximum-known,exceeds_configured_max:known>maximum,is_total_complete:unknown===0,
  is_official_registration_limit:false as const};
}
export const reasonLabels={
 COMPLETED:'أعلنتِ اجتياز هذا المساق في هذه الخطة؛ لا يُضاف مرة أخرى كمساق غير منجز.',
 SELECTED:'هذا المساق موجود بالفعل في المسودة المختارة.',
 PREREQUISITES_MET:'متطلبات المساق السابقة مستوفاة بحسب المساقات التي أعلنتِ اجتيازها.',
 NO_PREREQUISITE:'لا يوجد متطلب سابق مسجل صراحةً لهذا المساق في خطتك.',
 PREREQUISITES_MISSING:'لم تُنجزي جميع المتطلبات السابقة المتحققة؛ المساقات المختارة في المسودة لا تحل محل الإنجاز.',
 PREREQUISITES_UNVERIFIED:'بيانات المتطلبات السابقة غير مكتملة أو غير متحققة؛ لا يمكن تأكيد الأهلية.',
 HOURS_UNKNOWN:'ساعات المساق غير معروفة؛ لا يمكن تأكيد ملاءمته لحد الساعات.',
 DRAFT_HOURS_UNKNOWN:'المسودة تحتوي مساقات بساعات مجهولة؛ السعة المتبقية غير مؤكدة.',
 CREDIT_LIMIT:'إضافة المساق ستتجاوز الحد الأقصى للساعات الذي حددتِه في ملفك، وهو تفضيل شخصي وليس حدًا جامعيًا معتمدًا.',
 METADATA_UNVERIFIED:'البيانات الأكاديمية اللازمة لتأكيد الأهلية غير متحققة.',
 OFFERING_UNKNOWN:'لا توجد بيانات مؤكدة عن طرح هذا المساق في الفصل المختار؛ هذا لا يعني أنه غير مطروح.',
 OFFERING_UNVERIFIED:'يوجد سجل طرح، لكنه يفتقر إلى توثيق مصدر جامعي رسمي؛ لا يُستخدم لإثبات الطرح أو عدمه.',
 NOT_OFFERED:'سجل الطرح الفعلي يؤكد أن المساق غير مطروح في الفصل المختار.',
 OFFERED:'سجل الطرح الفعلي يؤكد طرح المساق في الفصل المختار.',
 DIFFICULTY_UNKNOWN:'الصعوبة غير متحققة أو غير مسجلة؛ لم نمنح المساق درجة صعوبة مفترضة.',
 CLASSIFICATION_UNVERIFIED:'تصنيف الإجباري والاختياري غير متحقق؛ لم يُستخدم كعامل ترتيب.',
 COURSE_INACTIVE:'المساق مسجل كغير نشط في الدليل الأكاديمي.',
 OPEN_ACADEMIC_REVIEW:'يوجد تنبيه تحقق أكاديمي مفتوح لهذا المساق؛ لا يمكن تأكيد أهليته قبل مراجعة البيانات المعنية.',
 PREREQUISITE_OUTSIDE_CATALOG:'بعض متطلبات هذا المساق خارج عضويات الخطة المتاحة؛ سجل الإنجاز الحالي لا يغطيها تلقائيًا.'
};
type ReasonCode=keyof typeof reasonLabels;
export function evaluateCourse(c:AcademicCourse,ctx:PlanningContext,rules=rankingRules){
 const selected=ctx.courses.filter(x=>ctx.selected_codes.includes(x.course_code));
 const credits=creditSummary(selected,ctx.max_credits);
 // Keep the existing AND/OR evaluation unchanged. Source review is a separate trust gate.
 const prereq={...academicPrerequisites(c,ctx.completed_codes),requires_academic_review:needsAcademicReview(c)};
 const reasons:ReasonCode[]=[];
 let eligibility:Eligibility='SUITABLE';
 const block=(reason:ReasonCode)=>{eligibility='BLOCKED';reasons.push(reason);};
 const unknown=(reason:ReasonCode)=>{if(eligibility!=='BLOCKED')eligibility='UNVERIFIED';reasons.push(reason);};
 if(ctx.completed_codes.includes(c.course_code))block('COMPLETED');
 if(ctx.selected_codes.includes(c.course_code))block('SELECTED');
 if(c.is_active===0&&verified(c.verification_status))block('COURSE_INACTIVE');
 if(prereq.is_unverified||!['NONE','SPECIFIED'].includes(c.prerequisite_status)||prereq.requires_academic_review||c.groups.some(g=>!verified(g.verification_status)))unknown('PREREQUISITES_UNVERIFIED');
 else if(!prereq.satisfied)block('PREREQUISITES_MISSING');
 else reasons.push(c.prerequisite_status==='NONE'?'NO_PREREQUISITE':'PREREQUISITES_MET');
 if(!verified(c.verification_status)||!verified(c.membership_verification_status))unknown('METADATA_UNVERIFIED');
 if(needsAcademicReview(c))unknown('OPEN_ACADEMIC_REVIEW');
 if(c.verification_issues?.some(i=>i.issue_type==='PREREQUISITE_OUTSIDE_SUPPLIED_MEMBERSHIP'))reasons.push('PREREQUISITE_OUTSIDE_CATALOG');
 if(c.credit_hours===null)unknown('HOURS_UNKNOWN');
 else if(!ctx.selected_codes.includes(c.course_code)&&credits.known_credit_hours+c.credit_hours>ctx.max_credits)block('CREDIT_LIMIT');
 if(credits.unknown_credit_course_count&&!ctx.selected_codes.includes(c.course_code))unknown('DRAFT_HOURS_UNKNOWN');
 reasons.push(c.offering==='NOT_RECORDED'?'OFFERING_UNKNOWN':c.offering==='UNVERIFIED'?'OFFERING_UNVERIFIED':c.offering==='CONFIRMED_NOT_OFFERED'?'NOT_OFFERED':'OFFERED');
 if(verifiedWorkload(c,rules)===null)reasons.push('DIFFICULTY_UNKNOWN');
 if(!classificationVerified(c))reasons.push('CLASSIFICATION_UNVERIFIED');
 const category:Category=eligibility==='SUITABLE'&&c.offering==='CONFIRMED_NOT_OFFERED'?'NOT_OFFERED':eligibility;
 return {course_code:c.course_code,name_ar:c.source_name_ar||c.name_ar,credit_hours:c.credit_hours,requirement_type:c.requirement_type,
  classification_verified:classificationVerified(c),
  eligibility_status:eligibility,category,offering_status:c.offering,prerequisites:prereq,
  workload_score:verifiedWorkload(c,rules),difficulty_level:verifiedWorkload(c,rules)===null?null:c.difficulty_level,
  already_completed:ctx.completed_codes.includes(c.course_code),already_selected:ctx.selected_codes.includes(c.course_code),
  verification_issues:c.verification_issues??[],
  reasons:reasons.map(code=>({code,text_ar:reasonLabels[code]})),is_official_eligibility_decision:false as const};
}
export function recommendations(ctx:PlanningContext,rules=rankingRules){
 const mode=rules.modes[ctx.study_mode];
 const results=ctx.courses.map(c=>{
  const evaluation=evaluateCourse(c,ctx,rules),factors:{code:string;label_ar:string;points:number;value:number}[]=[];
  if(evaluation.classification_verified&&c.requirement_type==='REQUIRED')factors.push({code:'REQUIRED',label_ar:'إجباري متحقق',points:mode.required,value:1});
  const unlock=ctx.courses.filter(other=>other.course_code!==c.course_code&&!ctx.completed_codes.includes(other.course_code)&&verified(other.membership_verification_status)&&!needsAcademicReview(other)&&other.groups.every(g=>verified(g.verification_status))&&
   academicPrerequisites(other,ctx.completed_codes).satisfied===false&&
   academicPrerequisites(other,[...ctx.completed_codes,c.course_code]).satisfied===true).length;
  if(unlock)factors.push({code:'UNLOCKS',label_ar:'مساقات يمكن استيفاء متطلباتها بإتمام هذا المساق',points:unlock*mode.unlock,value:unlock});
  const workload=verifiedWorkload(c,rules);
  if(workload!==null){
   const points=mode.difficulty[c.difficulty_level as keyof typeof mode.difficulty]??0;
   factors.push({code:'VERIFIED_DIFFICULTY',label_ar:'صعوبة متحققة وفق نمط الدراسة',points,value:workload});
   const selected=ctx.courses.filter(x=>ctx.selected_codes.includes(x.course_code)).map(x=>verifiedWorkload(x,rules)).filter((x):x is number=>x!==null);
   if(mode.workloadMix&&selected.length&&((selected.every(x=>x===1)&&workload===3)||(selected.every(x=>x===3)&&workload===1)))factors.push({code:'WORKLOAD_MIX',label_ar:'تنويع الصعوبة المتحققة في المسودة',points:mode.workloadMix,value:workload});
  }
  return {...evaluation,unlock_count:unlock,ranking:{score:factors.reduce((sum,f)=>sum+f.points,0),factors},rank:null as number|null};
 });
 const order:Record<Category,number>={SUITABLE:0,UNVERIFIED:1,NOT_OFFERED:2,BLOCKED:3};
 results.sort((a,b)=>order[a.category]-order[b.category]||b.ranking.score-a.ranking.score||(a.course_code<b.course_code?-1:a.course_code>b.course_code?1:0));
 let rank=0;for(const r of results)if(r.category==='SUITABLE')r.rank=++rank;
 const selected=ctx.courses.filter(c=>ctx.selected_codes.includes(c.course_code)),credits=creditSummary(selected,ctx.max_credits);
 const target=Math.floor(ctx.max_credits*mode.creditFraction);let used=credits.known_credit_hours,count=selected.length;
 const suggested:string[]=[];
 if(credits.is_total_complete)for(const r of results)if(r.category==='SUITABLE'&&r.credit_hours!==null&&used+r.credit_hours<=target&&count<mode.maxSuggestedCourses){suggested.push(r.course_code);used+=r.credit_hours;count++;}
 return {data:results,credit_summary:credits,suggested_course_codes:suggested,study_mode:ctx.study_mode,
  preference_target_credit_hours:target,preference_target_course_count:mode.maxSuggestedCourses,
  curriculum_plan_id:ctx.curriculum_plan_id,academic_term_id:ctx.academic_term_id,
  limitations:['الترتيب حتمي وتفسيري، وليس قرار تسجيل أو تخرج رسميًا.','الساعات ونمط الدراسة تفضيلات شخصية؛ لم تُفترض حدود جامعية.',
   'الفصل المعتاد لا يُستخدم لتأكيد الطرح الفعلي.','لا توجد درجات ملاءمة مهنية أو توقعات أداء.',
   ...(results.some(r=>r.workload_score===null)?['الصعوبة الناقصة لا تدخل في ترتيب أو تقدير حمل المساقات المعنية.']:[])],
  ranking_rules:mode};
}
export function validateDraft(ctx:PlanningContext){
 const selected=ctx.courses.filter(c=>ctx.selected_codes.includes(c.course_code));
 const credits=creditSummary(selected,ctx.max_credits);
 // Evaluate each selected course against the OTHER selections, never treating them as completions.
 const courses=selected.map(c=>evaluateCourse(c,{...ctx,selected_codes:ctx.selected_codes.filter(code=>code!==c.course_code)}));
 const academicallyValid=selected.length>0&&credits.is_total_complete&&!credits.exceeds_configured_max&&courses.every(c=>c.eligibility_status==='SUITABLE');
 const fullyValidated=academicallyValid&&ctx.academic_term_id!==null&&courses.every(c=>c.offering_status==='CONFIRMED_OFFERED');
 const workloads=selected.map(c=>verifiedWorkload(c)),known=workloads.filter((x):x is number=>x!==null);
 return {credit_summary:credits,courses,academically_valid:academicallyValid,fully_validated:fullyValidated,
  workload:{known_score:known.reduce((sum,n)=>sum+n,0),unknown_course_count:workloads.length-known.length,total_score:known.length===workloads.length?known.reduce((sum,n)=>sum+n,0):null},
  warnings:[...(!selected.length?['المسودة فارغة.']:[]),...(credits.exceeds_configured_max?['المسودة تتجاوز حد الساعات المفضل في ملفك.']:[]),
   ...(!credits.is_total_complete?['إجمالي الساعات غير مكتمل بسبب ساعات مجهولة.']:[]),
   ...(courses.some(c=>c.reasons.some(r=>r.code==='PREREQUISITES_MISSING'))?['توجد متطلبات سابقة متحققة غير مستوفاة.']:[]),
   ...(courses.some(c=>c.prerequisites.is_unverified||c.reasons.some(r=>['METADATA_UNVERIFIED','OPEN_ACADEMIC_REVIEW'].includes(r.code)))?['توجد معلومات أهلية أكاديمية غير مكتملة أو غير متحققة.']:[]),
   ...(courses.some(c=>c.already_completed)?['توجد مساقات أعلنتِ اجتيازها بعد إضافتها للمسودة؛ أزيليها من الاختيارات غير المنجزة.']:[]),
   ...(courses.some(c=>c.reasons.some(r=>r.code==='COURSE_INACTIVE'))?['توجد مساقات مسجلة كغير نشطة.']:[]),
   ...(courses.some(c=>c.offering_status==='CONFIRMED_NOT_OFFERED')?['توجد مساقات مؤكدة عدم الطرح في الفصل المختار.']:[]),
   ...(!ctx.academic_term_id||courses.some(c=>['NOT_RECORDED','UNVERIFIED'].includes(c.offering_status))?['لا يمكن تأكيد الطرح الفعلي لجميع المساقات.']:[])],
  is_official_registration_approval:false as const};
}
