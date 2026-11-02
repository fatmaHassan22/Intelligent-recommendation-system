import {existsSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

// Resolve test configuration before loading any application module.
const root=fileURLToPath(new URL('../',import.meta.url));
const preferred=existsSync(join(root,'.env.phase8b-test.local'))?join(root,'.env.phase8b-test.local'):existsSync(join(root,'.env.phase7-test.local'))?join(root,'.env.phase7-test.local'):existsSync(join(root,'.env.phase6-test.local'))?join(root,'.env.phase6-test.local'):existsSync(join(root,'.env.phase5-test.local'))?join(root,'.env.phase5-test.local'):join(root,'.env.phase4-test.local');
const envFile=process.env.ENV_FILE?resolve(process.env.ENV_FILE):existsSync(preferred)?preferred:join(root,'.env.test');
if(!existsSync(envFile))throw new Error('Configure a separate test database in .env.test first.');
const tests=readdirSync(join(root,'tests')).filter(name=>name.endsWith('.test.ts')&&(!process.argv.includes('--integration')||name.includes('integration'))).sort().map(name=>join(root,'tests',name));
const result=spawnSync(process.execPath,[join(root,'node_modules/tsx/dist/cli.mjs'),'--test','--test-concurrency=1',...tests],{cwd:root,stdio:'inherit',env:{...process.env,ENV_FILE:envFile}});
if(result.error)throw result.error;
process.exitCode=result.status??1;
