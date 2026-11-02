import {Router} from 'express';
import {rateLimit} from 'express-rate-limit';
import type {Pool} from 'mysql2/promise';
import type {Config} from '../../config.js';
import {registerSchema,loginSchema} from '../../validation.js';
import {authenticate,clearSession,cookie,hashToken,issueCsrf,sessionName,setSession} from '../../middleware/security.js';
import {authService} from './service.js';
import {getCurrentUser} from '../users/repository.js';
import {revokeSession} from './repository.js';
export function authRoutes(pool:Pool,c:Config,limit=20) {
 const router=Router(),service=authService(pool,c),auth=authenticate(pool,c);
 const limiter=rateLimit({windowMs:15*60*1000,limit,standardHeaders:'draft-8',legacyHeaders:false,
  handler:(_req,res)=>res.status(429).json({error:{code:'AUTH_RATE_LIMITED'}})});
 router.get('/csrf',(req,res)=>res.json({csrf_token:issueCsrf(req,res,c)}));
 router.post('/register',limiter,async(req,res)=>{
  const {user,token}=await service.register(registerSchema.parse(req.body));setSession(res,c,token);
  res.status(201).json({user,csrf_token:issueCsrf(req,res,c,token)});
 });
 router.post('/login',limiter,async(req,res)=>{
  const tokenCookie=cookie(req,sessionName(c));
  const {user,token}=await service.login(loginSchema.parse(req.body),tokenCookie?hashToken(tokenCookie):undefined);
  setSession(res,c,token);res.json({user,csrf_token:issueCsrf(req,res,c,token)});
 });
 router.post('/logout',auth,async(req,res)=>{await revokeSession(pool,req.actor!.tokenHash);clearSession(res,c);res.status(204).end();});
 router.get('/me',auth,async(req,res)=>res.json({data:await getCurrentUser(pool,req.actor!.id)}));
 return router;
}
