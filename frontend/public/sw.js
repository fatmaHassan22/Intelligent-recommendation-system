/* No auth cookies, subscription keys, course data or API responses are cached. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
function remember(id){return new Promise((resolve,reject)=>{
 const open=indexedDB.open('academic-push-seen',1);
 open.onupgradeneeded=()=>open.result.createObjectStore('seen');
 open.onerror=()=>reject(Error('Storage unavailable'));
 open.onsuccess=()=>{const db=open.result,tx=db.transaction('seen','readwrite'),store=tx.objectStore('seen');let duplicate=false;
  const get=store.get(id);get.onsuccess=()=>{duplicate=!!get.result;if(!duplicate)store.put(Date.now(),id);};
  const cursor=store.openCursor();cursor.onsuccess=()=>{const c=cursor.result;if(c){if(c.value<Date.now()-7*86400000)c.delete();c.continue();}};
  tx.oncomplete=()=>{db.close();resolve(!duplicate);};tx.onerror=()=>{db.close();reject(Error('Storage unavailable'));};};
 });}
self.addEventListener('push',event=>event.waitUntil((async()=>{
 let p;try{p=event.data.json();}catch{return;}
 if(!/^\d+$/.test(String(p.notification_id))||typeof p.title!=='string'||typeof p.body!=='string')return;
 // Repeated network delivery uses the same persistent ID and notification tag.
 let fresh;try{fresh=await remember(String(p.notification_id));}catch{fresh=true;}
 if(!fresh)return;
 await self.registration.showNotification(p.title.slice(0,150),{body:p.body.slice(0,500),tag:'academic-'+p.notification_id,renotify:false,data:{url:'/app/notifications'}});
})()));
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{
 const url=new URL('/app/notifications',self.location.origin).href;
 const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 for(const client of windows)if(new URL(client.url).origin===self.location.origin){await client.navigate(url);return client.focus();}
 return self.clients.openWindow(url);
})());});
