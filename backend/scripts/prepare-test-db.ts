import {loadConfig} from '../src/config.js';
import {createPool,rows} from '../src/db.js';
import {migrate} from './migrations.js';
import {academicTables,snapshot} from './snapshot.js';
import {writeFile} from 'node:fs/promises';
const c=loadConfig();
if(c.DB_NAME!=='academic_support'||c.TEST_DB_NAME===c.DB_NAME||!c.TEST_DB_NAME.endsWith('_test'))throw new Error('Unsafe test database configuration');
const source=createPool(c),before=await snapshot(source);
let target:ReturnType<typeof createPool>|undefined;
try{
 const existing=await rows(source,'SELECT SCHEMA_NAME FROM information_schema.schemata WHERE SCHEMA_NAME=?',[c.TEST_DB_NAME]);
 if(existing.length)throw new Error('Test database already exists. Refusing to overwrite; run tests against the prepared test database.');
 await source.query(`CREATE DATABASE \`${c.TEST_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs`);
 target=createPool({...c,DB_NAME:c.TEST_DB_NAME});
 // Copy the actual current catalog (including semesters), not a guessed test curriculum.
 for(const name of academicTables)await target.query(`CREATE TABLE \`${name}\` LIKE \`${c.DB_NAME}\`.\`${name}\``);
 const connection=await target.getConnection();
 try{await connection.beginTransaction();for(const name of academicTables)await connection.query(`INSERT INTO \`${name}\` SELECT * FROM \`${c.DB_NAME}\`.\`${name}\``);await connection.commit();}
 catch(e){await connection.rollback();throw e;}finally{connection.release();}
 // CREATE LIKE omits FKs: reproduce real composite academic keys in the isolated DB.
 const constraints=await rows(source,'SELECT CONSTRAINT_NAME,TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME,ORDINAL_POSITION FROM information_schema.key_column_usage WHERE table_schema=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY TABLE_NAME,CONSTRAINT_NAME,ORDINAL_POSITION');
 const grouped=new Map<string,any[]>();for(const row of constraints){const k=row.TABLE_NAME+':'+row.CONSTRAINT_NAME;grouped.set(k,[...(grouped.get(k)??[]),row]);}
 for(const group of grouped.values()){
  const a=group[0];if(!academicTables.includes(a.TABLE_NAME))continue;
  await target.query(`ALTER TABLE \`${a.TABLE_NAME}\` ADD CONSTRAINT \`${a.CONSTRAINT_NAME}\` FOREIGN KEY (${group.map(r=>'`'+r.COLUMN_NAME+'`').join(',')}) REFERENCES \`${a.REFERENCED_TABLE_NAME}\` (${group.map(r=>'`'+r.REFERENCED_COLUMN_NAME+'`').join(',')}) ON DELETE RESTRICT ON UPDATE RESTRICT`);
 }
 await migrate(target);
 const unchanged=JSON.stringify(before)===JSON.stringify(await snapshot(source));
 const reportName=c.TEST_DB_NAME==='academic_support_phase7_test'?'phase7-test-preparation.json':c.TEST_DB_NAME==='academic_support_phase6_test'?'phase6-test-preparation.json':c.TEST_DB_NAME==='academic_support_phase5_test'?'phase5-test-preparation.json':c.TEST_DB_NAME==='academic_support_phase4_test'?'phase4-test-preparation.json':'phase2-test-preparation.json';
 await writeFile(new URL('../../reports/'+reportName,import.meta.url),JSON.stringify({test_database:c.TEST_DB_NAME,academic_source_unchanged:unchanged,academic_snapshot:before},null,2));
 if(!unchanged)throw new Error('Source academic snapshot changed');
 console.log('Separate test database prepared from actual academic data. Source unchanged.');
}finally{await source.end();if(target)await target.end();}

