import {readFile,writeFile} from 'node:fs/promises';
import dotenv from 'dotenv';
const root=new URL('../',import.meta.url),app=dotenv.parse(await readFile(new URL('.env',root))),admin=dotenv.parse(await readFile(new URL('.env.migrate.local',root)));
const serialize=(v:Record<string,string>)=>Object.entries(v).map(([k,value])=>`${k}=${JSON.stringify(value)}`).join('\n')+'\n';
await writeFile(new URL('.env.phase7-admin.local',root),serialize({...admin,DB_NAME:'academic_support',TEST_DB_NAME:'academic_support_phase7_test'}));
await writeFile(new URL('.env.phase7-test.local',root),serialize({...app,DB_NAME:'academic_support_phase7_test',TEST_DB_NAME:'academic_support_phase7_test',NODE_ENV:'test',BCRYPT_ROUNDS:'4',PORT:'3004',HOST:'127.0.0.1',CORS_ORIGINS:'http://localhost:5177'}));
console.log('Local isolated Phase 7 configuration prepared. Secrets were not printed.');
