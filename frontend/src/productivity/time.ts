export const browserTimezone=()=>Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
export function dateParts(date:Date,timezone:string){return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).map(p=>[p.type,p.value]));}
export function dateKey(date:Date,timezone:string){const p=dateParts(date,timezone);return `${p.year}-${p.month}-${p.day}`;}
export function addDays(day:string,n:number){return new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);}
export function monthShift(day:string,n:number){const d=new Date(day+'T12:00:00Z');return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+n,1,12)).toISOString().slice(0,10);}
export function localToIso(input:string,zone:string){const wall=Date.parse(input.length===16?input+':00Z':input+'Z');if(!Number.isFinite(wall))throw new Error('تاريخ غير صالح');let guess=wall;
 for(let i=0;i<4;i++){const p=dateParts(new Date(guess),zone),delta=wall-Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);if(!delta)break;guess+=delta;}
 const p=dateParts(new Date(guess),zone),normalized=`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;if(normalized!==input.slice(0,16))throw new Error('هذا الوقت المحلي غير موجود بسبب تغيير التوقيت؛ اختر وقتًا آخر.');return new Date(guess).toISOString();
}
export function localDayStart(day:string,zone:string){for(let hour=0;hour<4;hour++){try{return localToIso(`${day}T${String(hour).padStart(2,'0')}:00`,zone);}catch{/* DST may skip local midnight. */}}throw new Error('تعذر تحديد بداية اليوم');}
export function localInput(iso:string,timezone:string){const p=dateParts(new Date(iso),timezone);return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;}
export const dayLabel=(day:string,options:Intl.DateTimeFormatOptions={day:'numeric',month:'long'})=>new Intl.DateTimeFormat('ar',{...options,timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));
export const timestampLabel=(iso:string|null,timezone:string)=>iso?new Intl.DateTimeFormat('ar',{timeZone:timezone,day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(iso)):'دون موعد';
export function timerRemaining(session:{state:string;ends_at:string|null;remaining_ms:number},serverOffset:number,now:number){return session.state==='RUNNING'&&session.ends_at?Math.max(0,Date.parse(session.ends_at)-now-serverOffset):session.state==='PAUSED'?session.remaining_ms:0;}
export function timerLabel(ms:number){const seconds=Math.ceil(Math.max(0,ms)/1000);return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
