import {readFile,writeFile} from 'node:fs/promises';
import dotenv from 'dotenv';
const folder=new URL('../',import.meta.url);
const application=dotenv.parse(await readFile(new URL('.env',folder)));
const admin=dotenv.parse(await readFile(new URL('.env.migrate.local',folder)));
function serialize(data:Record<string,string>){return Object.entries(data).map(([k,v])=>`${k}=${JSON.stringify(v)}`).join('\n')+'\n';}
const database='academic_support_phase4_test';
await writeFile(new URL('.env.phase4-admin.local',folder),serialize({...admin,DB_NAME:'academic_support',TEST_DB_NAME:database}));
await writeFile(new URL('.env.phase4-test.local',folder),serialize({...application,NODE_ENV:'test',DB_NAME:database,TEST_DB_NAME:database,PORT:'3001',HOST:'127.0.0.1',CORS_ORIGINS:'http://localhost:5174',BCRYPT_ROUNDS:'4'}));
console.log('Separate Phase 4 environment files prepared; credentials not printed.');
