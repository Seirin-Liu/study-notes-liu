// 编辑面板：打开、保存、草稿、化学核查与打印设置同步。
  const editorImages=new ImageEditor(()=>{checkEditorFormulas();schedulePreview();});
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

  function updateEditorTopics(selected=$('f-topic').value){const s=subject($('f-subject').value),topic=$('f-topic');topic.innerHTML='<option value="">选择类别</option>'+s.topics.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');topic.value=s.topics.includes(selected)?selected:'';syncEditorSelect('f-subject');syncEditorSelect('f-topic');}
  function draft(){const original=state.questions.find(q=>q.id===editingId);return {id:editingId||editorImages.questionId||'draft',subject:$('f-subject').value,kind:$('f-kind').value,source:$('f-source').value.trim(),topic:$('f-topic').value.trim()||'未命名专题',question:$('f-question').value,answer:$('f-answer').value,explanation:$('f-explanation').value,notes:$('f-notes').value,equation:original?.equation||'',equationPlain:original?.equationPlain||'',images:editorImages.images({preview:true}),mastered:$('f-mastered').checked};}
  function syncEditorMasteryLabel(){const input=$('f-mastered');if(!input)return;const label=input.closest('.mastery-switch')?.querySelector('.mastery-label');if(label)label.textContent=input.checked?'已掌握':'待复习';input.setAttribute('aria-label',input.checked?'这道题已掌握，点击切换为待复习':'这道题待复习，点击切换为已掌握');}
  function openEditor(q=null,restored=false,push=true){if(!ready){toast('请先启动本地服务并等待题库连接。');return;}if(typeof pauseScrollTracking==='function')pauseScrollTracking();const editorPath='/'+(q?.subject||selectedSubject||'chemistry')+'/edit/'+(q?.id||'new');if(push&&location.pathname!==editorPath)history.pushState({editorFrom:location.pathname},'',editorPath);document.title=(q?'编辑题目':'录入新题')+' · 错题本';editing=true;document.body.classList.add('editing-mode');editingRevision=revision;editingId=q?.id||null;editorImages.open(editingId||id(),q?.images||[]);$('collection-panel').hidden=true;$('editor-panel').hidden=false;$('editor-heading').textContent=editingId?'编辑题目':'录入新题';setupStickyFooter();$('form-message').textContent='';$('f-subject').value=q?.subject||selectedSubject||'chemistry';$('f-source').value=q?NoteSchema.questionSource(q):'';$('f-kind').value=q?.kind||(q?'question':kindFilter||'question');['question','answer','explanation','notes'].forEach(k=>$('f-'+k).value=q?.[k]||'');editorImages.syncFields();$('f-mastered').checked=!!q?.mastered;syncEditorMasteryLabel();updateEditorTopics(q?.topic||'');checkEditorFormulas();updatePreview();if(!restored)$('f-topic-menu-button').focus();}
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
  function closeEditor(navigate=true){if(navigate&&/\/edit\//.test(location.pathname)){if(history.state?.editorFrom)history.back();else history.replaceState(null,'','/'+(selectedSubject||'overview'));}document.title=(selectedSubject?subject(selectedSubject).name+'错题':'错题本')+' · 比格多栋';editing=false;document.body.classList.remove('editing-mode');editingId=null;if(stickyCleanup){stickyCleanup();stickyCleanup=null;}$('collection-panel').hidden=false;$('editor-panel').hidden=true;renderAll();if(typeof resumeScrollTracking==='function')resumeScrollTracking();}
  function cancelEditor(){const d=draft();const original=state.questions.find(q=>q.id===editingId);const dirty=['subject','topic','question','answer','explanation','notes','equation','equationPlain','mastered'].some(k=>(d[k]||'')!==(original?.[k]||''));if((dirty||editorImages.dirty())&&['question','answer','explanation','notes'].some(k=>d[k])){showConfirm('放弃本次编辑？','未保存的内容将被丢弃。','放弃编辑',closeEditor);}else closeEditor();}
  $('add-btn').onclick=()=>{if(editing){toast('正在编辑中，保存后可继续录入。');return;}openEditor();};$('back-btn').onclick=cancelEditor;$('cancel-btn').onclick=cancelEditor;
  const topicRequiredMessage='请选择该学科规定的题目类别。';
  function requireEditorTopic(){
    $('form-message').textContent=topicRequiredMessage;
    $('f-topic-menu-button').focus();
  }
  $('f-topic').addEventListener('invalid',e=>{e.preventDefault();requireEditorTopic();});
  $('f-topic').addEventListener('change',()=>{
    syncEditorSelect('f-topic');
    if($('form-message').textContent===topicRequiredMessage)$('form-message').textContent='';
    schedulePreview();
  });
  $('f-subject').addEventListener('change',()=>{updateEditorTopics('');checkEditorFormulas();schedulePreview();});
  $('question-form').addEventListener('input',()=>{checkEditorFormulas();schedulePreview();});
  $('question-form').onsubmit=async e=>{e.preventDefault();const q=draft();q.topic=$('f-topic').value.trim();for(const k of ['question','answer','explanation','notes'])q[k]=Formula.normalizeDelimiters(q[k]||'');q.question=q.question.trim();if(!editingId&&!q.source)q.source=NoteSchema.questionSource({question:q.question,kind:q.kind});q.id=editingId||editorImages.questionId;if(formulaProblems(q).length){const labels={question:'题目',answer:'答案',explanation:'解析',notes:'备注',equation:'方程式'};const problems=formulaProblems(q);$('form-message').textContent='请检查'+labels[problems[0].field]+'中的公式：'+problems[0].error;editorImages.focusField(problems[0].field);return;}if(!subject(q.subject).topics.includes(q.topic)){requireEditorTopic();return;}if(!validQuestion(q)){$('form-message').textContent='请填写学科、专题和题目，并检查内容长度。';return;}try{await editorImages.upload();q.images=editorImages.images();for(const k of ['question','answer','explanation','notes'])q[k]=Formula.normalizeDelimiters($('f-'+k).value);q.question=q.question.trim();}catch(error){$('form-message').textContent=error.message;return;}const original=state.questions.find(x=>x.id===editingId);const record={...q,originalNumber:original?.originalNumber||NoteSchema.originalNumber({question:q.source||q.question}),id:original?.id||q.id,createdAt:original?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),demo:false};const next={...state,questions:original?state.questions.map(x=>x.id===original.id?record:x):[record,...state.questions]};if(await commit(next,editingRevision)){closeEditor();toast('已写入本地题库，打印预览已同步。');}};
  function checkEditorFormulas(){const q=draft();const problems=formulaProblems(q);$('formula-check').classList.toggle('has-errors',!!problems.length);$('formula-check').textContent=problems.length?'公式待修正：'+problems.map(p=>({question:'题目',answer:'答案',explanation:'解析',notes:'备注',equation:'方程式'}[p.field]||p.field)+'：'+p.error).join('；'):'公式语法检查通过 · KaTeX + mhchem（不代表推导或反应结论已验证）';$('save-question-btn').disabled=editorImages.busy;}

  let confirmAction=null;function showConfirm(title,message,label,action){$('confirm-title').textContent=title;$('confirm-message').textContent=message;$('confirm-ok').textContent=label;confirmAction=action;$('confirm-dialog').showModal();}$('confirm-cancel').onclick=()=>$('confirm-dialog').close();$('confirm-ok').onclick=()=>{$('confirm-dialog').close();confirmAction?.();};
  function confirmDelete(q){showConfirm('删除这道题？','删除前会保留一份本地历史快照，可从 data/history 恢复。','删除题目',async()=>{if(await commit({...state,questions:state.questions.filter(x=>x.id!==q.id)})){renderAll();toast('题目已删除');}});}
  async function setSetting(k,v){const before=revision;const next={...state,settings:{...state.settings,[k]:v}};if(await commit(next)){if(editing&&editingRevision===before)editingRevision=revision;syncSettings();updatePreview();}else syncSettings();}
  function syncSettings(){const s=state.settings;$('paper-size').value=s.paper;if(typeof syncPaperMenu==='function')syncPaperMenu();$('compact-mode').checked=s.compact;$('show-answer').checked=s.answer!==false;$('show-explanation').checked=s.explanation!==false;$('show-notes').checked=s.notes!==false;for(const[n,v]of[['single-column',1],['double-column',2]]){$(n).classList.toggle('active',s.columns===v);$(n).setAttribute('aria-pressed',s.columns===v?'true':'false');}}
  $('paper-size').onchange=e=>setSetting('paper',e.target.value);$('single-column').onclick=()=>setSetting('columns',1);$('double-column').onclick=()=>setSetting('columns',2);$('compact-mode').onchange=e=>setSetting('compact',e.target.checked);$('show-answer').onchange=e=>setSetting('answer',e.target.checked);$('show-explanation').onchange=e=>setSetting('explanation',e.target.checked);$('show-notes').onchange=e=>setSetting('notes',e.target.checked);
  function schedulePreview(){clearTimeout(previewTimer);previewTimer=setTimeout(()=>{updatePreview();},170);}
  function titleFor(items){return (selectedSubject?subject(selectedSubject).name:'我的')+'错题专题集'+(topicFilters.size===1?' · '+[...topicFilters][0]:'');}
