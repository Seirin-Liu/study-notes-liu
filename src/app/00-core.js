// 基础工具：DOM 查询、图标、学科表、转义、共享状态与本地题库读写。
  const $=id=>document.getElementById(id);
  const iconPaths={image:'M5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11A2.5 2.5 0 0 1 5.5 4Z M10.1 9.5a1.6 1.6 0 1 1-3.2 0 1.6 1.6 0 0 1 3.2 0Z M3 17l4.8-4.8a1.6 1.6 0 0 1 2.26 0L16 17 M13.5 14.5l1.9-1.9a1.6 1.6 0 0 1 2.26 0L21 16',eye:'M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z','eye-off':'M3 3l18 18 M10.6 6.1c.5-.1.9-.1 1.4-.1 6.4 0 10 6 10 6a16 16 0 0 1-3.5 3.8 M6.2 7.9C3.5 9.6 2 12 2 12s3.6 6 10 6c1.2 0 2.2-.2 3.2-.5 M9.9 9.9a3 3 0 0 0 4.2 4.2',book:'M4 4h6a3 3 0 0 1 2 2v14a4 4 0 0 0-4-2H4z M20 4h-6a3 3 0 0 0-2 2v14a4 4 0 0 1 4-2h4z',lock:'M6 10h12v10H6z M8 10V7a4 4 0 0 1 8 0v3',shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z m-4 9 3 3 5-6',flask:'M9 3h6 M10 3v6L5 18a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3 M8 14h8',leaf:'M20 4C9 2 3 8 6 16c7 4 14-1 14-12Z M5 21 16 9 M9 16v-5 M13 12h4',math:'M5 4h14v16H5z M8 8h8 M8 12h2 M14 12h2 M8 16h2 M14 16h2',atom:'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M3 8c2-4 20 5 18 9S1 12 3 8 M3 17C1 13 19 4 21 8S5 21 3 17 M12 2c5 0 5 20 0 20S7 2 12 2',download:'M12 3v12 m-5-5 5 5 5-5 M4 16v5h16v-5',upload:'M12 16V4 m-5 5 5-5 5 5 M4 16v5h16v-5',plus:'M12 5v14 M5 12h14',search:'M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15 M16 16l5 5',rotate:'M4 10a8 8 0 1 1 1 8 M4 4v6h6',info:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 11v6 M12 7v1',layout:'M3 4h18v16H3z M12 4v16 M6 8h3 M6 11h3 M15 8h3 M15 11h3',printer:'M6 9V3h12v6 M6 17H3v-8h18v8h-3 M6 14h12v7H6z M17 11h1',check:'m5 12 4 4L19 6','arrow-left':'m12 5-7 7 7 7 M5 12h15','chevron-left':'m15 5-7 7 7 7','chevron-right':'m9 5 7 7-7 7',edit:'m15 4 5 5 M4 20l5-1L21 7l-5-5L4 14z',trash:'M3 6h18 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',file:'M6 3h8l5 5v13H6z M14 3v6h5 M9 13h7 M9 16h7',warning:'m12 3 10 18H2z M12 9v5 M12 17v1'};
  const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round"><path d="${iconPaths[name]||iconPaths.book}"/></svg>`;
  function icons(){document.querySelectorAll('[data-icon]').forEach(e=>e.outerHTML=icon(e.dataset.icon));}
  const subjects=[{"id":"chemistry","name":"化学","en":"CHEMISTRY","icon":"flask","color":"#718b69","bg":"#eef4e9"},{"id":"biology","name":"生物","en":"BIOLOGY","icon":"leaf","color":"#b49b60","bg":"#f8f3e6"},{"id":"math","name":"数学","en":"MATHEMATICS","icon":"math","color":"#8b8eaa","bg":"#f0eff7"},{"id":"physics","name":"物理","en":"PHYSICS","icon":"atom","color":"#b78a74","bg":"#f8f0ea"},{"id":"chinese","name":"语文","en":"CHINESE","icon":"book","color":"#7b8794","bg":"#f1f3f5"},{"id":"english","name":"英语","en":"ENGLISH","icon":"file","color":"#7b8794","bg":"#f1f3f5"}].map(s=>({...s,topics:NoteSchema.topics[s.id]}));
  const subject=id=>subjects.find(s=>s.id===id)||subjects[0];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const id=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
  const today=()=>new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  let state={version:2,questions:[],settings:NoteSchema.settings()},revision='',ready=false,saving=false,polling=false,editingRevision='';
  const defaultKindFilter='question';
  let selectedSubject='',query='',topicFilters=new Set(),topicsExpanded=false,kindFilter=defaultKindFilter,statusFilter='',dateFrom='',dateTo='',todayMode=false,selectedIds=new Set(),currentPage=1,editing=false,editingId=null,previewTimer,toastTimer;
  const structuralIds={};for(const name of ['subject-nav','local-status','sync-error','page-title','page-title-icon','search-input','add-btn','collection-title','collection-count','overview','question-list','question-pagination','collection-panel','editor-panel','f-subject','f-topic','question-form','paper-size','compact-mode','show-answer','show-explanation','show-notes','single-column','double-column','preview-stage','preview-canvas','preview-empty','preview-meta','page-indicator','prev-page','next-page','print-btn','print-count','save-question-btn','status-filter','date-preset']){const el=$(name);if(!el)structuralIds[name]=false;else{if(!el.id)el.id=name;structuralIds[name]=true;}}
  const formulaFields=['question','answer','explanation','notes','equation',...NoteSchema.optionFields];
  function formulaProblems(q,fields=formulaFields){return fields.flatMap(k=>Formula.check(NoteSchema.fieldText(q,k),{equation:k==='equation'}).map(error=>({field:k,error})));}
  let librarySyncToken='';
  async function loadLocal(manual=false){
    if(polling||saving)return;
    polling=true;
    const requestRevision=revision;
    try{
      const res=await fetch('/api/library?sync='+encodeURIComponent(manual?'':librarySyncToken),{cache:'no-store'});
      const data=await res.json();
      if(!res.ok)throw Error(data.error||'无法读取本地题库');
      if(revision!==requestRevision||data.unchanged)return;
      librarySyncToken=data.syncToken||'';
      const changed=revision!==data.revision;
      state={version:2,questions:data.questions,settings:data.settings};revision=data.revision;ready=true;
      renderLibraryFormulaIssues(data.formulaIssues||[]);
      $('local-status').textContent='已连接本地文件';
      if(changed){syncSettings();renderAll();}
      if(manual)toast('本地文件已同步'+(editing?'；当前草稿已保留。':'。'));
    }catch(error){
      librarySyncToken='';
      $('local-status').textContent='本地文件连接异常';
      $('sync-error').hidden=false;
      $('sync-error').textContent=error.message+'。请保留本地服务窗口并检查 data/questions.json。';
      if(manual)toast(error.message);
    }finally{polling=false;}
  }
  function renderLibraryFormulaIssues(issues){
    $('sync-error').textContent=issues.length?'有 '+issues.length+' 处公式语法待修正。请编辑标红的公式。':'';
    $('sync-error').hidden=issues.length===0;
  }
  async function commit(next,expectedRevision=revision,options={}){
    if(!ready||saving){toast('请等待本地题库连接或当前保存完成。');return false;}
    saving=true;
    try{
      const partial=options.mastery||options.question||options.settings;
      const res=await fetch('/api/library',{
        method:partial?'PATCH':'PUT',
        headers:{'Content-Type':'application/json','X-Zhixu-Local':'1','If-Match':expectedRevision},
        body:JSON.stringify(partial?next:{version:2,questions:next.questions,settings:next.settings})
      });
      const data=await res.json();
      if(!res.ok)throw Error(data.error+(res.status===409&&editing?' 请保留草稿内容，取消编辑并重新打开后再保存。':''));
      if(options.mastery){
        const updates=new Map(data.updates.map(update=>[update.id,update]));
        state={...state,questions:state.questions.map(question=>updates.has(question.id)?{...question,...updates.get(question.id)}:question)};
      }else if(options.question){
        const saved=data.question;
        const original=state.questions.find(question=>question.id===saved.id);
        const questions=state.questions.map(question=>question.id===saved.id?saved:question);
        state={...state,questions:original?.subject===saved.subject?questions:
          NoteSchema.subjects.flatMap(subject=>questions.filter(question=>question.subject===subject))};
      }else if(options.settings){
        state={...state,settings:data.settings};
      }else{
        state={version:2,questions:data.questions,settings:data.settings};
      }
      revision=data.revision;
      librarySyncToken=data.syncToken||'';
      if(data.formulaIssues)renderLibraryFormulaIssues(data.formulaIssues);
      $('local-status').textContent='已连接本地文件';
      return true;
    }catch(e){
      if(!options.silent)toast(e.message);
      if($('form-message'))$('form-message').textContent=e.message;
      return false;
    }finally{saving=false;}
  }
  function commitMastery(ids,mastered){return commit({ids,mastered},revision,{mastery:true});}
  function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4200);}
  const style=s=>`--subject-color:${s.color};--subject-bg:${s.bg}`;
  function localDate(value){const d=new Date(value);if(!Number.isFinite(d.getTime()))return '';return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  function matchesSearch(q){
    const keyword=query.trim().normalize('NFKC').toLowerCase();
    const number=NoteSchema.originalNumber(q).normalize('NFKC').toLowerCase().replace(/\s+/g,'');
    const exact=keyword.match(/^题号\s*:\s*(.+)$/);
    if(exact){
      const target=exact[1].replace(/\s+/g,'');
      return number===target||(/^\d+$/.test(target)&&number.match(/^\d+/)?.[0]===target);
    }
    return !keyword||[q.question,...ImageReferences.optionTexts(q),q.answer,q.explanation,q.notes,NoteSchema.topicName(q.subject,q.topic),q.topic,q.equation,NoteSchema.questionSource(q),number].some(
      value=>(value||'').normalize('NFKC').toLowerCase().includes(keyword)
    );
  }
  function compareByUploadTime(a,b){
    const difference=Date.parse(b.createdAt)-Date.parse(a.createdAt);
    return Number.isFinite(difference)?difference:0;
  }
  function filtered(){return state.questions.filter(q=>(!selectedSubject||q.subject===selectedSubject)&&(!topicFilters.size||topicFilters.has(q.topic))&&(!kindFilter||(q.kind??'question')===kindFilter)&&(!statusFilter||(statusFilter==='mastered'?q.mastered:!q.mastered))&&(!dateFrom||localDate(q.createdAt)>=dateFrom)&&(!dateTo||localDate(q.createdAt)<=dateTo)&&matchesSearch(q)).sort(compareByUploadTime);}
  function selectedQuestions(){const byId=new Map(state.questions.map(q=>[q.id,q]));return [...selectedIds].map(id=>byId.get(id)).filter(Boolean);}
  function renderSelection(items){
    let visible=0;
    for(const {id} of items)if(selectedIds.has(id))visible++;
    const hidden=selectedIds.size-visible;
    $('selection-summary').textContent=`已选 ${selectedIds.size} 道 · 按勾选顺序打印${hidden?` · ${hidden} 道被当前筛选隐藏`:''}`;
    $('clear-selection').disabled=!selectedIds.size;
    $('select-visible').disabled=!items.length;
    $('select-by-date').disabled=!ready||!selectedSubject;
    $('mark-mastered').disabled=$('mark-review').disabled=!selectedIds.size;
  }
  const imageUrl=(q,im)=>/^data:image\/(?:png|jpeg|webp);base64,/i.test(im.preview||'')?im.preview:`/assets/${encodeURIComponent(q.id)}/${encodeURIComponent(im.file)}`;
