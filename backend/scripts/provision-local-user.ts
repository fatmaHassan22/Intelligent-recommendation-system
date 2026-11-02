// Run explicitly using an administrative ENV_FILE. Never grants academic writes.
import {readFile} from 'node:fs/promises';
import dotenv from 'dotenv';
import {loadConfig} from '../src/config.js';
import {createPool,rows} from '../src/db.js';
import {academicTables} from './snapshot.js';
const admin=loadConfig(),pool=createPool(admin);
const application=dotenv.parse(await readFile(new URL('../.env',import.meta.url)));
const username=application.DB_USER,password=application.DB_PASSWORD;
if(!username||!password||!/^[a-zA-Z][a-zA-Z0-9_]{0,31}$/.test(username)||username==='root')throw new Error('Invalid application account');
try{
 await pool.query(`CREATE USER IF NOT EXISTS '${username}'@'localhost' IDENTIFIED BY ?`,[password]);
 for(const database of [admin.DB_NAME,admin.TEST_DB_NAME]){
  const exists=await rows(pool,'SELECT SCHEMA_NAME FROM information_schema.schemata WHERE SCHEMA_NAME=?',[database]);if(!exists.length)continue;
  for(const table of academicTables)await pool.query(`GRANT SELECT ON \`${database}\`.\`${table}\` TO '${username}'@'localhost'`);
  for(const table of ['users','student_profiles','auth_sessions','student_completed_courses'])await pool.query(`GRANT SELECT,INSERT,UPDATE,DELETE ON \`${database}\`.\`${table}\` TO '${username}'@'localhost'`);
  for(const table of ['push_subscriptions','push_deliveries','student_semester_plans','student_semester_plan_courses','planner_offering_evidence','student_tasks','student_calendar_events','student_pomodoro_settings','student_pomodoro_sessions','student_notifications','student_notification_preferences','student_activity_events','student_avatar_preferences','student_achievements','student_engagement_preferences','student_message_history','achievement_definitions','ticker_items','ai_conversations','ai_chat_requests','ai_messages','ai_usage_records','moodle_connections','moodle_courses','moodle_items','moodle_sync_runs']){
   const present=await rows(pool,'SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',[database,table]);
   if(present.length)await pool.query(`GRANT ${['planner_offering_evidence','achievement_definitions'].includes(table)?'SELECT':'SELECT,INSERT,UPDATE,DELETE'} ON \`${database}\`.\`${table}\` TO '${username}'@'localhost'`);
  }
 }
 console.log('Application account provisioned with academic SELECT only.');
}catch{console.error('Application user provisioning failed. Check administrative privileges and existing account configuration locally.');process.exitCode=1;}
finally{await pool.end();}
