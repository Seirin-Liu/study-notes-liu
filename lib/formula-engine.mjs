import vm from 'node:vm';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const context=vm.createContext({console});
for(const name of ['katex.min.js','mhchem.min.js'])vm.runInContext(fs.readFileSync(new URL('../dist/vendor/katex/'+name,import.meta.url),'utf8'),context,{filename:name,timeout:5000});
export const Formula=require('../dist/math-format.js')(context.katex);
export const Schema=require('../dist/data-schema.js');
export function formulaErrors(q){const list=[];for(const k of ['question','answer','explanation','notes','equation'])for(const error of Formula.check(q[k]||'',{equation:k==='equation'}))list.push({id:q.id,field:k,message:error});return list;}
