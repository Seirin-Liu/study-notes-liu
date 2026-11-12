import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {LocalStore} from '../lib/store.mjs';
const directory=process.env.ZHIXU_DATA_DIR||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../data');
try{const bank=await new LocalStore(directory).read();if(bank.formulaIssues.length){for(const e of bank.formulaIssues)console.error(e.id+' / '+e.field+'：'+e.message);process.exitCode=1;}else console.log(`已校验 ${bank.questions.length} 道题，结构与所有公式语法通过。`);}catch(e){console.error(e.message);process.exitCode=1;}
