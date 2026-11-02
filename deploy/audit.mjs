// Offline bounded audit. Reports paths/field names only, never secret values.
import {readdirSync,readFileSync,writeFileSync,existsSync,statSync} from 'node:fs';
import {join,relative,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const secrets=[];const weakLocalFields=[];
for(const name of readdirSync(join(root,'backend')).filter(n=>n.startsWith('.env')&&!n.endsWith('.example'))) {
 for(const line of readFileSync(join(root,'backend',name),'utf8').split(/\r?\n/)) {
  const m=line.match(/^([A-Z_]*(?:PASSWORD|SECRET|API_KEY|ENCRYPTION_KEY))\s*=\s*(.+)$/);
  if(!m)continue;const value=m[2].replace(/^['"]|['"]$/g,'');
  if(value.length>=8)secrets.push(value);else if(value)weakLocalFields.push({path:'backend/'+name,field:m[1]});
 }
}
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>{if(['node_modules','.git','.local','.pnpm-store','dist-ops'].includes(e.name))return [];const path=join(dir,e.name);return e.isDirectory()?files(path):[path];});}
const targets=['backend/src','backend/scripts','backend/migrations','backend/tests','frontend/src','frontend/dist','deploy','migrations','data','docs','reports','scripts','tests'];
const hits=[];let scanned=0;
for(const dir of targets)for(const path of files(join(root,dir))){
 const name=relative(root,path).replaceAll('\\','/');
 if(name.startsWith('deploy/secrets/')||name.startsWith('deploy/tls/')||name.startsWith('deploy/private/')||name==='deploy/.env'||statSync(path).size>3000000||/\.(woff2?|png|jpe?g|ico)$/i.test(path))continue;
 const content=readFileSync(path,'utf8');scanned++;
 if(secrets.some(secret=>content.includes(secret)))hits.push({path:name,kind:'known-local-secret'});
 if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AIza[0-9A-Za-z_-]{35}|gh[pousr]_[A-Za-z0-9]{30,}/.test(content))hits.push({path:name,kind:'credential-pattern'});
 if(path.endsWith('.sql')&&/INSERT\s+INTO\s+`?(?:users|auth_sessions|student_profiles)`?\s*\(/i.test(content))hits.push({path:name,kind:'private-records-in-sql'});
}
const git=spawnSync('git',['ls-files','--error-unmatch','README.md'],{cwd:root,encoding:'utf8'});
const result={scanned_files:scanned,findings:hits,weak_local_secret_fields:weakLocalFields,git_history_verifiable:git.status===0,limitations:['Not a Git history scanner or proof that arbitrary personal information is absent.','Docker image layers cannot be inspected without Docker.','Local ignored credentials and backups are intentionally not printed or packaged.']};
const reportName=process.argv[2]??'phase8a-secret-audit.json';
if(!/^[a-z0-9-]+\.json$/.test(reportName))throw Error('Invalid audit report name');
writeFileSync(join(root,'reports',reportName),JSON.stringify(result,null,2));
console.log(JSON.stringify({scanned_files:scanned,findings:hits.length,weak_local_fields:weakLocalFields.length,git_history_verifiable:result.git_history_verifiable}));
if(hits.length)process.exitCode=1;
