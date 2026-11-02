import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateStreak} from '../src/modules/engagement/rules.js';
import {dayKey} from '../src/modules/productivity/time.js';
import {safeUrl} from '../src/modules/engagement/service.js';
test('Streak deduplicates days, tolerates unfinished today and resets after missed day',()=>{const dates=['2026-10-10','2026-10-11','2026-10-11','2026-10-12'];assert.equal(calculateStreak(dates,'2026-10-12').current_streak,3);assert.equal(calculateStreak(dates,'2026-10-13').current_streak,3);const missed=calculateStreak([...dates,'2026-10-15'],'2026-10-15');assert.equal(missed.current_streak,1);assert.equal(missed.longest_streak,3);assert.equal(missed.weekly_activity.filter(d=>d.active).length,4);assert.equal(calculateStreak(dates,'2026-10-14').current_streak,0);});
test('Daily activity uses IANA boundaries rather than UTC date',()=>{const at=new Date('2026-10-11T22:30:00Z');assert.equal(dayKey(at,'Asia/Hebron'),'2026-10-12');assert.equal(dayKey(at,'America/New_York'),'2026-10-11');});
test('Ticker source URLs reject executable protocols and embedded credentials',()=>{assert.ok(safeUrl('https://example.org/news'));for(const url of ['javascript:alert(1)','data:text/html,hello','https://secret:password@example.org','not a url'])assert.equal(safeUrl(url),false);});
