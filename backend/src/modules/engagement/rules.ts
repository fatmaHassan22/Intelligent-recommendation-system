import {addDays,dayKey} from '../productivity/time.js';
export function calculateStreak(dates:string[],today:string){
 const days=[...new Set(dates)].sort();let longest=0,run=0,last:string|null=null;
 for(const day of days){run=last&&addDays(last,1)===day?run+1:1;longest=Math.max(longest,run);last=day;}
 let current=0,cursor=days.includes(today)?today:addDays(today,-1);
 const set=new Set(days);while(set.has(cursor)){current++;cursor=addDays(cursor,-1);}
 return {current_streak:current,longest_streak:longest,last_activity_date:last,weekly_activity:Array.from({length:7},(_,i)=>{const date=addDays(today,i-6);return {date,active:set.has(date)};})};
}
export const categories=['AI_TECH','LEARNING','SCHOLARSHIPS','UNIVERSITY','DEADLINES','LIGHTHEARTED'] as const;
export const defaultAvatar={style:'STUDENT',color:'#239B91',background:'#E4F3EE',eyes:'ROUND',accessory:'NONE'};
export const utcToday=(now:Date,zone:string)=>dayKey(now,zone);
