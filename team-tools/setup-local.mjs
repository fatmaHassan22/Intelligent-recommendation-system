// Run ONLY on a teammate's computer, after dependency installation.
// Creates a brand-new local database. Never resets or reuses an existing database.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {randomBytes,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(path.join(root,'backend/package.json'));
let conn;
try {
 const mysql=require('mysql2/promise');
 const input=JSON.parse(fs.readFileSync(0,'utf8').replace(/^\uFEFF/,''));
 const database=input.database;
 if(!/^academic_team_[A-Za-z0-9_]{1,40}$/.test(database))throw Error('Database name must start with academic_team_ and contain only letters, numbers and underscores.');
 for(const part of ['backend','frontend'])if(fs.existsSync(path.join(root,part,'.env')))throw Error('An .env already exists. Setup stopped; no overwrite. Use a fresh extracted copy.');
 const sql=fs.readFileSync(path.join(root,'database/academic-curriculum.sql'),'utf8');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'database/manifest.json'),'utf8'));
 if(createHash('sha256').update(sql).digest('hex')!==manifest.sqlSha256)throw Error('Academic SQL checksum mismatch.');
 conn=await mysql.createConnection({host:'127.0.0.1',port:3306,user:'root',password:input.password,multipleStatements:false,charset:'utf8mb4'});
 const [present]=await conn.execute('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?',[database]);
 if(present.length)throw Error('Database already exists. Setup refuses to modify it. Choose a different NEW name.');
 await conn.query('CREATE DATABASE `'+database+'` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs');
 await conn.query('USE `'+database+'`');
 for(const statement of sql.split(/;\r?\n/).map(s=>s.trim()).filter(Boolean))await conn.query(statement);
 const csrf=randomBytes(48).toString('hex');
 const migrationEnv={...process.env,NODE_ENV:'development',DB_HOST:'127.0.0.1',DB_PORT:'3306',DB_NAME:database,DB_USER:'root',DB_PASSWORD:input.password,CSRF_SECRET:csrf,CORS_ORIGINS:'http://127.0.0.1:5173',ENV_FILE:path.join(root,'backend/.env')};
 for(const k of Object.keys(migrationEnv))if(k.endsWith('_FILE'))delete migrationEnv[k];
 const result=spawnSync(process.execPath,['--import','tsx','scripts/migrate.ts'],{cwd:path.join(root,'backend'),env:migrationEnv,stdio:'pipe'});
 if(result.status!==0)throw Error('Backend migrations failed. The NEW database is left intact for inspection. Do not rerun against it; ask the project maintainer.');
 const username='academic_team_'+randomBytes(6).toString('hex'),password=randomBytes(32).toString('hex');
 await conn.query("CREATE USER '"+username+"'@'localhost' IDENTIFIED BY ?",[password]);
 const [all]=await conn.query('SHOW TABLES');
 for(const row of all){const table=Object.values(row)[0];if(!/^[a-z_0-9]+$/.test(table))throw Error('Unexpected table name');const readonly=table in manifest.tables||['backend_schema_migrations','achievement_definitions','planner_offering_evidence'].includes(table);await conn.query('GRANT '+(readonly?'SELECT':'SELECT,INSERT,UPDATE,DELETE')+' ON `'+database+'`.`'+table+"` TO '"+username+"'@'localhost'");}
 const env={NODE_ENV:'development',HOST:'127.0.0.1',PORT:'3000',DB_HOST:'127.0.0.1',DB_PORT:'3306',DB_NAME:database,DB_USER:username,DB_PASSWORD:password,CSRF_SECRET:csrf,CORS_ORIGINS:'http://127.0.0.1:5173',COOKIE_SECURE:'false',COOKIE_SAME_SITE:'lax',BCRYPT_ROUNDS:'12',TRUST_PROXY_HOPS:'0',BACKGROUND_JOBS_ENABLED:'true',PUSH_ENABLED:'false',MOODLE_SYNC_ENABLED:'false',GEMINI_API_KEY:'',MOODLE_BASE_URL:'',MOODLE_ENCRYPTION_KEY:'',PUSH_ENCRYPTION_KEY:'',VAPID_PUBLIC_KEY:'',VAPID_PRIVATE_KEY:'',VAPID_SUBJECT:'',TEST_DB_NAME:database+'_test'};
 fs.writeFileSync(path.join(root,'backend/.env'),Object.entries(env).map(([k,v])=>k+'='+v).join('\n')+'\n',{flag:'wx',mode:0o600});
 fs.writeFileSync(path.join(root,'frontend/.env'),'VITE_API_BASE_URL=/api/v1\n',{flag:'wx',mode:0o600});
 console.log('Local team setup complete. New empty student tables and academic curriculum imported. Private .env files were generated ONLY on this computer.');
}catch(error){
 // Never log driver errors, connection settings, passwords or child process output.
 const safe=error instanceof Error&&/^(Database |An \.env |Academic SQL |Backend migrations |Unexpected table)/.test(error.message);
 console.error(safe?error.message:'Setup failed. Check Node dependencies, local MySQL 8 on port 3306, and the root password. No existing database is reset. A partially created NEW database may remain; ask the maintainer before continuing.');process.exitCode=1;
}finally{if(conn)await conn.end();}
