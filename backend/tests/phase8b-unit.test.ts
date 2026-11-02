import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createECDH,createPublicKey,verify} from 'node:crypto';
import {encryptPush,validEndpoint,vapidAuthorization} from '../src/modules/push/transport.js';
import {nextMoodleAttempt} from '../src/modules/moodle/scheduling.js';
import {sealBrowserState,openBrowserState} from '../src/modules/moodle/browser-boundary.js';
test('Browser authentication envelopes are encrypted, owner-bound and origin-restricted',()=>{
 const state={cookies:[{name:'MoodleSession',value:'fixture-not-real',domain:'moodle.alaqsa.edu.ps',path:'/',expires:1999999999,httpOnly:true,secure:true,sameSite:'Lax' as const}],origins:[]},key='d'.repeat(64);
 const cipher=sealBrowserState(state,key,'101');assert.ok(!cipher.includes('fixture-not-real'));assert.deepEqual(openBrowserState(cipher,key,'101'),state);assert.throws(()=>openBrowserState(cipher,key,'102'));
 assert.throws(()=>sealBrowserState({...state,cookies:[{...state.cookies[0],domain:'evil.test'}]},key,'101'));
});
test('Web Push encryption matches the independent RFC 8291 Appendix A vector',()=>{
 const s={endpoint:'https://fcm.googleapis.com/fcm/send/fixture',keys:{p256dh:'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',auth:'BTBZMqHH6r4Tts7J_aSIgg'}};
 const result=encryptPush(s,Buffer.from('V2hlbiBJIGdyb3cgdXAsIEkgd2FudCB0byBiZSBhIHdhdGVybWVsb24','base64url').toString(),Buffer.from('yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw','base64url'),Buffer.from('DGv6ra1nlYgDCS1FRnbzlw','base64url'));
 assert.equal(result.subarray(86).toString('base64url'),'8pfeW0KbunFT06SuDKoJH9Ql87S1QUrdirN6GcG7sFz1y1sqLgVi1VhjVkHsUoEsbI_0LpXMuGvnzQ');assert.equal(result.readUInt32BE(16),4096);
});
test('VAPID signature, audience and expiry verify independently; wrong keys rejected',()=>{
 const ec=createECDH('prime256v1');ec.generateKeys();const pub=ec.getPublicKey(),priv=ec.getPrivateKey().toString('base64url'),authorization=vapidAuthorization('https://fcm.googleapis.com/path',pub.toString('base64url'),priv,'mailto:test@example.test',0);
 const jwt=authorization.split('t=')[1].split(',')[0],parts=jwt.split('.'),key=createPublicKey({format:'jwk',key:{kty:'EC',crv:'P-256',x:pub.subarray(1,33).toString('base64url'),y:pub.subarray(33).toString('base64url')}});
 assert.ok(verify('sha256',Buffer.from(parts[0]+'.'+parts[1]),{key,dsaEncoding:'ieee-p1363'},Buffer.from(parts[2],'base64url')));assert.deepEqual(JSON.parse(Buffer.from(parts[1],'base64url').toString()),{aud:'https://fcm.googleapis.com',exp:3600,sub:'mailto:test@example.test'});
 assert.throws(()=>vapidAuthorization('https://fcm.googleapis.com',pub.toString('base64url'),Buffer.alloc(32,1).toString('base64url'),'mailto:test@example.test'));
});
test('Push endpoints reject SSRF, credentials, HTTP and lookalike domains',()=>{
 for(const url of ['http://fcm.googleapis.com/a','https://127.0.0.1/a','https://fcm.googleapis.com.evil.test/a','https://user@fcm.googleapis.com/a','https://fcm.googleapis.com:8443/a','https://FCM.GOOGLEAPIS.COM/a','https://fcm.googleapis.com/%61','https://fcm.googleapis.com//a','https://fcm.googleapis.com/a?variant=1'])assert.equal(validEndpoint(url),false);
 for(const host of ['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'])assert.ok(validEndpoint('https://'+host+'/fixture'));
});
test('Six-hour default scheduling and bounded backoff survive persisted failure counts',()=>{
 const now=new Date('2026-10-17T00:00:00Z');for(const [failure,minutes] of [[0,15],[1,15],[2,30],[3,60],[4,360],[20,360]])assert.equal((nextMoodleAttempt(now,failure).getTime()-now.getTime())/60000,minutes);
});
