import {writeFile} from 'node:fs/promises';
import {loadConfig} from '../src/config.js';
import {createPool,rows} from '../src/db.js';
import {snapshot} from './snapshot.js';
const c=loadConfig(),pool=createPool(c);
try{
 const result={database:c.DB_NAME,version:await rows(pool,'SELECT VERSION() AS version'),
  columns:await rows(pool,'SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE FROM information_schema.columns WHERE table_schema=DATABASE() ORDER BY TABLE_NAME,ORDINAL_POSITION'),
  foreign_keys:await rows(pool,'SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.key_column_usage WHERE table_schema=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL'),
  academic_snapshot:await snapshot(pool)};
 await writeFile(new URL('../../reports/phase2-schema-inspection.json',import.meta.url),JSON.stringify(result,null,2));
 console.log('Actual schema and academic snapshot saved (no credentials).');
}finally{await pool.end();}
