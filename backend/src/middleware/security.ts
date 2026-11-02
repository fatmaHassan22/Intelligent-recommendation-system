import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import type {Request,Response,NextFunction,RequestHandler} from 'express';
import type {Pool} from 'mysql2/promise';
import type {Config} from '../config.js';
import {rows} from '../db.js';
import {ApiError} from '../errors.js';
declare global { namespace Express { interface Request { actor?:{id:string;role:'STUDENT'|'ADMIN';tokenHash:string}; } } }
export const hashToken=(token:string)=>createHash('sha256').update(token).digest('hex');
export const sessionName=(c:Config)=>c.COOKIE_SECURE?'__Host-academic_session':'academic_session';
const csrfName=(c:Config)=>c.COOKIE_SECURE?'__Host-academic_csrf':'academic_csrf';
export function cookie(req:Request,name:string):string {
 const matches=(req.headers.cookie??'').split(';').map(s=>s.trim()).filter(s=>s.startsWith(name+'='));
 if(matches.length!==1)return '';try{return decodeURIComponent(matches[0].slice(name.length+1));}catch{return '';}
}
const cookieOptions=(c:Config)=>({httpOnly:true,secure:c.COOKIE_SECURE,sameSite:c.COOKIE_SAME_SITE,path:'/'} as const);
export function setSession(res:Response,c:Config,token:string) {res.cookie(sessionName(c),token,{...cookieOptions(c),maxAge:c.SESSION_TTL_HOURS*3600000});}
export function clearSession(res:Response,c:Config) {res.clearCookie(sessionName(c),cookieOptions(c));res.clearCookie(csrfName(c),cookieOptions(c));}
function signature(c:Config,nonce:string,session:string){return createHmac('sha256',c.CSRF_SECRET).update(nonce+':'+hashToken(session)).digest('hex');}
export function issueCsrf(req:Request,res:Response,c:Config,sessionOverride?:string) {
 const nonce=randomBytes(32).toString('hex');const token=nonce+'.'+signature(c,nonce,sessionOverride??cookie(req,sessionName(c)));
 res.cookie(csrfName(c),token,{...cookieOptions(c),maxAge:c.SESSION_TTL_HOURS*3600000});return token;
}
export const protectCsrf=(c:Config):RequestHandler=>(req,res,next)=>{
 if(['GET','HEAD','OPTIONS'].includes(req.method)){next();return;}
 const supplied=req.get('X-CSRF-Token')??'', stored=cookie(req,csrfName(c));
 if(!/^[a-f0-9]{64}\.[a-f0-9]{64}$/.test(supplied)||supplied!==stored){next(new ApiError(403,'CSRF_INVALID'));return;}
 const [nonce,sig]=supplied.split('.');const expected=signature(c,nonce,cookie(req,sessionName(c)));
 if(!timingSafeEqual(Buffer.from(sig),Buffer.from(expected))){next(new ApiError(403,'CSRF_INVALID'));return;}
 next();
};
export const authenticate=(db:Pool,c:Config):RequestHandler=>async(req,res,next)=>{
 const token=cookie(req,sessionName(c));
 if(!/^[a-f0-9]{64}$/.test(token))throw new ApiError(401,'AUTH_REQUIRED');
 const hash=hashToken(token);
 const result=await rows(db,'SELECT u.id,u.role FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP() AND u.is_active=1',[hash]);
 if(!result[0])throw new ApiError(401,'AUTH_REQUIRED');
 req.actor={id:String(result[0].id),role:result[0].role,tokenHash:hash};next();
};
export const requireRole=(role:'STUDENT'|'ADMIN'):RequestHandler=>(req,res,next)=>{if(!req.actor)throw new ApiError(401,'AUTH_REQUIRED');if(req.actor.role!==role)throw new ApiError(403,'FORBIDDEN');next();};
