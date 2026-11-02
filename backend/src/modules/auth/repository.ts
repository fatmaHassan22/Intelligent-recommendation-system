import {write,type Executor} from '../../db.js';
export const revokeSession=(db:Executor,hash:string)=>write(db,'DELETE FROM auth_sessions WHERE token_hash=?',[hash]);
export async function insertSession(db:Executor,hash:string,userId:string,ttl:number) {
 await write(db,'DELETE FROM auth_sessions WHERE expires_at<=UTC_TIMESTAMP()');
 await write(db,'INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES(?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? HOUR))',[hash,userId,ttl]);
}
