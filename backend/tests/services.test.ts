import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluatePrerequisites as evaluate} from '../src/modules/prerequisites/service.js';
import {creditSummary} from '../src/modules/progress/service.js';
import {loadConfig} from '../src/config.js';
test('AND clauses require every clause',()=>{
 const g=[{group_number:1,operator:'OR',courses:['B']},{group_number:2,operator:'OR',courses:['C']}];
 assert.equal(evaluate('SPECIFIED',g,['B']).satisfied,false);assert.equal(evaluate('SPECIFIED',g,['B','C']).satisfied,true);
 assert.deepEqual(evaluate('SPECIFIED',g,['B']).missing_prerequisite_groups[0].alternatives,['C']);
});
test('OR alternatives require one alternative inside a clause',()=>{
 const result=evaluate('SPECIFIED',[{group_number:1,operator:'OR',courses:['B','C']}],['C']);assert.equal(result.satisfied,true);assert.equal(result.missing_prerequisite_groups.length,0);
});
test('Unknown prerequisites never claim satisfaction',()=>{assert.equal(evaluate('UNVERIFIED',[],[]).satisfied,null);assert.equal(evaluate('NONE',[],[]).satisfied,true);assert.equal(evaluate('SPECIFIED',[],[]).satisfied,null);});
test('Empty or contradictory prerequisite groups are unverified',()=>{assert.equal(evaluate('SPECIFIED',[{group_number:1,operator:'OR',courses:[]}],[]).is_unverified,true);assert.equal(evaluate('NONE',[{group_number:1,operator:'OR',courses:['B']}],[]).is_unverified,true);});
test('Unknown hours are not zero',()=>{assert.equal(creditSummary([{credit_hours:null}]).known_credit_hours,null);assert.equal(creditSummary([]).known_credit_hours,0);assert.deepEqual(creditSummary([{credit_hours:3},{credit_hours:null}]),{known_credit_hours:3,unknown_credit_course_count:1,is_complete:false});});
test('Production configuration rejects insecure cookies',()=>{assert.throws(()=>loadConfig({NODE_ENV:'production',DB_USER:'test',DB_PASSWORD:'test',CSRF_SECRET:'x'.repeat(32),COOKIE_SECURE:'false'}));});
