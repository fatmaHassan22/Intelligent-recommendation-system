import {loadConfig} from './config.js';
import {createPool,rows} from './db.js';
import {createApp} from './app.js';
import {logger} from './errors.js';
import {startScheduler} from './modules/productivity/scheduler.js';
import {startIntegrationJobs} from './modules/integration-jobs.js';
const config=loadConfig();
const pool=createPool(config);
try{await rows(pool,'SELECT 1 AS ready');await rows(pool,'SELECT id FROM users LIMIT 1');await rows(pool,'SELECT id FROM student_semester_plans LIMIT 1');await rows(pool,'SELECT course_offering_id FROM planner_offering_evidence LIMIT 1');await rows(pool,'SELECT id FROM student_notifications LIMIT 1');await rows(pool,'SELECT institution_base_url,baseline_at FROM moodle_connections LIMIT 1');await rows(pool,'SELECT id FROM push_subscriptions LIMIT 1');await rows(pool,'SELECT id FROM ai_conversations LIMIT 1');}
catch{logger.error({event:'startup_failed',reason:'DATABASE_OR_BACKEND_MIGRATIONS_UNAVAILABLE'});await pool.end();process.exit(1);}
const server=createApp(pool,config).listen(config.PORT,config.HOST,()=>logger.info({event:'server_started',host:config.HOST,port:config.PORT}));
const stopScheduler=config.BACKGROUND_JOBS_ENABLED?startScheduler(pool):async()=>{};
const stopIntegrationJobs=config.BACKGROUND_JOBS_ENABLED?startIntegrationJobs(pool,config):async()=>{};
server.on('error',async()=>{logger.error({event:'startup_failed',reason:'LISTEN_FAILED'});await pool.end();process.exit(1);});
let stopping=false;
function stop(){if(stopping)return;stopping=true;const deadline=setTimeout(()=>process.exit(1),120000);deadline.unref();const jobs=Promise.all([stopScheduler(),stopIntegrationJobs()]);server.close(async()=>{await jobs;await pool.end();clearTimeout(deadline);process.exit(0);});}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
