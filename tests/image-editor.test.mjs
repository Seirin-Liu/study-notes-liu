import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import vm from 'node:vm';import {createApp} from '../server.mjs';import ImageReferences from '../dist/image-references.js';
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
async function editorFixture(){
 const ids=['image-upload','editor-image-list','image-message','save-question-btn','f-question','f-answer','f-explanation','f-notes','f-equation'];
 const fields=Object.fromEntries(ids.map(id=>[id,{value:'',innerHTML:''}]));let changed=0,sequence=0;
 const context={window:{},document:{getElementById:id=>fields[id]},ImageReferences,Formula:{escape:s=>s},
  crypto:{randomUUID:()=>String(++sequence),getRandomValues:array=>{array[0]=sequence++;return array;}},
  FileReader:class {readAsDataURL(){this.result='data:image/png;base64,test';this.onload();}},
  Image:class {set src(value){this.onload();}},
  fetch:async()=>({ok:true,json:async()=>({file:'saved-'+(++sequence)+'.png'})})};
 vm.createContext(context);vm.runInContext(await fs.readFile(new URL('../dist/editor-images.js',import.meta.url),'utf8'),context);
 const editor=new context.window.ImageEditor(()=>{changed++;});editor.open('test',[]);
 return {editor,fields,changes:()=>changed};
}

test('uploading adds numbered assets to this question without silently appending them to its text',async()=>{
 const {editor,fields,changes}=await editorFixture();fields['f-question'].value='A. 题目文字';
 await editor.add({name:'装置图.png',size:24,type:'image/png'});
 await editor.add({name:'曲线.jpg',size:24,type:'image/jpeg'});
 assert.equal(fields['f-question'].value,'A. 题目文字');
 assert.equal(editor.label(0),'图片1-装置图');assert.equal(editor.label(1),'图片2-曲线');
 assert.equal(editor.images()[0].placement,'manual');assert.equal(editor.images()[0].preview,undefined);
 assert.match(editor.images({preview:true})[0].preview,/^data:image\/png/);assert.equal(changes(),2);assert.equal(editor.dirty(),true);
 await editor.upload();assert.equal(editor.images()[0].placement,'manual');assert.match(editor.images()[0].file,/^saved-/);
 assert.equal(fields['f-question'].value,'A. 题目文字');
});

test('replacing, saving and removing images preserves per-placement scales and unrelated references',async()=>{
 const {editor,fields}=await editorFixture();editor.open('test',[{file:'old.png',alt:'old',placement:'manual'},{file:'keep.png',alt:'keep'}]);
 fields['f-question'].value='前[[image:old.png|35%]]后[[image:keep.png]]';
 fields['f-answer'].value='[[image:old.png|80%]]';fields['f-explanation'].value='[[image:old.png]]';
 await editor.add({name:'替换图.png',size:24,type:'image/png'},0);const pending=editor.images()[0].file;
 assert.equal(fields['f-question'].value,`前[[image:${pending}|35%]]后[[image:keep.png]]`);
 assert.equal(fields['f-answer'].value,`[[image:${pending}|80%]]`);assert.equal(editor.images()[0].placement,'manual');
 await editor.upload();const saved=editor.images()[0].file;assert.match(saved,/^saved-/);
 assert.equal(fields['f-answer'].value,`[[image:${saved}|80%]]`);assert.equal(fields['f-explanation'].value,`[[image:${saved}]]`);
 editor.remove(0);assert.equal(fields['f-question'].value,'前后[[image:keep.png]]');assert.equal(fields['f-answer'].value,'');assert.equal(fields['f-explanation'].value,'');
 assert.equal(editor.images().length,1);assert.equal(editor.label(0),'图片1-keep');
});

test('invalid uploads do not alter images or existing question text',async()=>{
 const {editor,fields}=await editorFixture();fields['f-question'].value='原题';
 await assert.rejects(()=>editor.add({name:'large.png',size:10*1024*1024+1,type:'image/png'}),/10 MB/);
 await assert.rejects(()=>editor.add({name:'document.txt',size:24,type:'text/plain'}),/PNG/);
 assert.equal(editor.images().length,0);assert.equal(fields['f-question'].value,'原题');
 editor.items=Array.from({length:20},(_,index)=>({file:`image-${index}.png`,alt:'图'}));
 await assert.rejects(()=>editor.add({name:'extra.png',size:24,type:'image/png'}),/20张/);
 assert.equal(editor.images().length,20);
});
