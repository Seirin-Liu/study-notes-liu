import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {createApp} from '../server.mjs';

const require=createRequire(import.meta.url);
const refs=require('../dist/image-references.js');
const schema=require('../dist/data-schema.js');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
const sample={id:'image-placement',subject:'math',topic:'数列',question:'选项 A [[image:graph.png|50%]] 后文',answer:'答案 [[image:answer.png|30%]]',explanation:'解析 [[image:graph.png|80%]]',notes:'备注',equation:'方程式',images:[{file:'graph.png',alt:'图形',placement:'manual'},{file:'answer.png',alt:'答案图',placement:'manual'},{file:'unused.png',alt:'还未插入',placement:'manual'},{file:'legacy.png',alt:'旧题图'}]};

test('image references preserve prose and legacy tokens, with independent occurrence sizes',()=>{
 const text='开头 \(a_1=1\)\n[[image:figure.png]] 中间 [[image:figure.png|50%]] 末尾';
 const parts=refs.parts(text);
 assert.deepEqual(parts.filter(p=>p.type==='image').map(({file,scale})=>({file,scale})),[{file:'figure.png',scale:null},{file:'figure.png',scale:50}]);
 assert.equal(parts.map(p=>p.type==='text'?p.value:p.raw).join(''),text);
 assert.equal(refs.replace(text,'figure.png','saved.webp'),text.replaceAll('figure.png','saved.webp'));
 assert.equal(refs.replace(text,'figure.png',null),'开头 \(a_1=1\)\n 中间  末尾');
 assert.equal(refs.marker('saved.webp',50),'[[image:saved.webp|50%]]');
 assert.equal(refs.style(50),'width:50%;');
});

test('invalid file paths and sizes never become image HTML or CSS',()=>{
 for(const text of ['[[image:../escape.png]]','[[image:diagram.png|9%]]','[[image:diagram.png|101%]]','[[image:diagram.png|50%;color:red]]'])assert.deepEqual(refs.parts(text),[{type:'text',value:text}]);
 for(const scale of [0,9,101,50.5,'50%;color:red']){assert.equal(refs.style(scale),'');assert.throws(()=>refs.marker('diagram.png',scale));}
 assert.throws(()=>refs.marker('../bad.png'));
});

test('manual uploads remain unplaced while legacy unreferenced pictures retain their fallback',()=>{
 assert.deepEqual(refs.unplaced(sample).map(x=>x.file),['legacy.png']);
 assert.deepEqual(refs.unplaced({...sample,equation:'[[image:legacy.png]]'}),[]);
 assert.deepEqual(refs.unplaced({...sample,question:'',answer:'',explanation:''}).map(x=>x.file),['legacy.png']);
});

test('schema retains manual placement but strips transient preview data',()=>{
 const input={...sample,images:[{file:'graph.png',alt:'原图',placement:'manual',preview:'data:image/png;base64,abc',pending:{}}]};
 assert.deepEqual(schema.errors(input),[]);
 assert.deepEqual(schema.normalize(input).images,[{file:'graph.png',alt:'原图',placement:'manual'}]);
 assert(schema.errors({...input,images:[{file:'graph.png',alt:'原图',placement:'invalid'}]}).length);
 assert.deepEqual(schema.normalize({...input,images:[{file:'graph.png',alt:'原图'}]}).images,[{file:'graph.png',alt:'原图'}]);
});

const source=await fs.readFile(new URL('../dist/print-preview.js',import.meta.url),'utf8');
const context={window:{},NoteSchema:schema,ImageReferences:refs,document:{createElement:()=>({innerHTML:''})},Formula:{escape:s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),render:s=>s||''}};
// Inspect the real print templates without requiring layout APIs in these unit tests.
vm.runInNewContext(source.replace('window.Printer={','window.PrintTemplates={blockHTML,rich,page,renderedImages,imageSource};window.Printer={'),context);
const templates=context.window.PrintTemplates;

test('print templates retain inline placement, scale and pending previews',()=>{
 const preview='data:image/png;base64,'+png.toString('base64');
 const question={...sample,images:sample.images.map(im=>im.file==='graph.png'?{...im,preview}:im)};
 const html=templates.rich(question,'question');
 assert(html.indexOf('选项 A')<html.indexOf('data-image-scale="50"'));
 assert(html.indexOf('data-image-scale="50"')<html.indexOf('后文'));
 assert.match(html,/style="width:50%;"/);
 assert(html.includes(preview));
 assert(html.includes('/assets/image-placement/legacy.png'));
 assert(!html.includes('unused.png'));
 assert(!html.includes('answer.png'));
 assert.match(templates.rich(question,'explanation'),/data-image-scale="80"/);
 assert(!templates.imageSource(sample,{file:'graph.png',preview:'javascript:alert(1)'}).startsWith('javascript:'));
});

test('all eight answer, explanation and notes combinations independently control printed content',()=>{
 for(let mask=0;mask<8;mask++){
  const options={answers:true,answer:!!(mask&1),explanation:!!(mask&2),notes:!!(mask&4)};
  const html=templates.blockHTML(sample,1,options,{math:'数学'});
  assert.equal(html.includes('class="print-answer"'),options.answer);
  assert.equal(html.includes('class="print-explanation"'),options.explanation);
  assert.equal(html.includes('class="print-equation"'),options.explanation);
  assert.equal(html.includes('class="print-notes"'),options.notes);
  assert.equal(html.includes('class="answer-space"'),mask===0);
  const footer=templates.page('练习',1,{...options,columns:2}).innerHTML.split('paper-foot')[1];
  for(const [key,label] of [['answer','答案'],['explanation','解析'],['notes','备注']])assert.equal(footer.includes(label),options[key]);
  assert.equal(templates.renderedImages(sample,options).some(x=>x.file==='answer.png'),options.answer);
 }
 assert(!templates.blockHTML(sample,1,{answers:false},{math:'数学'}).includes('print-answer'));
});

test('manual upload and occurrence scales survive saving and reloading through the local API',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'image-placement-test-'));
 await fs.writeFile(path.join(dir,'questions.json'),JSON.stringify({version:2,questions:[]}));
 const server=createApp({dataDirectory:dir});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 try{
  const upload=await fetch(base+'/api/assets/image-placement',{method:'POST',headers:{'X-Zhixu-Local':'1','Content-Type':'image/png'},body:png});
  assert.equal(upload.status,201);const {file}=await upload.json();
  const bank=await(await fetch(base+'/api/library')).json();
  const question={...sample,question:`A ${refs.marker(file,50)} B ${refs.marker(file,75)}`,answer:'',explanation:'',equation:'',images:[{file,alt:'题图.png',placement:'manual'}]};
  const saved=await fetch(base+'/api/library',{method:'PUT',headers:{'X-Zhixu-Local':'1','Content-Type':'application/json','If-Match':bank.revision},body:JSON.stringify({...bank,questions:[question]})});
  assert.equal(saved.status,200);
  const reloaded=(await(await fetch(base+'/api/library')).json()).questions[0];
  assert.equal(reloaded.question,question.question);
  assert.deepEqual(reloaded.images,question.images);
  assert.deepEqual(refs.parts(reloaded.question).filter(x=>x.type==='image').map(x=>x.scale),[50,75]);
 }finally{await new Promise(resolve=>server.close(resolve));await fs.rm(dir,{recursive:true,force:true});}
});
