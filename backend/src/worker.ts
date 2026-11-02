import {writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadConfig} from './config.js';
import {createPool,rows} from './db.js';
import {logger} from './errors.js';
import {startScheduler} from './modules/productivity/scheduler.js';
import {startIntegrationJobs} from './modules/integration-jobs.js';
const c=loadConfig(),pool=createPool(c);
try{await rows(pool,'SELECT baseline_at FROM moodle_connections LIMIT 1');await rows(pool,'SELECT id FROM push_deliveries LIMIT 1');}catch{logger.error({event:'worker_startup_failed'});await pool.end();process.exit(1);}
const stopProductivity=startScheduler(pool),stopIntegrations=startIntegrationJobs(pool,c);
const heartbeat=async()=>{try{await rows(pool,'SELECT 1');await writeFile(join(tmpdir(),'worker-heartbeat'),String(Date.now()));}catch{logger.error({event:'worker_database_unavailable'});}};
const timer=setInterval(()=>void heartbeat(),30000);void heartbeat();let stopping=false;
async function stop(){if(stopping)return;stopping=true;clearInterval(timer);const deadline=setTimeout(()=>process.exit(1),120000);deadline.unref();await Promise.all([stopProductivity(),stopIntegrations()]);await pool.end();clearTimeout(deadline);process.exit(0);}
process.on('SIGINT',()=>void stop());process.on('SIGTERM',()=>void stop());
