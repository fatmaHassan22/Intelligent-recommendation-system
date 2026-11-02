// RFC 8291 (aes128gcm), RFC 8188 single record, RFC 8292 VAPID.
import {createECDH,createCipheriv,createPrivateKey,sign,hkdfSync,randomBytes} from 'node:crypto';
export interface Subscription {endpoint:string;keys:{p256dh:string;auth:string}}
export function validEndpoint(value:string){try{const u=new URL(value);return u.href===value&&u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&!u.hash&&!u.search&&!u.pathname.includes('%')&&!u.pathname.includes('//')&&['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].includes(u.hostname);}catch{return false;}}
const hkdf=(key:Buffer,salt:Buffer,info:Buffer,len:number)=>Buffer.from(hkdfSync('sha256',key,salt,info,len));
export function encryptPush(subscription:Subscription,payload:string,privateKey?:Buffer,salt=randomBytes(16)){
 const ua=Buffer.from(subscription.keys.p256dh,'base64url'),auth=Buffer.from(subscription.keys.auth,'base64url');
 if(ua.length!==65||ua[0]!==4||auth.length!==16||Buffer.byteLength(payload)>3000)throw Error('PUSH_INVALID_PAYLOAD');
 const ec=createECDH('prime256v1');if(privateKey)ec.setPrivateKey(privateKey);else ec.generateKeys();const pub=ec.getPublicKey();
 const ikm=hkdf(ec.computeSecret(ua),auth,Buffer.concat([Buffer.from('WebPush: info\0'),ua,pub]),32);
 const key=hkdf(ikm,salt,Buffer.from('Content-Encoding: aes128gcm\0'),16),nonce=hkdf(ikm,salt,Buffer.from('Content-Encoding: nonce\0'),12);
 const cipher=createCipheriv('aes-128-gcm',key,nonce),encrypted=Buffer.concat([cipher.update(Buffer.concat([Buffer.from(payload),Buffer.from([2])])),cipher.final(),cipher.getAuthTag()]);
 const recordSize=Buffer.alloc(4);recordSize.writeUInt32BE(4096);
 return Buffer.concat([salt,recordSize,Buffer.from([65]),pub,encrypted]);
}
export function vapidAuthorization(endpoint:string,publicKey:string,privateKey:string,subject:string,now=Date.now()){
 const point=Buffer.from(publicKey,'base64url');if(point.length!==65||point[0]!==4)throw Error('PUSH_INVALID_CONFIG');
 const ec=createECDH('prime256v1');ec.setPrivateKey(Buffer.from(privateKey,'base64url'));if(!ec.getPublicKey().equals(point))throw Error('PUSH_INVALID_CONFIG');
 const key=createPrivateKey({key:{kty:'EC',crv:'P-256',x:point.subarray(1,33).toString('base64url'),y:point.subarray(33).toString('base64url'),d:privateKey},format:'jwk'});
 const encoded=(o:unknown)=>Buffer.from(JSON.stringify(o)).toString('base64url');
 const jwt=encoded({typ:'JWT',alg:'ES256'})+'.'+encoded({aud:new URL(endpoint).origin,exp:Math.floor(now/1000)+3600,sub:subject});
 return `vapid t=${jwt}.${sign('sha256',Buffer.from(jwt),{key,dsaEncoding:'ieee-p1363'}).toString('base64url')}, k=${publicKey}`;
}
export async function sendPush(s:Subscription,payload:string,config:{publicKey:string;privateKey:string;subject:string}){
 if(!validEndpoint(s.endpoint))throw Error('PUSH_ENDPOINT_REJECTED');
 const body=encryptPush(s,payload),authorization=vapidAuthorization(s.endpoint,config.publicKey,config.privateKey,config.subject);
 const response=await fetch(s.endpoint,{method:'POST',redirect:'error',headers:{Authorization:authorization,TTL:'3600',Urgency:'normal','Content-Type':'application/octet-stream','Content-Encoding':'aes128gcm'},body:new Uint8Array(body),signal:AbortSignal.timeout(10000)});
 await response.body?.cancel();return response.status;
}
