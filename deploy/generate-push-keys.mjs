import {createECDH,randomBytes} from 'node:crypto';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
const dir=new URL('./secrets/',import.meta.url);mkdirSync(dir,{recursive:true,mode:0o700});
const names=['push_encryption_key','vapid_public_key','vapid_private_key'];
if(names.some(name=>existsSync(new URL(name,dir))))throw Error('Refusing to overwrite existing push keys; rotate using a reviewed plan.');
const ec=createECDH('prime256v1');ec.generateKeys();const values=[randomBytes(32).toString('hex'),ec.getPublicKey().toString('base64url'),ec.getPrivateKey().toString('base64url')];
for(let i=0;i<names.length;i++)writeFileSync(new URL(names[i],dir),values[i],{flag:'wx',mode:0o400});
console.log('Push key files generated locally. No values printed. Adjust container read permissions as described in deployment-guide.md.');
