import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import type {Pool} from 'mysql2/promise';
import {rows} from '../src/db.js';
const folder=fileURLToPath(new URL('../migrations/',import.meta.url));
export async function migrate(pool:Pool) {
 const db=await pool.getConnection();
 try {
  const lock=await rows(db,'SELECT GET_LOCK(CONCAT(DATABASE(),\':backend_migrations\'),10) AS acquired');
  if(Number(lock[0].acquired)!==1)throw new Error('Could not acquire migration lock');
  await rows(db,'CREATE TABLE IF NOT EXISTS backend_schema_migrations(version VARCHAR(128) CHARACTER SET ascii PRIMARY KEY,checksum CHAR(64) CHARACTER SET ascii NOT NULL,applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs');
  const files=(await readdir(folder)).filter(n=>n.endsWith('.sql')).sort();
  // Validate the whole applied history before executing any pending DDL.
  const history=await rows(db,'SELECT version,checksum FROM backend_schema_migrations');
  for(const entry of history){
   if(!files.includes(entry.version))throw new Error('Applied migration missing: '+entry.version);
   const hash=createHash('sha256').update(await readFile(folder+entry.version,'utf8')).digest('hex');
   if(hash!==entry.checksum)throw new Error('Applied migration changed: '+entry.version);
  }
  for(const name of files){
   const text=await readFile(folder+name,'utf8'),hash=createHash('sha256').update(text).digest('hex');
   const applied=await rows(db,'SELECT checksum FROM backend_schema_migrations WHERE version=?',[name]);
   if(applied[0]){if(applied[0].checksum!==hash)throw new Error('Applied migration changed: '+name);continue;}
   // Additive CREATE statements only. No existing academic DDL is executed here.
   for(const statement of text.split(';').map(s=>s.trim()).filter(Boolean))await db.query(statement);
   await db.execute('INSERT INTO backend_schema_migrations(version,checksum) VALUES(?,?)',[name,hash]);
  }
 }finally {await db.query('SELECT RELEASE_LOCK(CONCAT(DATABASE(),\':backend_migrations\'))');db.release();}
}
