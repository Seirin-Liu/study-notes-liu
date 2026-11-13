const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Schema=require('../dist/data-schema.js');
const source=fs.readFileSync(require.resolve('../dist/app.js'),'utf8');
function setup(){
 let value='',html='',listener;
 const topic={get value(){return value},set value(v){value=v},get innerHTML(){return html},set innerHTML(v){html=v;value=''}};
 const fields={'f-topic':topic,'f-subject':{value:'biology'},'chemistry-panel':{},'question-form':{addEventListener(type,fn){listener=fn}}};
 const context={$:id=>fields[id],subject:id=>({id,topics:Schema.topics[id]}),esc:s=>s,checkChemistry(){},localStorage:{setItem(){}},DRAFT:'draft',draft:()=>({topic:topic.value}),editingId:null,schedulePreview(){}};
 vm.createContext(context);
 vm.runInContext(source.match(/  function updateEditorTopics\(\).*\n/)[0],context);
 vm.runInContext(source.match(/  \$\('question-form'\)\.addEventListener\('input'.*\n/)[0],context);
 return {fields,context,input:id=>listener({target:{id}})};
}
test('selecting a topic and editing prose preserves the category used for saving',()=>{
 const {fields,input,context}=setup();context.updateEditorTopics();
 fields['f-topic'].value=Schema.topics.biology[1];
 input('f-topic');input('f-question');input('f-explanation');
 assert.equal(fields['f-topic'].value,Schema.topics.biology[1]);
 assert.equal(context.draft().topic,Schema.topics.biology[1]);
 context.updateEditorTopics();assert.equal(fields['f-topic'].value,Schema.topics.biology[1]);
});
test('switching subject clears an incompatible category and shows the new choices',()=>{
 const {fields,input}=setup();fields['f-topic'].value=Schema.topics.biology[0];fields['f-subject'].value='chemistry';input('f-subject');
 assert.equal(fields['f-topic'].value,'');assert.ok(fields['f-topic'].innerHTML.includes(Schema.topics.chemistry[0]));assert.equal(fields['chemistry-panel'].hidden,false);
});
