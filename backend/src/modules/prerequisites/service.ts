export interface PrerequisiteGroup {group_number:number;operator:string;courses:string[];verification_status?:string}
export function evaluatePrerequisites(status:string,groups:PrerequisiteGroup[],completedCodes:string[]) {
 const completed=new Set(completedCodes);
 const unknown=status==='UNVERIFIED'||(status==='SPECIFIED'&&groups.length===0)||(status==='NONE'&&groups.length>0)||
  groups.some(g=>g.operator!=='OR'||g.courses.length===0||['UNVERIFIED','NEEDS_REVIEW','LEGACY_DATA'].includes(g.verification_status??''));
 const evaluated=groups.map(g=>({...g,satisfied:g.courses.some(c=>completed.has(c)),completed_alternatives:g.courses.filter(c=>completed.has(c)),missing_alternatives:g.courses.filter(c=>!completed.has(c))}));
 return {satisfied:unknown?null:evaluated.every(g=>g.satisfied),is_unverified:unknown,operator:'AND',groups:evaluated,
  satisfied_prerequisites:[...new Set(evaluated.flatMap(g=>g.completed_alternatives))],
  missing_prerequisite_groups:evaluated.filter(g=>!g.satisfied).map(g=>({group_number:g.group_number,operator:'OR',alternatives:g.missing_alternatives})),
  is_official_eligibility_decision:false};
}
