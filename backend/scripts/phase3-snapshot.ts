import {writeFile,readFile} from 'node:fs/promises';
import {loadConfig} from '../src/config.js';
import {createPool} from '../src/db.js';
import {snapshot} from './snapshot.js';
const pool=createPool(loadConfig());
try {
 const current=await snapshot(pool);
 const path=new URL('../../reports/phase3-academic-preservation.json',import.meta.url);
 if(process.argv.includes('--before'))await writeFile(path,JSON.stringify({before:current},null,2));
 else {const report=JSON.parse(await readFile(path,'utf8'));report.after=current;report.unchanged=JSON.stringify(report.before)===JSON.stringify(current);await writeFile(path,JSON.stringify(report,null,2));if(!report.unchanged)throw new Error('Academic snapshot changed');}
 console.log('Academic snapshot verified.');
}finally{await pool.end();}
