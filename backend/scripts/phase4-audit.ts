import {writeFile} from 'node:fs/promises';
import {loadConfig} from '../src/config.js';
import {createPool,rows} from '../src/db.js';
const pool=createPool(loadConfig());
try{
 const audit={
  plans:await rows(pool,'SELECT m.code,p.id,p.plan_number,p.total_credit_hours,p.verification_status FROM curriculum_plans p JOIN majors m ON m.id=p.major_id ORDER BY m.code'),
  difficulty:await rows(pool,'SELECT difficulty_level,verification_status,COUNT(*) AS count FROM course_academic_metadata GROUP BY difficulty_level,verification_status'),
  official_terms:await rows(pool,'SELECT COUNT(*) AS count FROM academic_terms'),
  offering_records:await rows(pool,'SELECT COUNT(*) AS count FROM course_offerings'),
  open_verification_issues:await rows(pool,'SELECT i.curriculum_plan_id,c.course_code,i.issue_type,i.severity,i.description FROM data_verification_issues i LEFT JOIN courses c ON c.id=i.course_id WHERE i.status=\'OPEN\' ORDER BY i.id')
 };
 await writeFile(new URL('../../reports/phase4-data-audit.json',import.meta.url),JSON.stringify(audit,null,2));
 console.log(JSON.stringify({difficulty:audit.difficulty,terms:audit.official_terms,offerings:audit.offering_records,issue_count:audit.open_verification_issues.length,issue_types:[...new Set(audit.open_verification_issues.map(i=>i.issue_type))],examples:audit.open_verification_issues.slice(0,3)},null,2));
}finally{await pool.end();}
