import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
test('Service worker suppresses repeated delivery across reload and navigates only to its own app',async()=>{
 const source=await readFile(new URL('../../frontend/public/sw.js',import.meta.url),'utf8'),seen=new Map<string,number>();let shown=0,opened='';
 const indexedDB={open:()=>{const request:any={};queueMicrotask(()=>{request.result={objectStoreNames:['seen'],close(){},transaction(){const tx:any={objectStore(){return {get(id:string){const r:any={};queueMicrotask(()=>{r.result=seen.get(id);r.onsuccess();});return r;},put(value:number,id:string){seen.set(id,value);},openCursor(){const r:any={};queueMicrotask(()=>{r.result=null;r.onsuccess();});return r;}};}};setTimeout(()=>tx.oncomplete?.(),0);return tx;}};request.onsuccess();});return request;}};
 function load(){const events:Record<string,(event:any)=>void>={};const self={location:{origin:'https://app.example.test'},registration:{showNotification:async()=>{shown++;}},clients:{matchAll:async()=>[],openWindow:async(url:string)=>{opened=url;}},addEventListener:(name:string,handler:(event:any)=>void)=>{events[name]=handler;}};vm.runInNewContext(source,{self,indexedDB,URL,Date});return events;}
 const data={title:'Test',body:'Generic',notification_id:'410',url:'https://evil.test'};
 async function push(events:ReturnType<typeof load>){let pending!:Promise<unknown>;events.push({data:{json:()=>data},waitUntil:(p:Promise<unknown>)=>{pending=p;}});await pending;}
 await push(load());await push(load());assert.equal(shown,1);
 let pending!:Promise<unknown>;load().notificationclick({notification:{close(){}},waitUntil:(p:Promise<unknown>)=>{pending=p;}});await pending;assert.equal(opened,'https://app.example.test/app/notifications');
});
