import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import type {Pool} from 'mysql2/promise';
import {migrate} from '../scripts/migrations.js';
test('Migration verifies all prior checksums before pending DDL and releases its lock on failure',async()=>{
 const ddl:string[]=[];let released=false;
 const db={execute:async(sql:string)=>{
  if(sql.includes('GET_LOCK'))return [[{acquired:1}]];
  if(sql.includes('SELECT version,checksum'))return [[{version:'008_moodle_institution_binding.sql',checksum:'invalid-fixture'}]];
  if(sql.startsWith('CREATE TABLE IF NOT EXISTS backend_schema_migrations'))return [[]];
  throw Error('Unexpected statement');
 },query:async(sql:string)=>{ddl.push(sql);},release:()=>{released=true;}};
 await assert.rejects(()=>migrate({getConnection:async()=>db} as unknown as Pool),/Applied migration changed/);
 assert.deepEqual(ddl,["SELECT RELEASE_LOCK(CONCAT(DATABASE(),':backend_migrations'))"]);assert.ok(released);
});
test('A fully applied migration set is idempotent and performs no application DDL',async()=>{
 const history=[];
 for(const version of (await readdir(new URL('../migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')))history.push({version,checksum:createHash('sha256').update(await readFile(new URL('../migrations/'+version,import.meta.url),'utf8')).digest('hex')});
 let wrote=false;
 const db={execute:async(sql:string,args?:string[])=>{
  if(sql.includes('GET_LOCK'))return [[{acquired:1}]];
  if(sql.includes('SELECT version,checksum'))return [history];
  if(sql.startsWith('SELECT checksum'))return [[history.find(h=>h.version===args?.[0])]];
  if(sql.startsWith('CREATE TABLE IF NOT EXISTS backend_schema_migrations'))return [[]];
  wrote=true;throw Error('Unexpected write');
 },query:async(sql:string)=>{if(!sql.includes('RELEASE_LOCK'))wrote=true;},release:()=>{}};
 await migrate({getConnection:async()=>db} as unknown as Pool);assert.equal(wrote,false);
});
