import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import pino from 'pino';
export const logger=pino({level:process.env.BACKEND_LOG_LEVEL??(process.env.NODE_ENV==='test'?'silent':'info'),redact:['password','password_hash','token','cookie','authorization','DB_PASSWORD','CSRF_SECRET']});
export class ApiError extends Error { constructor(public status:number,public code:string, message:string=code) {super(message);} }
export const errorHandler:ErrorRequestHandler=(err,req,res,_next)=>{
 if (err instanceof ZodError) {res.status(400).json({error:{code:'VALIDATION_ERROR',fields:err.issues.map(i=>({path:i.path.join('.'),code:i.code}))}});return;}
 if (err instanceof ApiError) {res.status(err.status).json({error:{code:err.code,message:err.message}});return;}
 if (err.code==='ER_DUP_ENTRY') {res.status(409).json({error:{code:'DUPLICATE_RECORD'}});return;}
 if (err.type==='entity.parse.failed') {res.status(400).json({error:{code:'INVALID_JSON'}});return;}
 if (err.type==='entity.too.large') {res.status(413).json({error:{code:'PAYLOAD_TOO_LARGE'}});return;}
 logger.error({event:'request_failed',error_code:typeof err.code==='string'?err.code:'INTERNAL_ERROR',request_id:res.locals.requestId});
 res.status(500).json({error:{code:'INTERNAL_ERROR'}});
};
