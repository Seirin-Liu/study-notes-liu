// 编辑面板：打开、保存、草稿、化学核查与打印设置同步。
  const editorImages=new ImageEditor(()=>{refreshEditorQuestionOptions();scheduleEditorDraft();schedulePreview();});
  // 编辑页的学科/专题下拉：与「全部状态」同一套自定义按钮 + 弹出菜单
  function editorSelectParts(id){return {select:$(id),button:$(id+'-menu-button'),label:$(id+'-menu-label'),menu:$(id+'-menu')};}
  function closeEditorSelect(id){const p=editorSelectParts(id);if(!p.menu)return;p.menu.hidden=true;p.button?.setAttribute('aria-expanded','false');}
  function closeAllEditorSelects(){closeEditorSelect('f-subject');closeEditorSelect('f-topic');}
  function syncEditorSelect(id){
    const p=editorSelectParts(id);if(!p.select||!p.menu||!p.button)return;
    const current=p.select.value;
    const placeholder=id==='f-subject'?'选择学科':'选择类别';
    p.label.textContent=p.select.selectedOptions[0]?.textContent||placeholder;
    p.menu.innerHTML=[...p.select.options].filter(o=>o.value).map(o=>`<button type="button" data-value="${esc(o.value)}" role="menuitemradio" class="${o.value===current?'active':''}" aria-checked="${o.value===current}">${esc(o.textContent)}</button>`).join('');
  }
  function openEditorSelect(id){
    const p=editorSelectParts(id);if(!p.menu||!p.button)return;
    const wasOpen=!p.menu.hidden;
    closeAllEditorSelects();
    closeStatusMenu();closeDateMenu();if(typeof closePaperMenu==='function')closePaperMenu();
    if(wasOpen)return;
    syncEditorSelect(id);
    const rect=p.button.getBoundingClientRect();
    p.menu.style.left=Math.max(8,Math.min(rect.left,innerWidth-260))+'px';
    p.menu.style.top=Math.max(8,Math.min(rect.bottom+6,innerHeight-260))+'px';
    p.menu.style.minWidth=Math.round(rect.width)+'px';
    p.menu.hidden=false;
    p.button.setAttribute('aria-expanded','true');
  }
  for(const id of ['f-subject','f-topic']){
    const p=editorSelectParts(id);
    if(!p.button)continue;
    p.button.onclick=e=>{e.preventDefault();openEditorSelect(id);};
    p.menu.onclick=e=>{
      const option=e.target.closest('[data-value]');if(!option)return;
      if(p.select.value!==option.dataset.value){
        p.select.value=option.dataset.value;
        p.select.dispatchEvent(new Event('change',{bubbles:true}));
      }
      closeAllEditorSelects();
    };
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-editor-select]')||e.target.closest('#f-subject-menu')||e.target.closest('#f-topic-menu'))return;
    closeAllEditorSelects();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAllEditorSelects();});

  function updateEditorTopics(selected=$('f-topic').value){const s=subject($('f-subject').value),topic=$('f-topic');topic.innerHTML='<option value="">选择类别</option>'+s.topics.map(t=>`<option value="${esc(t)}">${esc(NoteSchema.topicName(s.id,t))}</option>`).join('');topic.value=NoteSchema.topicId(s.id,selected);syncEditorSelect('f-subject');syncEditorSelect('f-topic');}
  function editorTopic(subjectId,original){
    const topics=NoteSchema.topics[subjectId]||[];
    const selected=$('f-topic').value.trim();
    if(topics.includes(selected))return selected;
    if(original?.subject===subjectId&&topics.includes(original.topic))return original.topic;
    return '';
  }
  const editorTextFields=['question','answer','explanation','notes'];
  const editorChoiceFields=[...NoteSchema.optionFields,'answer-type','judgment-answer','choice-answer'];
  const editorDraftFields=['subject','kind','source','topic',...editorTextFields,...editorChoiceFields];

  function editorAnswerType(){
    return $('f-kind').value==='note'?'text':$('f-answer-type').value;
  }
  function syncEditorAnswerFields(){
    const type=editorAnswerType();
    $('answer-type-field').hidden=$('f-kind').value==='note';
    $('text-answer-field').hidden=type!=='text';
    $('judgment-answer-field').hidden=type!=='judgment';
    $('choice-answer-field').hidden=type!=='single-choice';
    $('choice-option-fields').hidden=type!=='single-choice';
    refreshEditorQuestionOptions();
  }
  function editorOptions(){
    return Object.fromEntries(NoteSchema.optionKeys.map(key=>[key,$('f-option-'+key).value]));
  }
  function refreshEditorQuestionOptions(){
    const optionsBox=$('editor-question-options');
    const answerType=editorAnswerType();
    optionsBox.hidden=answerType!=='single-choice';
    const correctOption=optionsBox.hidden?'':$('f-choice-answer').value;
    for(const row of $('choice-option-fields').querySelectorAll('[data-option-key]')){
      row.classList.toggle('is-correct',row.dataset.optionKey===correctOption);
    }
    const content=$('editor-question-option-content');
    if(optionsBox.hidden){content.replaceChildren();return;}
    content.innerHTML=questionOptionsHTML({
      id:editorImages.questionId,answerType,options:editorOptions(),images:editorImages.images({preview:true})
    },correctOption);
  }
  function loadEditorAnswer(q){
    const type=q?.answerType||'text';
    $('f-answer-type').value=type;
    $('f-answer').value=type==='text'?q?.answer||'':'';
    $('f-judgment-answer').value=type==='judgment'?q.answer:'';
    $('f-choice-answer').value=type==='single-choice'?q.answer:'';
    for(const key of NoteSchema.optionKeys)$('f-option-'+key).value=q?.options?.[key]||'';
  }
  function draft({preview=true}={}){
    const original=state.questions.find(q=>q.id===editingId);
    const subjectId=$('f-subject').value;
    const answerType=editorAnswerType();
    const answerField={text:'answer',judgment:'judgment-answer','single-choice':'choice-answer'}[answerType];
    const options=answerType==='single-choice'
      ?editorOptions():{};
    return {
      id:editingId||editorImages.questionId||'draft',
      subject:subjectId,kind:$('f-kind').value,source:$('f-source').value.trim(),
      topic:editorTopic(subjectId,original),question:$('f-question').value,
      answerType,answer:$('f-'+answerField).value,options,
      explanation:$('f-explanation').value,notes:$('f-notes').value,
      equation:original?.equation||'',equationPlain:original?.equationPlain||'',
      images:editorImages.images({preview}),mastered:$('f-mastered').checked
    };
  }
  let editorDraftKey, editorBaseline, editorDraftTimer, editorDraftRevision;

  function editorDraftValues(){
    const values=Object.fromEntries(editorDraftFields.map(field=>[field,$('f-'+field).value]));
    return {...values,mastered:$('f-mastered').checked,images:editorImages.images()};
  }
  function editorHasChanges(values=editorDraftValues()){
    return JSON.stringify(values)!==JSON.stringify(editorBaseline);
  }
  function clearEditorDraft(){
    clearTimeout(editorDraftTimer);
    try{localStorage.removeItem(editorDraftKey);}catch{}
  }
  function persistEditorDraft(){
    clearTimeout(editorDraftTimer);
    if(!editing||!editorDraftKey)return;
    const values=editorDraftValues();
    if(!editorHasChanges(values)){clearEditorDraft();return;}
    const pending=editorImages.images({preview:true}).filter(image=>image.preview);
    for(const image of pending){
      values.images=values.images.filter(item=>item.file!==image.file);
      for(const field of [...editorTextFields,...NoteSchema.optionFields])values[field]=ImageReferences.replace(values[field],image.file,null);
    }
    try{
      localStorage.setItem(editorDraftKey,JSON.stringify({
        values,baseline:editorBaseline,revision:editorDraftRevision,questionId:editorImages.questionId,
        pendingImages:pending.length>0
      }));
    }catch{}
  }
  function scheduleEditorDraft(){
    clearTimeout(editorDraftTimer);
    if(editing)editorDraftTimer=setTimeout(persistEditorDraft,200);
  }
  window.addEventListener('pagehide',persistEditorDraft);

  function restoreEditorDraft(editorPath,question){
    editorDraftKey='zhixu:editor-draft:v1:'+editorPath;
    editorBaseline=editorDraftValues();
    editorDraftRevision=revision;
    let stored;
    try{stored=JSON.parse(localStorage.getItem(editorDraftKey));}catch{return '';}
    if(!stored?.values||!stored.baseline)return '';

    // Earlier drafts used the text-answer editor without structured fields.
    function withChoiceFields(snapshot){
      return Object.fromEntries(editorDraftFields.map(field=>[field,snapshot[field]??(field==='answer-type'?'text':'')]));
    }
    const values={...withChoiceFields(stored.values),mastered:!!stored.values.mastered,images:stored.values.images||[]};
    const baseline={...withChoiceFields(stored.baseline),mastered:!!stored.baseline.mastered,images:stored.baseline.images||[]};
    if(!NoteSchema.subjects.includes(values.subject))return '';
    const changedOnDisk=!!question&&JSON.stringify(editorBaseline)!==JSON.stringify(baseline);
    if(changedOnDisk){
      editorBaseline=baseline;
      editingRevision=editorDraftRevision=stored.revision;
    }
    editorImages.open(question?.id||stored.questionId||editorImages.questionId,values.images||[]);
    for(const field of editorDraftFields){
      if(field!=='topic')$('f-'+field).value=values[field]??'';
    }
    $('f-mastered').checked=!!values.mastered;
    updateEditorTopics(values.topic);
    editorImages.syncFields();
    if(changedOnDisk)return '已恢复草稿。原题有新版本，请先复制草稿内容，再重新打开核对。';
    if(stored.pendingImages)return '已恢复文字草稿。上次尚未保存的图片需要重新添加。';
    return '已恢复本地草稿。';
  }
  function syncEditorMasteryLabel(){const input=$('f-mastered');if(!input)return;const label=input.closest('.mastery-switch')?.querySelector('.mastery-label');if(label)label.textContent=input.checked?'已掌握':'待复习';input.setAttribute('aria-label',input.checked?'这道题已掌握，点击切换为待复习':'这道题待复习，点击切换为已掌握');}
  function openEditor(q=null,restored=false,push=true){if(!ready){toast('请先启动本地服务并等待题库连接。');return;}if(typeof pauseScrollTracking==='function')pauseScrollTracking();const editorPath='/'+(q?.subject||selectedSubject||'chemistry')+'/edit/'+(q?.id||'new');if(push&&location.pathname!==editorPath)history.pushState({editorFrom:location.pathname},'',editorPath);document.title=(q?'编辑题目':'录入新题')+' · 错题本';editing=true;document.body.classList.add('editing-mode');editingRevision=revision;editingId=q?.id||null;editorImages.open(editingId||id(),q?.images||[]);$('collection-panel').hidden=true;$('editor-panel').hidden=false;$('editor-heading').textContent=editingId?'编辑题目':'录入新题';setupStickyFooter();$('form-message').textContent='';$('f-subject').value=q?.subject||selectedSubject||'chemistry';$('f-source').value=q?NoteSchema.questionSource(q):'';$('f-kind').value=q?.kind||(q?'question':kindFilter||'question');['question','explanation','notes'].forEach(k=>$('f-'+k).value=q?.[k]||'');loadEditorAnswer(q);editorImages.syncFields();$('f-mastered').checked=!!q?.mastered;updateEditorTopics(q?.topic||'');const message=restoreEditorDraft(editorPath,q);if(message)toast(message);syncEditorAnswerFields();syncEditorMasteryLabel();checkEditorFormulas();updatePreview();if(!restored)$('f-topic-menu-button').focus();}
  // Keep the save bar in view while editing, and let it settle into the card
  // once the page is scrolled to the end.
  let stickyCleanup=null;
  function setupStickyFooter(){
    if(stickyCleanup){stickyCleanup();stickyCleanup=null;}
    const footer=document.querySelector('#question-form .form-footer');
    if(!footer)return;
    footer.classList.add('editor-sticky');
    // Only dock once the user has truly reached the end, and never re-dock after
    // leaving it: a tight pixel threshold flips during overscroll and makes the
    // bar flicker.
    let docked=false;
    const update=()=>{
      if(docked){footer.classList.add('is-docked');return;}
      const atEnd=window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4;
      if(atEnd){docked=true;footer.classList.add('is-docked');}
    };
    const onScroll=()=>update();
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onScroll);
    stickyCleanup=()=>{window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);footer.classList.remove('editor-sticky');};
    requestAnimationFrame(update);
  }
  function closeEditor(navigate=true){clearTimeout(editorDraftTimer);clearTimeout(editorFormulaTimer);if(navigate&&/\/edit\//.test(location.pathname)){if(history.state?.editorFrom)history.back();else history.replaceState(null,'','/'+(selectedSubject||'overview'));}document.title=(selectedSubject?subject(selectedSubject).name+'错题':'错题本')+' · 比格多栋';editing=false;document.body.classList.remove('editing-mode');editingId=null;if(stickyCleanup){stickyCleanup();stickyCleanup=null;}$('collection-panel').hidden=false;$('editor-panel').hidden=true;renderAll();if(typeof resumeScrollTracking==='function')resumeScrollTracking();}
  function discardEditor(){clearEditorDraft();closeEditor();}
  function cancelEditor(){
    if(editorHasChanges()){
      showConfirm('放弃本次编辑？','未保存的内容将被丢弃。','放弃编辑',discardEditor);
    }else discardEditor();
  }
  $('add-btn').onclick=()=>{if(editing){toast('正在编辑中，保存后可继续录入。');return;}openEditor();};$('back-btn').onclick=cancelEditor;$('cancel-btn').onclick=cancelEditor;
  const topicRequiredMessage='请选择该学科规定的题目类别。';
  function requireEditorTopic(){
    $('form-message').textContent=topicRequiredMessage;
    $('f-topic-menu-button').focus();
  }
  $('f-topic').addEventListener('change',()=>{
    syncEditorSelect('f-topic');
    if($('form-message').textContent===topicRequiredMessage)$('form-message').textContent='';
    schedulePreview();
  });
  $('f-subject').addEventListener('change',()=>{updateEditorTopics('');schedulePreview();});
  $('question-form').addEventListener('input',e=>{const field=e.target.id.replace(/^(f-|rich-)/,'');if(NoteSchema.optionFields.includes(field))refreshEditorQuestionOptions();scheduleEditorFormulaCheck(e.target.id);scheduleEditorDraft();schedulePreview();});
  $('question-form').addEventListener('change',scheduleEditorDraft);
  $('f-choice-answer').addEventListener('change',refreshEditorQuestionOptions);
  for(const id of ['f-kind','f-answer-type']){
    $(id).addEventListener('change',()=>{
      syncEditorAnswerFields();
      checkEditorFormulas();
      schedulePreview();
    });
  }
  function editorQuestionToSave(){
    const q=draft({preview:false});
    for(const key of editorTextFields)q[key]=Formula.normalizeDelimiters(q[key]);
    for(const key of Object.keys(q.options))q.options[key]=Formula.normalizeDelimiters(q.options[key]).trim();
    q.question=q.question.trim();
    if(!editingId&&!q.source)q.source=NoteSchema.questionSource({question:q.question,kind:q.kind});
    return q;
  }
  function formulaFieldName(field){
    return {question:'题目',answer:'答案',explanation:'解析',notes:'备注',equation:'方程式'}[field]||
      (NoteSchema.optionFields.includes(field)?'选项 '+field.at(-1):field);
  }
  $('question-form').onsubmit=async event=>{
    event.preventDefault();
    const original=state.questions.find(q=>q.id===editingId);
    let q=editorQuestionToSave();
    if(!subject(q.subject).topics.includes(q.topic)){requireEditorTopic();return;}
    const errors=NoteSchema.errors(q);
    if(errors.length){$('form-message').textContent=errors[0];return;}
    const [problem]=formulaProblems(q);
    if(problem){
      $('form-message').textContent='请检查'+formulaFieldName(problem.field)+'中的公式：'+problem.error;
      editorImages.focusField(problem.field);
      return;
    }
    try{
      await editorImages.upload();
      q=editorQuestionToSave();
    }catch(error){$('form-message').textContent=error.message;return;}
    const record={
      ...q,
      originalNumber:original?.originalNumber||NoteSchema.originalNumber({question:q.source||q.question}),
      createdAt:original?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),demo:false
    };
    const saved=original?await saveEditorChanges(record,original):
      await commit({...state,questions:[record,...state.questions]},editingRevision,{silent:true});
    if(saved){clearEditorDraft();closeEditor();toast('已写入本地题库，打印预览已同步。');}
  };
  function saveEditorChanges(record,original){
    const {id,createdAt,updatedAt,...fields}=record;
    const changes=Object.fromEntries(Object.entries(fields).filter(([key,value])=>JSON.stringify(value)!==JSON.stringify(original[key])));
    return commit({question:{id,changes}},editingRevision,{question:true,silent:true});
  }
  let editorFormulaTimer;
  const pendingFormulaFields=new Set();
  const editorFormulaErrors=new Map();
  function scheduleEditorFormulaCheck(id){
    const field=id?.replace(/^(f-|rich-)/,'');
    if(!formulaFields.includes(field))return;
    pendingFormulaFields.add(field);
    clearTimeout(editorFormulaTimer);
    editorFormulaTimer=setTimeout(()=>checkEditorFormulas(pendingFormulaFields),200);
  }
  function checkEditorFormulas(fields=formulaFields){
    clearTimeout(editorFormulaTimer);
    const q=draft();
    for(const field of fields)editorFormulaErrors.set(field,formulaProblems(q,[field]));
    pendingFormulaFields.clear();
    const problems=formulaFields.flatMap(field=>editorFormulaErrors.get(field)||[]);
    $('formula-check').classList.toggle('has-errors',!!problems.length);$('formula-check').textContent=problems.length?'公式待修正：'+problems.map(p=>formulaFieldName(p.field)+'：'+p.error).join('；'):'公式语法检查通过 · KaTeX + mhchem（不代表推导或反应结论已验证）';}

  let confirmAction=null;function showConfirm(title,message,label,action){$('confirm-title').textContent=title;$('confirm-message').textContent=message;$('confirm-ok').textContent=label;confirmAction=action;$('confirm-dialog').showModal();}$('confirm-cancel').onclick=()=>$('confirm-dialog').close();$('confirm-ok').onclick=()=>{$('confirm-dialog').close();confirmAction?.();};
  function confirmDelete(q){showConfirm('删除这道题？','删除前会保留一份本地历史快照，可从 data/history 恢复。','删除题目',async()=>{if(await commit({...state,questions:state.questions.filter(x=>x.id!==q.id)})){renderAll();toast('题目已删除');}});}
  async function setSetting(k,v){const before=revision;if(await commit({settings:{[k]:v}},before,{settings:true})){if(editing&&editingRevision===before){editingRevision=editorDraftRevision=revision;}syncSettings();updatePreview();}else syncSettings();}
  function syncSettings(){const s=state.settings;$('paper-size').value=s.paper;if(typeof syncPaperMenu==='function')syncPaperMenu();$('compact-mode').checked=s.compact;$('show-answer').checked=s.answer!==false;$('show-explanation').checked=s.explanation!==false;$('show-notes').checked=s.notes!==false;for(const[n,v]of[['single-column',1],['double-column',2]]){$(n).classList.toggle('active',s.columns===v);$(n).setAttribute('aria-pressed',s.columns===v?'true':'false');}}
  $('paper-size').onchange=e=>setSetting('paper',e.target.value);$('single-column').onclick=()=>setSetting('columns',1);$('double-column').onclick=()=>setSetting('columns',2);$('compact-mode').onchange=e=>setSetting('compact',e.target.checked);$('show-answer').onchange=e=>setSetting('answer',e.target.checked);$('show-explanation').onchange=e=>setSetting('explanation',e.target.checked);$('show-notes').onchange=e=>setSetting('notes',e.target.checked);
  function schedulePreview(){clearTimeout(previewTimer);previewTimer=setTimeout(()=>{updatePreview();},170);}
  function titleFor(){
    const title=(selectedSubject?subject(selectedSubject).name:'我的')+'错题专题集';
    if(topicFilters.size!==1)return title;
    const [id]=topicFilters;
    return title+' · '+NoteSchema.topicName(selectedSubject,id);
  }
