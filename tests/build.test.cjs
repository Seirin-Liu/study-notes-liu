const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

const root=path.join(__dirname,'..');
const srcDir=path.join(root,'src/app');
const distFile=path.join(root,'dist/app.js');

test('src/app modules exist and the builder knows every one',()=>{
 const files=fs.readdirSync(srcDir).filter(f=>f.endsWith('.js')).sort();
 assert.ok(files.length>=8,'预期至少 8 个职责模块，实际 '+files.length);
 const builder=fs.readFileSync(path.join(root,'scripts/build-app.mjs'),'utf8');
 for(const f of files)assert.ok(builder.includes(`'${f}'`),`构建脚本漏了 ${f}`);
});

test('dist/app.js is in sync with src/app (rebuild does not change it)',()=>{
 const before=fs.readFileSync(distFile,'utf8');
 execFileSync(process.execPath,[path.join(root,'scripts/build-app.mjs')],{stdio:'pipe'});
 const after=fs.readFileSync(distFile,'utf8');
 assert.equal(before,after,'dist/app.js 与 src/app 不一致，请先运行 npm run build');
});

test('built bundle keeps the single-IIFE shape the browser expects',()=>{
 const out=fs.readFileSync(distFile,'utf8');
 assert.ok(out.startsWith('/*'),'缺少生成标记注释');
 assert.match(out,/\n\(\(\) => \{\n/,'应以 IIFE 开头');
 assert.match(out,/\n\}\)\(\);\n$/,'应以 IIFE 收尾');
 assert.equal((out.match(/^\(\(\) => \{/gm)||[]).length,1,'只能有一个 IIFE');
 // Every module is separated by a banner comment so the bundle stays navigable.
 assert.ok((out.match(/^  \/\* ===== .+ ===== \*\/$/gm)||[]).length>=8,'缺少分节注释');
});

test('modules carry a short purpose comment',()=>{
 for(const f of fs.readdirSync(srcDir).filter(f=>f.endsWith('.js'))){
  const head=fs.readFileSync(path.join(srcDir,f),'utf8').split('\n').slice(0,3).join('\n');
  assert.match(head,/^\/\//,`${f} 顶部缺少用途说明`);
 }
});
