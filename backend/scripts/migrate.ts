import {loadConfig} from '../src/config.js';
import {createPool} from '../src/db.js';
import {migrate} from './migrations.js';
const pool=createPool(loadConfig());
try{await migrate(pool);console.log('Additive backend migrations applied.');}finally{await pool.end();}
