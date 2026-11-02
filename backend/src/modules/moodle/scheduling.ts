export const moodleCategories=['ASSIGNMENT','QUIZ','ANNOUNCEMENT','CALENDAR','MATERIAL'] as const;
export function nextMoodleAttempt(now:Date,failures:number,interval=360){return new Date(now.getTime()+(failures>=4?interval:Math.min(interval,15*2**Math.max(0,failures-1)))*60000);}
