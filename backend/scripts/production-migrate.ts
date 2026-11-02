import {readFile} from 'node:fs/promises';
import {loadConfig} from '../src/config.js';
import {createPool,rows} from '../src/db.js';
import {migrate} from './migrations.js';
const config=loadConfig(),pool=createPool(config);
try {
 if(process.argv.includes('--bootstrap-empty')) {
  // Explicitly provision only a brand new schema. Never seed an existing database.
  const tables=await rows(pool,'SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA=DATABASE()');
  if(tables.length)throw new Error('Bootstrap refused: database is not empty. Restore or migrate existing data instead.');
  const connection=await pool.getConnection();
  try {for(const path of ['/bootstrap/academic.sql','/bootstrap/catalog.sql']) {
   const sql=await readFile(path,'utf8');
   for(const statement of sql.split(';').map(s=>s.trim()).filter(Boolean))await connection.query(statement);
  }}finally {connection.release();}
 }
 const academic=await rows(pool,"SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='courses'");
 if(!academic.length)throw new Error('Academic foundation missing: restore a backup or explicitly bootstrap an empty schema.');
 await migrate(pool);
 console.log('Migration checksums verified; pending additive migrations applied.');
} catch {console.error('Migration failed. Stop here: inspect schema and migration history locally. MySQL DDL may be partially committed; never reset or force checksums.');process.exitCode=1;}
finally {await pool.end();}
