import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import {LocalStore} from '../lib/store.mjs';
import {Formula,Schema,formulaErrors} from '../lib/formula-engine.mjs';
import {createApp} from '../server.mjs';
const fixture=JSON.parse(await fs.readFile(new URL('../data/questions.json',import.meta.url),'utf8'));
async function temporary(){const directory=await fs.mkdtemp(path.join(os.tmpdir(),'zhixu-test-'));await fs.writeFile(path.join(directory,'questions.json'),JSON.stringify(fixture));return {directory,store:new LocalStore(directory),cleanup:()=>fs.rm(directory,{recursive:true,force:true})};}
test('bundled engine renders fractions, powers, roots, sums and chemical ions',()=>{
 for(const tex of [String.raw`\(\frac{a_1(1-q^n)}{1-q}\)`,String.raw`\(a_n^2=\sqrt{n}\)`,String.raw`\[\sum_{k=1}^n k=\frac{n(n+1)}2\]`,String.raw`\(\ce{S2O3^2- + 2H+ -> S v + SO2 ^ + H2O}\)`]){assert.deepEqual(Formula.check(tex),[]);assert.match(Formula.render(tex),/class="katex"/);assert.match(Formula.render(tex),/<math/);}
 assert.deepEqual(fixture.questions.flatMap(formulaErrors),[]);
});
test('invalid math and missing delimiter are visible errors, prose is escaped',()=>{
 assert(Formula.check(String.raw`\(\frac{1}{\)`).length>0);
 assert(Formula.check(String.raw`\(x^2`).length>0);
 assert.match(Formula.render(String.raw`\(\unknown{x}\)`),/formula-error/);
 assert.equal(Formula.render('<img src=x onerror=alert(1)>'),'&lt;img src=x onerror=alert(1)&gt;');
 assert(!Formula.render(String.raw`\(\href{javascript:alert(1)}{x}\)`).includes('href="javascript:'));
});
test('schema rejects invalid ids and preserves latex sources',()=>{assert(Schema.errors({...fixture.questions[0],id:'../escape'}).length>0);assert.equal(Schema.normalize(fixture.questions[4]).explanation,fixture.questions[4].explanation);});
test('atomic save keeps history and prevents lost edits',async()=>{
 const t=await temporary();try{const before=await t.store.read();const q={...before.questions[0],notes:'updated'};const payload={...before,questions:[q,...before.questions.slice(1)]};const results=await Promise.allSettled([t.store.save(payload,before.revision),t.store.save(payload,before.revision)]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal(results.find(x=>x.status==='rejected').reason.status,409);assert.equal((await t.store.read()).questions[0].notes,'updated');assert.equal((await fs.readdir(path.join(t.directory,'history'))).length,1);}finally{await t.cleanup();}
});
test('invalid formula never overwrites valid disk data',async()=>{
 const t=await temporary();try{const before=await t.store.read();const q={...before.questions[0],answer:String.raw`\(\badcommand\)`};await assert.rejects(t.store.save({...before,questions:[q,...before.questions.slice(1)]},before.revision),{status:422});assert.equal((await t.store.read()).revision,before.revision);}finally{await t.cleanup();}
});
test('external changes load; invalid JSON is never silently replaced',async()=>{
 const t=await temporary();try{const a=await t.store.read();await fs.writeFile(t.store.file,JSON.stringify({...fixture,questions:[{...fixture.questions[0],notes:'Codex update'}]}));const b=await t.store.read();assert.notEqual(a.revision,b.revision);assert.equal(b.questions[0].notes,'Codex update');await fs.writeFile(t.store.file,'invalid JSON');await assert.rejects(t.store.read(),{status:422});assert.equal(await fs.readFile(t.store.file,'utf8'),'invalid JSON');}finally{await t.cleanup();}
});
test('local API serves offline assets, saves files and rejects unsafe or stale requests',async()=>{
 const t=await temporary();const server=createApp({dataDirectory:t.directory});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 try{assert.equal((await fetch(origin+'/api/health')).status,200);assert.equal((await fetch(origin+'/vendor/katex/katex.min.js')).status,200);const bank=await(await fetch(origin+'/api/library')).json();const headers={'Content-Type':'application/json','X-Zhixu-Local':'1','If-Match':bank.revision};assert.equal((await fetch(origin+'/api/library',{method:'PUT',headers:{...headers,Origin:'https://other.invalid'},body:JSON.stringify(bank)})).status,403);assert.equal((await fetch(origin+'/api/library',{method:'PUT',headers:{...headers,'If-Match':'stale'},body:JSON.stringify(bank)})).status,409);bank.questions[0].notes='saved via API';assert.equal((await fetch(origin+'/api/library',{method:'PUT',headers,body:JSON.stringify(bank)})).status,200);assert.equal((await t.store.read()).questions[0].notes,'saved via API');const hostStatus=await new Promise((resolve,reject)=>{const req=http.get(origin+'/api/library',{headers:{Host:'evil.invalid'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);});assert.equal(hostStatus,403);}finally{await new Promise(r=>server.close(r));await t.cleanup();}
});
test('question images survive saves and only safe local assets are served',async()=>{
 const t=await temporary();const q={...fixture.questions[0],images:[{file:'diagram.png',alt:'题图'}]};const asset=path.join(t.directory,'assets',q.id,'diagram.png');await fs.mkdir(path.dirname(asset),{recursive:true});await fs.writeFile(asset,Buffer.from('89504e470d0a1a0a','hex'));await fs.writeFile(t.store.file,JSON.stringify({...fixture,questions:[q]}));const server=createApp({dataDirectory:t.directory});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 try{const before=await t.store.read();assert.deepEqual(before.questions[0].images,q.images);assert.equal((await fetch(origin+'/assets/'+q.id+'/diagram.png')).status,200);assert.equal((await fetch(origin+'/assets/'+q.id+'/diagram.png')).headers.get('content-type'),'image/png');assert.notEqual((await fetch(origin+'/assets/'+q.id+'/../diagram.png')).status,200);assert(Schema.errors({...q,images:[{file:'../escape.png',alt:'bad'}]}).length>0);await fs.rm(asset);await assert.rejects(t.store.read(),{status:422});}finally{await new Promise(r=>server.close(r));await t.cleanup();}
});
