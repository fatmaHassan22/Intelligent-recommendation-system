import type {Pool} from 'mysql2/promise';
import type {Config} from '../../config.js';
import {rows} from '../../db.js';
import {moodleConfigured,syncMoodle} from './service.js';
import {institutionUrl} from './security.js';
import {sqlDate} from '../productivity/time.js';
import type {MoodleAdapter} from './adapter.js';
export async function runMoodleMonitoring(pool:Pool,c:Config,now=new Date(),adapter?:MoodleAdapter,stopped=()=>false){
 if(!c.MOODLE_SYNC_ENABLED||!moodleConfigured(c))return {attempted:0,failed:0};
 const users=await rows(pool,"SELECT c.user_id FROM moodle_connections c JOIN users u ON u.id=c.user_id WHERE c.enabled=1 AND c.monitoring_opt_in=1 AND c.token_cipher IS NOT NULL AND (c.next_sync_at IS NULL OR c.next_sync_at<=?) AND c.institution_base_url=? AND u.is_active=1 AND u.role='STUDENT' ORDER BY c.next_sync_at LIMIT 5",[sqlDate(now),institutionUrl(c.MOODLE_BASE_URL)]);
 let attempted=0,failed=0;for(const user of users){if(stopped())break;attempted++;try{await syncMoodle(pool,c,String(user.user_id),now,adapter,'SCHEDULED');}catch{failed++;}}return {attempted,failed};
}
