import {test} from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import type {Pool} from 'mysql2/promise';
import {loadConfig} from '../src/config.js';
import {createApp} from '../src/app.js';
const env={NODE_ENV:'production',DB_USER:'academic_app',DB_PASSWORD:'fixture-only',CSRF_SECRET:'fixture-only-'.repeat(4),COOKIE_SECURE:'true',CORS_ORIGINS:'https://localhost:8443',TRUST_PROXY_HOPS:'1'};
test('Production rejects insecure cookies, HTTP origins and root DB account',()=>{
 for(const override of [{COOKIE_SECURE:'false'},{CORS_ORIGINS:'http://localhost:8443'},{DB_USER:'root'}])assert.throws(()=>loadConfig({...env,...override}));
});
test('Secret file failures are sanitized and ambiguous secret sources rejected',()=>{
 assert.throws(()=>loadConfig({...env,DB_PASSWORD_FILE:'/nonexistent/secret'}),/only one secret source/);
 assert.throws(()=>loadConfig({...env,DB_PASSWORD:undefined,DB_PASSWORD_FILE:'/nonexistent/secret'}),/^Error: Cannot read secret file for DB_PASSWORD$/);
});
test('HTTPS reverse proxy preserves Secure host cookies, CSRF and origin restrictions',async()=>{
 const app=createApp({} as Pool,loadConfig(env));
 await request(app).get('/api/v1/auth/csrf').expect(400);
 const r=await request(app).get('/api/v1/auth/csrf').set('X-Forwarded-Proto','https').expect(200);
 assert.ok(r.headers['set-cookie'].some((s:string)=>s.startsWith('__Host-academic_csrf=')&&s.includes('Secure')&&s.includes('HttpOnly')));
 await request(app).post('/api/v1/auth/login').set('X-Forwarded-Proto','https').send({}).expect(403);
 await request(app).get('/api/v1/auth/csrf').set('X-Forwarded-Proto','https').set('Origin','https://evil.example').expect(403);
});
