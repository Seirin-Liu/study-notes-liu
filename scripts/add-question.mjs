import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {LocalStore} from '../lib/store.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
try{
 const args=process.argv.slice(2);const filename=args.find(x=>!x.startsWith('--'));if(!filename)throw Error('用法：node scripts/add-question.mjs 题目.json [--replace]。同 id 更新需显式使用 --replace。');
 const source=JSON.parse(await fs.readFile(path.resolve(filename),'utf8'));const input=Array.isArray(source)?source:Array.isArray(source.questions)?source.questions:[source];
 const store=new LocalStore(process.env.ZHIXU_DATA_DIR||path.join(root,'data'));const before=await store.read();const questions=[...before.questions];const seen=new Set();
 for(const item of input){const q={...item,id:item.id||randomUUID(),updatedAt:new Date().toISOString()};if(seen.has(q.id))throw Error('导入文件含有重复 id：'+q.id);seen.add(q.id);const index=questions.findIndex(x=>x.id===q.id);if(index!==-1){if(!args.includes('--replace'))throw Error('id 已存在：'+q.id+'。更新此题请使用 --replace。');q.createdAt=questions[index].createdAt;questions[index]=q;}else questions.unshift(q);}
 await store.save({questions,settings:before.settings},before.revision);console.log(`已写入 ${input.length} 道题：${store.file}。浏览器将在约 2 秒内自动同步。`);
}catch(e){console.error(e.message);process.exitCode=1;}
