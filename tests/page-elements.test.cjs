const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'dist/app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const htmlIds=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
const optional=new Set(['preview-btn','pdf-preview-dialog','pdf-preview-dialog-body','pdf-preview-close']);
function referencedIds(){
 const ids=new Set([...app.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]));
 const structural=app.match(/const structuralIds=\{\};for\(const name of \[([^\]]+)\]/)?.[1]||'';
 for(const m of structural.matchAll(/'([^']+)'/g))ids.add(m[1]);
 return ids;
}
test('every element app.js addresses exists in index.html so the script cannot abort at startup',()=>{
 const missing=[...referencedIds()].filter(id=>!htmlIds.has(id)&&!optional.has(id));
 assert.deepEqual(missing,[],'app.js 引用了 index.html 中不存在的元素，页面会在初始化阶段抛错并停止渲染：'+missing.join('、'));
});
test('elements missing from index.html are only touched through null-safe lookups',()=>{
 for(const id of optional){
  assert.ok(!app.includes(`$('${id}').`),`${id} 被直接调用，缺失时会中断整段脚本`);
  assert.ok(!app.includes(`$('${id}').onclick`),`${id} 被直接赋值 onclick，缺失时会导致整页无法渲染`);
 }
 assert.match(app,/\$\('([a-z-]+)'\)/,'app.js 仍应正常使用 $ 访问页面元素');
 assert.match(app,/\$\('prev-page'\)\.onclick/,'核心控件应保持直接绑定');
 // 列表渲染可能经由 renderList 等函数完成，只要仍在写该容器即可
 assert.match(app,/\$\('question-list'\)\.(innerHTML|onchange)/,'题目列表应保持正常渲染与交互');
});
test('structuralIds guard covers the key layout elements',()=>{
 for(const id of ['subject-nav','question-list','overview','preview-canvas','print-btn','local-status'])assert.ok(htmlIds.has(id),'index.html 缺少结构元素 '+id);
 assert.match(app,/const structuralIds=\{\};/);
 assert.match(app,/if\(missing\.length\)console\.warn/);
});
