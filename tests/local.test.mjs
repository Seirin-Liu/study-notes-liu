import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import http from 'node:http';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {LocalStore} from '../lib/store.mjs';
import {Formula,Schema,formulaErrors} from '../lib/formula-engine.mjs';
import {createApp} from '../server.mjs';
const rawFixture=JSON.parse(await fs.readFile(new URL('../data/questions.json',import.meta.url),'utf8'));
const currentTopics={
 '离子反应方程式':'离子反应','实验题':'化学实验','氮与氨':'元素化合物（钠、铝、铁、铜、氯、硫、氮、碳等）',
 '细胞的结构与功能':'细胞的结构与物质运输','动能与机械能':'机械能守恒定律'
};
const fixture={...rawFixture,questions:rawFixture.questions.map(question=>({...question,topic:currentTopics[question.topic]||question.topic}))};
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
 const t=await temporary();try{
  const a=await t.store.read(),question={...fixture.questions[0],notes:'Codex update'},file=t.store.subjectFile(question.subject);
  await fs.writeFile(file,JSON.stringify({version:2,subject:question.subject,questions:[question]}));
  const b=await t.store.read();assert.notEqual(a.revision,b.revision);assert.equal(b.questions[0].notes,'Codex update');
  await fs.writeFile(file,'invalid JSON');await assert.rejects(t.store.read(),{status:422});assert.equal(await fs.readFile(file,'utf8'),'invalid JSON');
 }finally{await t.cleanup();}
});
test('local API serves offline assets, saves files and rejects unsafe or stale requests',async()=>{
 const t=await temporary();const server=createApp({dataDirectory:t.directory});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 try{assert.equal((await fetch(origin+'/api/health')).status,200);assert.equal((await fetch(origin+'/vendor/katex/katex.min.js')).status,200);const bank=await(await fetch(origin+'/api/library')).json();const headers={'Content-Type':'application/json','X-Zhixu-Local':'1','If-Match':bank.revision};assert.equal((await fetch(origin+'/api/library',{method:'PUT',headers:{...headers,Origin:'https://other.invalid'},body:JSON.stringify(bank)})).status,403);assert.equal((await fetch(origin+'/api/library',{method:'PUT',headers:{...headers,'If-Match':'stale'},body:JSON.stringify(bank)})).status,409);bank.questions[0].notes='saved via API';assert.equal((await fetch(origin+'/api/library',{method:'PUT',headers,body:JSON.stringify(bank)})).status,200);assert.equal((await t.store.read()).questions[0].notes,'saved via API');const hostStatus=await new Promise((resolve,reject)=>{const req=http.get(origin+'/api/library',{headers:{Host:'evil.invalid'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);});assert.equal(hostStatus,403);}finally{await new Promise(r=>server.close(r));await t.cleanup();}
});
test('question images survive saves and only safe local assets are served',async()=>{
 const t=await temporary();const q={...fixture.questions[0],images:[{file:'diagram.png',alt:'题图'}]};const asset=path.join(t.directory,'assets',q.id,'diagram.png');await fs.mkdir(path.dirname(asset),{recursive:true});await fs.writeFile(asset,Buffer.from('89504e470d0a1a0a','hex'));await fs.writeFile(t.store.file,JSON.stringify({...fixture,questions:[q]}));const server=createApp({dataDirectory:t.directory});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 try{const before=await t.store.read();assert.deepEqual(before.questions[0].images,q.images);assert.equal((await fetch(origin+'/assets/'+q.id+'/diagram.png')).status,200);assert.equal((await fetch(origin+'/assets/'+q.id+'/diagram.png')).headers.get('content-type'),'image/png');assert.notEqual((await fetch(origin+'/assets/'+q.id+'/../diagram.png')).status,200);assert(Schema.errors({...q,images:[{file:'../escape.png',alt:'bad'}]}).length>0);await fs.rm(asset);await assert.rejects(t.store.read(),{status:422});}finally{await new Promise(r=>server.close(r));await t.cleanup();}
});

test('legacy questions default to question, and a note keeps its kind when saved',async()=>{
 const t=await temporary();
 try{
  const before=await t.store.read();
  assert(before.questions.every(question=>question.kind==='question'));
  const [first,...rest]=before.questions;
  const note={...first,kind:'note'};
  const saved=await t.store.save({...before,questions:[note,...rest]},before.revision);
  const stored=(await t.store.read()).questions.find(question=>question.id===first.id);
  assert.equal(stored.kind,'note');
  assert.equal(stored.explanation,first.explanation);
  await assert.rejects(t.store.save({...saved,questions:[{...note,kind:'other'},...rest]},saved.revision),{status:422});
 }finally{await t.cleanup();}
});

test('partial saves preserve revisions, backups and unrelated files',async()=>{
 const t=await temporary();
 const server=createApp({store:t.store,dataDirectory:t.directory});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/api/library';
 const patch=(revision,body)=>fetch(url,{
  method:'PATCH',headers:{'Content-Type':'application/json','X-Zhixu-Local':'1','If-Match':revision},
  body:JSON.stringify(body)
 });
 const inode=async file=>(await fs.stat(file)).ino;
 try{
  const sync=token=>fetch(url+'?sync='+encodeURIComponent(token)).then(response=>response.json());
  await t.store.ensureSplit();
  const before=await sync('');
  assert(before.syncToken);
  const original=before.questions.find(q=>q.subject==='chemistry');
  const chemistryFile=t.store.subjectFile('chemistry');
  const biologyFile=t.store.subjectFile('biology');
  const biologyInode=await inode(biologyFile);
  const settingsInode=await inode(t.store.settingsFile);

  const edited=await patch(before.revision,{question:{id:original.id,changes:{explanation:'只修改解析'}}});
  assert.equal(edited.status,200);
  const edit=await edited.json();
  assert.deepEqual(Object.keys(edit).sort(),['formulaIssues','question','revision','syncToken']);
  assert(edit.syncToken);
  assert.notEqual(edit.syncToken,before.syncToken);
  assert.deepEqual(await sync(edit.syncToken),{unchanged:true});
  const otherWindow=await sync(before.syncToken);
  assert.equal(otherWindow.revision,edit.revision);
  assert.equal(otherWindow.questions.find(q=>q.id===original.id).explanation,'只修改解析');
  assert.equal(edit.question.explanation,'只修改解析');
  assert.equal(edit.question.createdAt,original.createdAt);
  assert.equal(edit.question.answer,original.answer);
  assert.equal(edit.question.topic,original.topic);
  assert.equal(await inode(biologyFile),biologyInode);
  assert.equal(await inode(t.store.settingsFile),settingsInode);
  const history=path.join(t.directory,'history');
  const [snapshot]=await fs.readdir(history);
  assert.equal(JSON.parse(await fs.readFile(path.join(history,snapshot),'utf8')).questions.find(q=>q.id===original.id).explanation,original.explanation);
  const stale=await patch(before.revision,{settings:{paper:'A4'}});
  assert.equal(stale.status,409);
  const invalid=await patch(edit.revision,{question:{id:original.id,changes:{explanation:String.raw`\(\badcommand\)`}}});
  assert.equal(invalid.status,422);
  assert.equal((await t.store.read()).revision,edit.revision);

  const chemistryInode=await inode(chemistryFile);
  const settings=await patch(edit.revision,{settings:{paper:'A4'}});
  assert.equal(settings.status,200);
  const saved=await settings.json();
  assert.deepEqual(Object.keys(saved).sort(),['formulaIssues','revision','settings','syncToken']);
  assert(saved.syncToken);
  assert.deepEqual(await sync(saved.syncToken),{unchanged:true});
  assert.deepEqual(saved.settings,{...before.settings,paper:'A4'});
  assert.equal(await inode(chemistryFile),chemistryInode);
  assert.equal(await inode(biologyFile),biologyInode);
  assert.deepEqual(await fs.readdir(history),[snapshot]);
  const after=await t.store.read();
  assert.equal(after.revision,saved.revision);
  assert.equal(after.questions.find(q=>q.id===original.id).explanation,'只修改解析');

  const biology=JSON.parse(await fs.readFile(biologyFile,'utf8'));
  biology.questions[0].notes='Codex 外部修改';
  await fs.writeFile(biologyFile,JSON.stringify(biology));
  const externallyUpdated=await sync(saved.syncToken);
  assert.notEqual(externallyUpdated.revision,saved.revision);
  assert.equal(externallyUpdated.questions.find(q=>q.id===biology.questions[0].id).notes,'Codex 外部修改');
 }finally{
  await new Promise(resolve=>server.close(resolve));
  await t.cleanup();
 }
});

test('a concurrent file edit does not get a token for a partial save response',async()=>{
 const t=await temporary();
 try{
  await t.store.ensureSplit();
  const before=await t.store.readForSync('');
  const target=before.questions.find(question=>question.subject==='chemistry');
  const biologyFile=t.store.subjectFile('biology');
  const originalConfirm=t.store.confirmSavedSync.bind(t.store);
  t.store.confirmSavedSync=async (...args)=>{
   const biology=JSON.parse(await fs.readFile(biologyFile,'utf8'));
   biology.questions[0].notes='保存后发生的外部修改';
   await fs.writeFile(biologyFile,JSON.stringify(biology));
   return originalConfirm(...args);
  };

  const save=await t.store.saveQuestion({id:target.id,changes:{notes:'网页修改'}},before.revision);
  assert.equal(save.question.notes,'网页修改');
  assert.equal(save.syncToken,null);
  const full=await t.store.readForSync(save.syncToken);
  assert.notEqual(full.revision,save.revision);
  assert(full.questions.some(question=>question.notes==='保存后发生的外部修改'));
 }finally{await t.cleanup();}
});

test('structured answer types validate and survive editing through partial save',async()=>{
 const t=await temporary();
 try{
  const before=await t.store.read();
  const original=before.questions[0];
  assert.equal(original.answerType,'text');
  const options={A:String.raw`\(x^2\)`,B:'选项二',C:'选项三',D:'选项四'};
  const saved=await t.store.saveQuestion({
   id:original.id,changes:{answerType:'single-choice',answer:'A',options}
  },before.revision);
  assert.equal(saved.question.answerType,'single-choice');
  assert.deepEqual(saved.question.options,options);
  assert.equal(saved.question.answer,'A');

  for(const changes of [
   {answer:'AB'},
   {options:{A:'一',B:'二',C:'三'}},
   {options:{...options,D:'  '}},
   {options:{...options,C:String.raw`\(\badcommand\)`}},
   {kind:'note'},
   {answerType:'judgment',answer:'正确'} // Single-choice options must be cleared.
  ]){
   await assert.rejects(t.store.saveQuestion({id:original.id,changes},saved.revision),{status:422});
  }

  const judgment=await t.store.saveQuestion({
   id:original.id,changes:{answerType:'judgment',answer:'错误',options:{}}
  },saved.revision);
  assert.equal(judgment.question.answer,'错误');
  assert.deepEqual(judgment.question.options,{});
  const text=await t.store.saveQuestion({
   id:original.id,changes:{answerType:'text',answer:'分两步求解\n另见解析。'}
  },judgment.revision);
  assert.equal((await t.store.read()).questions[0].answer,text.question.answer);
 }finally{await t.cleanup();}
});

test('English vocabulary markers survive editing and replacement imports',async()=>{
 const t=await temporary();
 try{
  const before=await t.store.read();
  const question={
   id:'english-vocabulary-test',subject:'english',topic:Schema.topics.english[0],
   question:'Read the brochure.',vocabularyProcessed:true
  };
  assert(Schema.errors({...question,vocabularyProcessed:'true'}).length);
  const saved=await t.store.save({...before,questions:[...before.questions,question]},before.revision);
  const edited=await t.store.saveQuestion({
   id:question.id,changes:{explanation:'brochure 表示宣传册'}
  },saved.revision);
  assert.equal(edited.question.vocabularyProcessed,true);

  const {vocabularyProcessed,...replacement}=edited.question;
  const importFile=path.join(t.directory,'english-replacement.json');
  await fs.writeFile(importFile,JSON.stringify({...replacement,notes:'复习词汇'}));
  const script=fileURLToPath(new URL('../scripts/add-question.mjs',import.meta.url));
  execFileSync(process.execPath,[script,importFile,'--replace'],{
   env:{...process.env,ZHIXU_DATA_DIR:t.directory},stdio:'pipe'
  });

  const library=await t.store.read();
  const stored=library.questions.find(q=>q.id===question.id);
  assert.equal(stored.notes,'复习词汇');
  assert.equal(stored.vocabularyProcessed,true);
  assert.equal(library.questions.find(q=>q.id===before.questions[0].id).vocabularyProcessed,undefined);
 }finally{await t.cleanup();}
});
