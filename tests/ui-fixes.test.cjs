const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const css=()=>fs.readFileSync(path.join(root,'dist/readability.css'),'utf8');
const renderSrc=()=>fs.readFileSync(path.join(root,'src/app/20-render.js'),'utf8');
const selectionSrc=()=>fs.readFileSync(path.join(root,'src/app/40-selection.js'),'utf8');

test('page heading never wraps mid-word into a vertical column',()=>{
 const text=css();
 assert.match(text,/\.page-heading h1[^{]*\{[^}]*white-space:nowrap/,'标题需要 nowrap，否则中文会逐字换行成竖排');
 assert.match(text,/\.page-heading>div:first-child\{[^}]*min-width:0/,'标题容器需要 min-width:0 才能正确收缩');
});

test('empty state tells apart "no questions" from "no filter matches"',()=>{
 const src=renderSrc();
 assert.match(src,/function emptyStateHTML\(\)/);
 assert.match(src,/hasActiveFilter\(\)/);
 // A subject with zero questions must offer a create action, not filter advice.
 assert.match(src,/还没有错题/);
 assert.match(src,/data-action="add"/);
 // A filtered-out list must offer a reset action.
 assert.match(src,/没有符合筛选条件的题目/);
 assert.match(src,/data-action="reset-filter"/);
});

test('empty state buttons reuse existing handlers',()=>{
 const src=selectionSrc();
 assert.match(src,/dataset\.action==='reset-filter'\)resetFilters\(\)/,'空状态的重置按钮必须接上筛选重置逻辑');
 assert.match(src,/dataset\.action==='add'\)openEditor\(\)/,'空状态的录入按钮必须打开编辑器');
 assert.match(src,/function resetFilters\(\)/,'重置逻辑需抽成函数供两处复用');
});

test('auxiliary text meets the 4.5:1 contrast target',()=>{
 const text=css();
 // #a6ada3 measured ~2.1:1 on the card background; these must not come back.
 assert.ok(!/\.card-bottom small\{color:#a6ada3/.test(text),'上传时间不能再用低对比度灰');
 assert.match(text,/\.card-bottom small\{color:#5b6472/);
 assert.match(text,/input::placeholder,textarea::placeholder\{color:#8b95a1/);
 assert.match(text,/\.formula-tools small\{color:#6b7280/);
});

test('editor save bar stays visible while scrolling and docks at the end',()=>{
 const cssText=css();
 const editorSrc=fs.readFileSync(path.join(root,'src/app/50-editor.js'),'utf8');
 assert.match(cssText,/\.form-footer\.editor-sticky\{[^}]*position:sticky/,'保存栏应吸底');
 assert.match(cssText,/\.form-footer\.editor-sticky\{[^}]*bottom:0/);
 assert.match(editorSrc,/function setupStickyFooter\(\)/);
 assert.match(editorSrc,/document\.documentElement\.scrollHeight/,'需要判断是否滚到底部');
 assert.match(editorSrc,/is-docked/,'到底时应落回卡片');
 // Docking must be a one-way latch: a tight threshold re-triggers during overscroll
 // and makes the bar jitter when the user bounces back to the top.
 assert.match(editorSrc,/let docked=false/,'吸底应使用一次性锁定');
 assert.match(editorSrc,/if\(docked\)\{footer\.classList\.add\('is-docked'\);return;\}/,'已到底后不应再撤下吸底');
 // Must clean up when leaving the editor so the list page is unaffected.
 assert.match(editorSrc,/stickyCleanup\(\)/);
});

test('editor page hides the duplicated page heading',()=>{
 const text=css();
 assert.match(text,/\.editing-mode \.page-heading\{display:none\}/,'编辑页应隐藏页面级标题，卡片内已有「编辑题目」');
 // The list page must keep its heading and the create button.
 assert.ok(!/^\.page-heading\{display:none\}/m.test(text.replace(/\.editing-mode \.page-heading\{display:none\}/,'')),'不应全局隐藏页头');
});
