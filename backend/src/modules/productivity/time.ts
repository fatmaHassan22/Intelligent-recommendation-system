import {ApiError} from '../../errors.js';
export function validTimezone(zone:string){try{new Intl.DateTimeFormat('en',{timeZone:zone}).format();return true;}catch{return false;}}
export const sqlDate=(date:Date)=>date.toISOString().slice(0,23).replace('T',' ');
export const isoDate=(value:string|null)=>value?new Date(value.includes('T')?value:value.replace(' ','T')+'Z').toISOString():null;
export function parts(date:Date,zone:string){const p=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);return Object.fromEntries(p.map(x=>[x.type,x.value]));}
export function dayKey(date:Date,zone:string){const p=parts(date,zone);return `${p.year}-${p.month}-${p.day}`;}
export function addDays(day:string,n:number){return new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);}
export function localInstant(day:string,time:string,zone:string){
 if(!validTimezone(zone))throw new ApiError(400,'INVALID_TIMEZONE');
 const expected=`${day}T${time.length===5?time+':00':time}`;
 const wall=Date.parse(expected+'Z');if(!Number.isFinite(wall))throw new ApiError(400,'INVALID_DATE');
 let guess=wall;
 for(let i=0;i<4;i++){const p=parts(new Date(guess),zone),actual=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);const delta=wall-actual;if(!delta)break;guess+=delta;}
 const p=parts(new Date(guess),zone);if(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`!==expected)throw new ApiError(400,'INVALID_LOCAL_TIME');
 return new Date(guess);
}
export function localDayStart(day:string,zone:string){for(let hour=0;hour<4;hour++){try{return localInstant(day,`${String(hour).padStart(2,'0')}:00`,zone);}catch(e){if(!(e instanceof ApiError)||e.code!=='INVALID_LOCAL_TIME')throw e;}}throw new ApiError(400,'INVALID_LOCAL_TIME');}
export function deadline(day:string|null,time:string|null,zone:string){return day?time?localInstant(day,time.slice(0,5),zone):new Date(localInstant(day,'23:59:59',zone).getTime()+999):null;}
export function dayRange(now:Date,zone:string,offset=0){const day=addDays(dayKey(now,zone),offset);return {from:localDayStart(day,zone),to:localDayStart(addDays(day,1),zone)};}
export function remainingMs(session:{state:string;remaining_ms:number;ends_at:string|null},serverNow:Date){return session.state==='RUNNING'&&session.ends_at?Math.max(0,new Date(isoDate(session.ends_at)!).getTime()-serverNow.getTime()):session.state==='PAUSED'?Number(session.remaining_ms):0;}
