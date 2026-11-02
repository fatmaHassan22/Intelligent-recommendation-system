import {randomUUID,createHash} from 'node:crypto';
import {Router} from 'express';
import {z} from 'zod';
import type {Pool} from 'mysql2/promise';
import type {Config} from '../../config.js';
import {rows,write,transaction} from '../../db.js';
import {ApiError} from '../../errors.js';
import {encryptToken,decryptToken} from '../moodle/security.js';
import {sqlDate} from '../productivity/time.js';
import {validEndpoint,sendPush,vapidAuthorization,type Subscription} from './transport.js';
export function pushConfigured(c:Config){try{if(!c.PUSH_ENABLED||!/^[a-f\d]{64}$/i.test(c.PUSH_ENCRYPTION_KEY)||!/^mailto:[^\s@]+@[^\s@]+$|^https:\/\//.test(c.VAPID_SUBJECT))return false;vapidAuthorization('https://fcm.googleapis.com',c.VAPID_PUBLIC_KEY,c.VAPID_PRIVATE_KEY,c.VAPID_SUBJECT);return true;}catch{return false;}}
export async function enqueuePush(pool:Pool,now=new Date()){
 // Durable catch-up: derive outbox entries idempotently from committed notices.
 // No historical push on a newly connected device; skip read/dismissed notices.
 await write(pool,"INSERT INTO push_deliveries(user_id,subscription_id,notification_id,next_attempt_at,created_at) SELECT n.user_id,s.id,n.id,?,? FROM student_notifications n JOIN push_subscriptions s ON s.user_id=n.user_id AND s.enabled=1 AND s.created_at<=n.created_at WHERE n.created_at>=? AND n.read_at IS NULL AND n.dismissed_at IS NULL ON DUPLICATE KEY UPDATE id=push_deliveries.id",[sqlDate(now),sqlDate(now),sqlDate(new Date(now.getTime()-86400000))]);
}
const schema=z.object({endpoint:z.string().max(4096).refine(validEndpoint),expirationTime:z.number().nullable().optional(),keys:z.object({p256dh:z.string().regex(/^[A-Za-z0-9_-]{87}$/),auth:z.string().regex(/^[A-Za-z0-9_-]{22}$/)}).strict()}).strict();
export function pushRoutes(pool:Pool,c:Config){const r=Router();
 r.get('/status',async(req,res)=>res.json({data:{configured:pushConfigured(c),public_key:pushConfigured(c)?c.VAPID_PUBLIC_KEY:null,devices:await rows(pool,'SELECT id,endpoint_hash,device_label,detailed,enabled FROM push_subscriptions WHERE user_id=? ORDER BY created_at',[req.actor!.id])}}));
 r.post('/subscriptions',async(req,res)=>{
  if(!pushConfigured(c))throw new ApiError(503,'PUSH_NOT_CONFIGURED');
  const b=z.object({subscription:schema,device_label:z.string().trim().min(1).max(80),detailed:z.boolean().default(false)}).strict().parse(req.body),user=req.actor!.id,hash=createHash('sha256').update(b.subscription.endpoint).digest('hex');
  const ecKey=Buffer.from(b.subscription.keys.p256dh,'base64url');if(ecKey.length!==65||ecKey[0]!==4)throw new ApiError(400,'VALIDATION_ERROR');
  try{await transaction(pool,async db=>{
   // Serialize each owner's device quota, including concurrent new endpoints.
   await rows(db,'SELECT id FROM users WHERE id=? FOR UPDATE',[user]);
   const found=(await rows(db,'SELECT id,user_id FROM push_subscriptions WHERE endpoint_hash=? FOR UPDATE',[hash]))[0];if(found&&String(found.user_id)!==user)throw new ApiError(409,'PUSH_DEVICE_ALREADY_LINKED');
   if(!found&&Number((await rows(db,'SELECT COUNT(*) AS n FROM push_subscriptions WHERE user_id=?',[user]))[0].n)>=10)throw new ApiError(409,'PUSH_DEVICE_LIMIT');
   const cipher=encryptToken(JSON.stringify(b.subscription),c.PUSH_ENCRYPTION_KEY,user,'push:'+hash);
   if(found)await write(db,'UPDATE push_subscriptions SET subscription_cipher=?,device_label=?,detailed=?,enabled=1,updated_at=UTC_TIMESTAMP(3) WHERE id=? AND user_id=?',[cipher,b.device_label,b.detailed,found.id,user]);
   else await write(db,'INSERT INTO push_subscriptions(id,user_id,endpoint_hash,subscription_cipher,device_label,detailed,created_at,updated_at) VALUES(?,?,?,?,?,?,UTC_TIMESTAMP(3),UTC_TIMESTAMP(3))',[randomUUID(),user,hash,cipher,b.device_label,b.detailed]);
  });}catch(e){if(['ER_DUP_ENTRY','ER_LOCK_DEADLOCK','ER_LOCK_WAIT_TIMEOUT'].includes(String((e as {code?:string}).code)))throw new ApiError(409,'PUSH_DEVICE_CHANGED');throw e;}res.status(201).json({data:{saved:true}});
 });
 r.delete('/subscriptions/:id',async(req,res)=>{const id=z.string().uuid().parse(req.params.id);await write(pool,'DELETE FROM push_subscriptions WHERE id=? AND user_id=?',[id,req.actor!.id]);res.status(204).end();});return r;
}
export async function deliverPush(pool:Pool,c:Config,now=new Date(),sender:typeof sendPush=sendPush){if(!pushConfigured(c))return {sent:0};const lock=await pool.getConnection();let acquired=false,sent=0;
 try{acquired=Number((await rows(lock,"SELECT GET_LOCK(CONCAT(DATABASE(),':push_delivery'),0) AS ok"))[0].ok)===1;if(!acquired)return {sent:0};
  // A process can die after persisting an attempt but before recording its
  // outcome. The persisted budget must still prevent a fifth network attempt.
  await write(lock,"UPDATE push_deliveries SET status='FAILED',error_code='PUSH_RETRY_LIMIT' WHERE status='PENDING' AND attempts>=4");
  const jobs=await rows(lock,"SELECT d.*,s.subscription_cipher,s.endpoint_hash,s.detailed,n.title,n.message,n.type,n.dismissed_at,n.read_at,mc.monitoring_opt_in,mc.notifications_enabled,mc.enabled AS monitoring_enabled,mc.state AS moodle_state FROM push_deliveries d JOIN push_subscriptions s ON s.id=d.subscription_id AND s.user_id=d.user_id JOIN users u ON u.id=d.user_id JOIN student_notifications n ON n.id=d.notification_id AND n.user_id=d.user_id LEFT JOIN moodle_connections mc ON mc.user_id=d.user_id WHERE d.status='PENDING' AND d.next_attempt_at<=? AND s.enabled=1 AND u.is_active=1 AND u.role='STUDENT' ORDER BY d.id LIMIT 10",[sqlDate(now)]);
  for(const j of jobs){
   // Recheck consent just before each dispatch, rather than using batch-old
   // preferences after earlier network requests. Already in-flight sends cannot be recalled.
   const fresh=(await rows(lock,"SELECT s.enabled AS subscription_enabled,s.detailed,u.is_active AS account_active,n.read_at,n.dismissed_at,mc.monitoring_opt_in,mc.notifications_enabled,mc.enabled AS monitoring_enabled,mc.state AS moodle_state FROM push_deliveries d JOIN push_subscriptions s ON s.id=d.subscription_id AND s.user_id=d.user_id JOIN users u ON u.id=d.user_id JOIN student_notifications n ON n.id=d.notification_id AND n.user_id=d.user_id LEFT JOIN moodle_connections mc ON mc.user_id=d.user_id WHERE d.id=? AND d.status='PENDING'",[j.id]))[0];
   if(!fresh)continue;Object.assign(j,fresh);
   if(!j.subscription_enabled||!j.account_active||j.dismissed_at||j.read_at||(j.type.startsWith('MOODLE_')&&(!j.monitoring_opt_in||!j.notifications_enabled||!j.monitoring_enabled||j.moodle_state!=='CONNECTED'))){await write(lock,"UPDATE push_deliveries SET status='CANCELLED' WHERE id=?",[j.id]);continue;}
   // Persist attempt before network; a lost response remains delivery-uncertain.
   const attempt=Number(j.attempts)+1;await write(lock,'UPDATE push_deliveries SET attempts=?,next_attempt_at=? WHERE id=?',[attempt,sqlDate(new Date(now.getTime()+Math.min(360,5*2**attempt)*60000)),j.id]);
   try{const subscription=JSON.parse(decryptToken(j.subscription_cipher,c.PUSH_ENCRYPTION_KEY,String(j.user_id),'push:'+j.endpoint_hash)) as Subscription;
    const payload=JSON.stringify({title:j.detailed?String(j.title).slice(0,150):'نظام الدعم الأكاديمي',body:j.detailed?String(j.message).slice(0,500):'لديك تحديث جديد. افتحي التطبيق للاطلاع عليه.',notification_id:String(j.notification_id),url:'/app/notifications'});
    const status=await sender(subscription,payload,{publicKey:c.VAPID_PUBLIC_KEY,privateKey:c.VAPID_PRIVATE_KEY,subject:c.VAPID_SUBJECT});
    if(status>=200&&status<300){await write(lock,"UPDATE push_deliveries SET status='SENT',sent_at=?,error_code=NULL WHERE id=?",[sqlDate(now),j.id]);sent++;}
    else if(status===404||status===410){await write(lock,"UPDATE push_deliveries SET status='EXPIRED',error_code='PUSH_SUBSCRIPTION_EXPIRED' WHERE id=?",[j.id]);await write(lock,'UPDATE push_subscriptions SET enabled=0 WHERE id=?',[j.subscription_id]);}
    else {await write(lock,"UPDATE push_deliveries SET status=?,error_code='PUSH_PROVIDER_REJECTED' WHERE id=?",[(status===429||status>=500)&&attempt<4?'PENDING':'FAILED',j.id]);}
   }catch{await write(lock,"UPDATE push_deliveries SET status=?,error_code='PUSH_DELIVERY_UNCERTAIN' WHERE id=?",[attempt<4?'PENDING':'FAILED',j.id]);}
  }return {sent};
 }finally {try{if(acquired)await lock.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(),':push_delivery'))");}finally{lock.release();}}
}
