const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');

// Minimal KaTeX stand-in: the renderer only needs renderToString to exist.
function loadFormula(){
 const context={console};
 vm.createContext(context);
 // The UMD wrapper picks globalThis when no window exists, so provide katex on the sandbox global.
 vm.runInContext('katex={renderToString:function(tex){return "<span class=\\"katex-stub\\">"+tex+"</span>"}}',context);
 vm.runInContext(fs.readFileSync(path.join(root,'dist/math-format.js'),'utf8'),context);
 return context.Formula;
}

test('bold markers become <strong> while plain text stays plain',()=>{
 const F=loadFormula();
 assert.equal(F.render('这是**重点**结论'),'这是<strong>重点</strong>结论');
 assert.equal(F.render('**整段加粗**'),'<strong>整段加粗</strong>');
 assert.equal(F.render('没有标记'),'没有标记');
});

test('underline markers become <u>',()=>{
 const F=loadFormula();
 assert.equal(F.render('__下划线__内容'),'<u>下划线</u>内容');
 assert.equal(F.render('答案：__3 mol__。'),'答案：<u>3 mol</u>。');
});

test('bold and underline nest in either order',()=>{
 const F=loadFormula();
 assert.equal(F.render('**__元素__**'),'<strong><u>元素</u></strong>');
 assert.equal(F.render('__**元素**__'),'<u><strong>元素</strong></u>');
 assert.equal(F.render('前**粗**与__线__后'),'前<strong>粗</strong>与<u>线</u>后');
});

test('formulas are untouched by emphasis conversion',()=>{
 const F=loadFormula();
 const out=F.render('由 \\(a_1=2\\) 可知 **结论**');
 assert.ok(out.includes('kaTeX-stub')||out.includes('katex-stub'),'formula still rendered by KaTeX');
 assert.ok(out.includes('<strong>结论</strong>'));
 assert.ok(!out.includes('**'),'no leftover bold markers');
});

test('emphasis cannot be used to inject HTML',()=>{
 const F=loadFormula();
 const out=F.render('<img src=x onerror=alert(1)> **粗**');
 assert.ok(!out.includes('<img'),'raw HTML is still escaped');
 assert.ok(out.includes('&lt;img'));
 assert.ok(out.includes('<strong>粗</strong>'));
});

test('unmatched markers and underscore math are left alone',()=>{
 const F=loadFormula();
 assert.equal(F.render('只有 ** 一个'),'只有 ** 一个');
 assert.equal(F.render('答案 a_1 与 b_2'),'答案 a_1 与 b_2');
 assert.equal(F.render('__ 空格开头不匹配'),'__ 空格开头不匹配');
});

test('editor exposes B and U buttons wired to the marker pairs',()=>{
 const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
 const app=fs.readFileSync(path.join(root,'dist/app.js'),'utf8');
 assert.match(html,/data-wrap="bold"/);
 assert.match(html,/data-wrap="underline"/);
 assert.match(app,/bold:\['\*\*','\*\*'\]/);
 assert.match(app,/underline:\['__','__'\]/);
});

test('B and U read the contenteditable layer, not the hidden textarea',()=>{
 const app=fs.readFileSync(path.join(root,'dist/app.js'),'utf8');
 const images=fs.readFileSync(path.join(root,'dist/editor-images.js'),'utf8');
 // The image editor replaces f-* textareas with #rich-* contenteditable divs.
 assert.match(images,/editor\.id = 'rich-' \+ field/);
 assert.match(images,/input\.hidden = true/);
 // So the formatting helper must resolve the visible rich layer first.
 assert.match(app,/function richEditorFor/);
 assert.match(app,/getElementById\('rich-'\+name\)/);
 assert.match(app,/function richRangeIn/);
 const start=app.indexOf("function applyMark");
 const stop=app.indexOf("for(const button of document.querySelectorAll",start);
 const apply=app.slice(start,stop);
 assert.match(apply,/richEditorFor\(field\)/,'applyMark must consult the rich editor');
 assert.match(apply,/richRangeIn\(editor\)/,'applyMark must read the live selection');
 assert.ok(apply.indexOf('richRangeIn')<apply.indexOf('selectionStart'),'rich selection is checked before the textarea fallback');
});

test('removing formatting looks for markers outside the selection',()=>{
 const app=fs.readFileSync(path.join(root,'dist/app.js'),'utf8');
 const fn=app.slice(app.indexOf('function unwrapRich'),app.indexOf('function markRich'));
 assert.match(fn,/slice\(s-open\.length,s\)/,'markers before the selection must be found');
 assert.match(fn,/slice\(e,e\+close\.length\)/,'markers after the selection must be found');
});

test('B and U are pure toggles with no extra cancel buttons',()=>{
 const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
 const app=fs.readFileSync(path.join(root,'dist/app.js'),'utf8');
 // Clicking a marked word removes the mark, so a separate "取消B/取消U" pair is redundant.
 assert.ok(!html.includes('remove-bold'),'不应再有取消加粗按钮');
 assert.ok(!html.includes('remove-underline'),'不应再有取消下划线按钮');
 assert.ok(!app.includes("applyMark('bold','remove')"),'不应保留 remove 模式绑定');
 assert.ok(!html.includes('再点一次取消'),'工具栏提示文字已移除，不应再出现');
 // The buttons carry their own titles, so the helper text is redundant.
 assert.match(html,/data-wrap="bold" title="加粗选中文字/);
});

test('saved colors preserve formatted text, complete formulas and nested colors',()=>{
 const F=loadFormula();
 assert.equal(F.render('[red]**重点**[blue]蓝色[/blue][/red]'),
   '<span class="text-color-red"><strong>重点</strong><span class="text-color-blue">蓝色</span></span>');
 assert.match(F.render('[black]由 \\(x=1\\)[/black]'),/text-color-black.*katex-stub/);
 assert.equal(F.render('[red]<script>[/red]'),'<span class="text-color-red">&lt;script&gt;</span>');
 assert.equal(F.render('[green]文字[/green] [blue]'), '[green]文字[/green] [blue]');
});

test('the explanation toolbar targets the explanation and includes all formatting tools',()=>{
 const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
 const toolbar=html.match(/data-tool-field="explanation"[\s\S]*?<\/div>/)[0];
 for(const tool of ['explanation','fraction','power','chem','bold','underline','black','red','blue']){
   assert.ok(toolbar.includes('"'+tool+'"'));
 }
 assert.match(toolbar,/data-insert-image-field="explanation"/);
});
