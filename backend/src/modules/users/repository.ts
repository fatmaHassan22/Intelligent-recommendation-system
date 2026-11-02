import {rows,write,type Executor} from '../../db.js';
export const findUser=(db:Executor,email:string)=>rows(db,'SELECT id,full_name,email,password_hash,role,is_active,created_at FROM users WHERE email=?',[email]).then(r=>r[0]);
export const publicUser=(u:any)=>({id:String(u.id),full_name:u.full_name,email:u.email,role:u.role,created_at:u.created_at});
export const getCurrentUser=(db:Executor,id:string)=>rows(db,'SELECT id,full_name,email,role,created_at FROM users WHERE id=?',[id]).then(r=>r[0]);
export async function insertUser(db:Executor,data:any,hash:string) {
 const result=await write(db,'INSERT INTO users(full_name,email,password_hash,role) VALUES(?,?,?,\'STUDENT\')',[data.full_name,data.email,hash]);
 return String(result.insertId);
}
