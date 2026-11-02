// Explicit administrative migration, with encrypted local snapshot and no resets.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import {loadConfig} from '../src/config.js';
import {createPool,rows} from '../src/db.js';
import {migrate} from './migrations.js';
const c=loadConfig();if(c.DB_NAME!=='academic_support')throw Error('Wrong migration target');const pool=createPool(c);
try{
 const tables=(await rows(pool,'SHOW TABLES')).map(r=>String(Object.values(r)[0]));
 const snapshot:Record<string,unknown>={};
 const connection=await pool.getConnection();
 try{await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
 for(const table of tables){if(!/^[a-z_]+$/.test(table))throw Error('Unexpected table');snapshot[table]={ddl:(await rows(connection,`SHOW CREATE TABLE \`${table}\``))[0]['Create Table'],rows:await rows(connection,`SELECT * FROM \`${table}\``)};}
 await connection.commit();}catch(e){await connection.rollback();throw e;}finally{connection.release();}
 const suffix=Date.now(),key=randomBytes(32),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from('phase8b-main-snapshot-v1'));
 const data=Buffer.concat([cipher.update(JSON.stringify({database:c.DB_NAME,format:'phase8b-json-v1',tables:snapshot}),'utf8'),cipher.final()]);
 await mkdir(new URL('../../backups/',import.meta.url),{recursive:true});await mkdir(new URL('../../.local/',import.meta.url),{recursive:true});
 await writeFile(new URL(`../../.local/phase8b-snapshot-${suffix}.key`,import.meta.url),key,{flag:'wx',mode:0o600});
 await writeFile(new URL(`../../backups/phase8b-before-${suffix}.json.enc`,import.meta.url),Buffer.concat([iv,cipher.getAuthTag(),data]),{flag:'wx',mode:0o600});
 const stored=await readFile(new URL(`../../backups/phase8b-before-${suffix}.json.enc`,import.meta.url)),decipher=createDecipheriv('aes-256-gcm',key,stored.subarray(0,12));decipher.setAAD(Buffer.from('phase8b-main-snapshot-v1'));decipher.setAuthTag(stored.subarray(12,28));const verified=JSON.parse(Buffer.concat([decipher.update(stored.subarray(28)),decipher.final()]).toString());if(JSON.stringify(verified.tables)!==JSON.stringify(snapshot))throw Error('Snapshot verification failed');
 await migrate(pool);console.log('Encrypted local pre-migration snapshot saved; additive migration applied without resetting or seeding records.');
}finally{await pool.end();}
