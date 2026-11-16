import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import vm from 'node:vm';import {createApp} from '../server.mjs';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
test('upload, save, replace and remove image references without breaking history',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'image-api-test-'));await fs.writeFile(path.join(dir,'questions.json'),JSON.stringify({version:2,questions:[]}));const server=createApp({dataDirectory:dir});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const upload=()=>fetch(base+'/api/assets/test-image',{method:'POST',headers:{'X-Zhixu-Local':'1','Content-Type':'image/png'},body:png});
 const save=bank=>fetch(base+'/api/library',{method:'PUT',headers:{'X-Zhixu-Local':'1','Content-Type':'application/json','If-Match':bank.revision},body:JSON.stringify(bank)});
 try{
  assert.equal((await fetch(base+'/api/assets/test-image',{method:'POST',body:png})).status,403);
  assert.equal((await fetch(base+'/api/assets/test-image',{method:'POST',headers:{'X-Zhixu-Local':'1'},body:'not an image'})).status,422);
  assert.equal((await fetch(base+'/api/assets/test-image',{method:'POST',headers:{'X-Zhixu-Local':'1'},body:Buffer.alloc(10*1024*1024+1)})).status,413);
  const first=await upload();assert.equal(first.status,201);const image=await first.json();
  let bank=await(await fetch(base+'/api/library')).json();bank.questions=[{id:'test-image',subject:'biology',topic:'细胞的分子组成',question:`题目\n[[image:${image.file}]]`,images:[{file:image.file,alt:'题图'}]}];let response=await save(bank);assert.equal(response.status,200);bank=await response.json();
  const second=await(await upload()).json();assert.notEqual(second.file,image.file);bank.questions[0].images=[{file:second.file,alt:'替换图'}];bank.questions[0].question=`题目\n[[image:${second.file}]]`;bank=await(await save(bank)).json();
  bank.questions[0].images=[];bank.questions[0].question='题目';response=await save(bank);assert.equal(response.status,200);
  const disk=JSON.parse(await fs.readFile(path.join(dir,'subjects/biology.json'),'utf8'));assert.deepEqual(disk.questions[0].images,[]);
  assert.equal((await fetch(base+'/assets/test-image/'+image.file)).status,200);assert.equal((await fetch(base+'/assets/test-image/'+second.file)).status,200);assert.ok((await fs.readdir(path.join(dir,'history'))).length>=3);
 }finally{await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true});}
});
test('editor removal clears markers across all fields and upload substitutes the saved filename',async()=>{
 const ids=['image-upload','editor-image-list','image-message','save-question-btn','f-question','f-answer','f-explanation','f-notes','f-equation'];const fields=Object.fromEntries(ids.map(id=>[id,{value:'',innerHTML:''}]));const context={window:{},document:{getElementById:id=>fields[id]},Formula:{escape:s=>s},fetch:async()=>({ok:true,json:async()=>({file:'saved.png'})})};vm.createContext(context);vm.runInContext(await fs.readFile(new URL('../dist/editor-images.js',import.meta.url),'utf8'),context);const editor=new context.window.ImageEditor(()=>{});editor.open('test',[{file:'old.png',alt:'old'}]);fields['f-question'].value='前[[image:old.png]]后';fields['f-explanation'].value='[[image:old.png]]';editor.remove(0);assert.equal(fields['f-question'].value,'前后');assert.equal(fields['f-explanation'].value,'');assert.equal(editor.images().length,0);
 editor.items=[{file:'pending.png',alt:'new',pending:{type:'image/png'}}];fields['f-question'].value='[[image:pending.png]]';await editor.upload();assert.equal(fields['f-question'].value,'[[image:saved.png]]');assert.equal(editor.images()[0].file,'saved.png');
});
