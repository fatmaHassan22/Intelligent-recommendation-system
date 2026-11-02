import {runMoodleMonitoring} from './moodle/worker.js';
import {deliverPush,enqueuePush} from './push/service.js';
import type {Pool} from 'mysql2/promise';
import type {Config} from '../config.js';
import {rows,write} from '../db.js';
import {logger} from '../errors.js';
import {sqlDate} from './productivity/time.js';
import {moodleConfigured,syncMoodle} from './moodle/service.js';
import {institutionUrl} from './moodle/security.js';
export async function purgeOldChats(pool:Pool,c:Config,now:Date){const cutoff=sqlDate(new Date(now.getTime()-c.AI_RETENTION_DAYS*86400000));await write(pool,"DELETE FROM ai_conversations WHERE updated_at<? AND NOT EXISTS(SELECT 1 FROM ai_chat_requests r WHERE r.conversation_id=ai_conversations.id AND r.status='RUNNING' AND r.lease_until>?) LIMIT 1000",[cutoff,sqlDate(now)]);await write(pool,'DELETE FROM ai_usage_records WHERE created_at<? LIMIT 1000',[sqlDate(new Date(now.getTime()-180*86400000))]);}
export function startIntegrationJobs(pool:Pool,c:Config){let stopped=false,running=false,lastCleanup=0;const tick=async()=>{if(stopped||running)return;running=true;try{const now=new Date();if(c.PUSH_ENABLED){await enqueuePush(pool,now);await deliverPush(pool,c,now);if(stopped)return;}if(now.getTime()-lastCleanup>=3600000){await purgeOldChats(pool,c,now);lastCleanup=now.getTime();}const monitoring=await runMoodleMonitoring(pool,c,now,undefined,()=>stopped);if(monitoring.failed)logger.warn({event:'moodle_scheduled_sync_failed',count:monitoring.failed});}catch{logger.error({event:'integration_jobs_failed'});}finally{running=false;}};const timer=setInterval(()=>void tick(),60000);timer.unref();void tick();return async()=>{stopped=true;clearInterval(timer);while(running)await new Promise(resolve=>setTimeout(resolve,25));};}

