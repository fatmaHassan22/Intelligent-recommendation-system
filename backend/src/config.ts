import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {readFileSync} from 'node:fs';
dotenv.config({ path: process.env.ENV_FILE ?? fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
const bool = z.enum(['true','false']).transform(v => v === 'true');
const schema = z.object({
 NODE_ENV: z.enum(['development','test','production']).default('development'),
 PORT: z.coerce.number().int().min(1).max(65535).default(3000), HOST: z.string().default('127.0.0.1'),
 DB_HOST: z.string().default('127.0.0.1'), DB_PORT: z.coerce.number().int().default(3306),
 DB_NAME: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/).default('academic_support'),
 DB_USER: z.string().min(1), DB_PASSWORD: z.string().min(1),
 CSRF_SECRET: z.string().min(32), CORS_ORIGINS: z.string().default('http://localhost:5173'),
 COOKIE_SECURE: bool.default(false), COOKIE_SAME_SITE: z.enum(['strict','lax','none']).default('lax'),
 SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(168),
 TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
 BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
 TEST_DB_NAME: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*_test$/).default('academic_support_phase2_test'),
 GEMINI_API_KEY:z.string().default(''), GEMINI_MODEL:z.string().regex(/^[A-Za-z0-9._-]{1,100}$/).default('gemini-flash-latest'),
 GEMINI_TIMEOUT_MS:z.coerce.number().int().min(1000).max(60000).default(30000),
 AI_DAILY_LIMIT:z.coerce.number().int().min(1).max(200).default(20), AI_MIN_INTERVAL_SECONDS:z.coerce.number().int().min(0).max(300).default(10),
 AI_GLOBAL_CONCURRENCY:z.coerce.number().int().min(1).max(4).default(2), AI_MAX_OUTPUT_TOKENS:z.coerce.number().int().min(128).max(2048).default(1024),
 AI_RETENTION_DAYS:z.coerce.number().int().min(7).max(365).default(90),
 BACKGROUND_JOBS_ENABLED:bool.default(true),
 PUSH_ENABLED:bool.default(false),PUSH_ENCRYPTION_KEY:z.string().default(''),VAPID_PUBLIC_KEY:z.string().default(''),VAPID_PRIVATE_KEY:z.string().default(''),VAPID_SUBJECT:z.string().default(''),
 MOODLE_BASE_URL:z.string().default(''), MOODLE_ENCRYPTION_KEY:z.string().default(''),
 MOODLE_SYNC_ENABLED:bool.default(false), MOODLE_SYNC_INTERVAL_MINUTES:z.coerce.number().int().min(5).max(10080).default(360),
 MOODLE_TIMEOUT_MS:z.coerce.number().int().min(1000).max(30000).default(10000)
});
export type Config = z.infer<typeof schema>;
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
 env={...env};
 for(const key of ['DB_PASSWORD','CSRF_SECRET','GEMINI_API_KEY','MOODLE_ENCRYPTION_KEY','PUSH_ENCRYPTION_KEY','VAPID_PRIVATE_KEY','VAPID_PUBLIC_KEY']) {
  if(env[key+'_FILE']) {
   if(env[key]) throw new Error('Set only one secret source for '+key);
   try {env[key]=readFileSync(env[key+'_FILE']!,'utf8').replace(/\r?\n$/,'');}
   catch {throw new Error('Cannot read secret file for '+key);}
  }
 }
 const parsed = schema.safeParse(env);
 if (!parsed.success) throw new Error('Invalid environment fields: ' + parsed.error.issues.map(i => i.path.join('.')).join(', '));
 const c = parsed.data;
 if (c.NODE_ENV === 'production' && (!c.COOKIE_SECURE || c.BCRYPT_ROUNDS < 12)) throw new Error('Production requires secure cookies and bcrypt cost >= 12');
 if (c.NODE_ENV !== 'test' && c.BCRYPT_ROUNDS < 12) throw new Error('bcrypt cost >= 12 required outside isolated tests');
 if (c.COOKIE_SAME_SITE === 'none' && !c.COOKIE_SECURE) throw new Error('SameSite=None requires Secure');
 for (const origin of c.CORS_ORIGINS.split(',')) {
  if (new URL(origin.trim()).origin !== origin.trim()) throw new Error('CORS_ORIGINS must contain exact origins');
  if(c.NODE_ENV==='production'&&new URL(origin.trim()).protocol!=='https:')throw new Error('Production CORS origins require HTTPS');
 }
 if(c.NODE_ENV==='production'&&c.DB_USER==='root')throw new Error('Production must use a scoped database account');
 return c;
}
