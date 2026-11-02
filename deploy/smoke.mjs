// Node >=22. Trust the test certificate explicitly; never disable verification.
import https from 'node:https';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const origin=process.env.PUBLIC_ORIGIN??'https://localhost:8443';
assert.equal(new URL(origin).protocol,'https:');
const agent=new https.Agent({ca:readFileSync(new URL('./tls/server.crt',import.meta.url))});
function get(path,headers={}) {return new Promise((resolve,reject)=>{https.get(origin+path,{agent,headers},r=>{let body='';r.on('data',c=>body+=c);r.on('end',()=>resolve({status:r.statusCode,headers:r.headers,body}));}).on('error',reject);});}
const index=await get('/app/curriculum');assert.equal(index.status,200);assert.match(index.body,/<html/);
assert.match(index.headers['content-security-policy'],/frame-ancestors 'none'/);
assert.match(index.headers['strict-transport-security'],/max-age=/);
assert.equal((await get('/health')).status,200);
const csrf=await get('/api/v1/auth/csrf');assert.equal(csrf.status,200);
assert.ok(JSON.parse(csrf.body).csrf_token);
assert.ok(csrf.headers['set-cookie'].some(c=>c.startsWith('__Host-academic_csrf=')&&c.includes('HttpOnly')&&c.includes('Secure')&&c.includes('SameSite=Lax')));
assert.equal((await get('/api/v1/auth/me')).status,401);
assert.equal((await get('/api/v1/auth/csrf',{Origin:'https://untrusted.example'})).status,403);
assert.equal((await get('/.env')).status,404);
agent.destroy();console.log('HTTPS SPA, health, headers, secure CSRF cookie, unauthenticated access and CORS smoke passed. No records written.');
