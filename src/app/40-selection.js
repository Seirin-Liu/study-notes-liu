// 状态/日期/类别筛选，以及逐题勾选与批量标记已掌握。
  function renderAll(){
    selectedIds=new Set([...selectedIds].filter(id=>state.questions.some(q=>q.id===id)));
    renderNav();
    if(renderReviewRoute())return;
    renderTopics();
    renderList();
    if(uploadDateDialog.open)refreshUploadCalendar();
  }
  function selectSubject(s,push=true,keepPage=false){
    if(editing){toast('请先保存或取消当前编辑。');return;}
    uploadDateDialog.close();
    if(selectedSubject!==s)selectedIds.clear();
    selectedSubject=s;
    if(!keepPage)currentPage=1;
    topicFilters.clear();
    topicsExpanded=false;
    if(push&&location.pathname!=='/'+(s||'overview'))history.pushState(null,'','/'+(s||'overview'));
    document.title=(s?subject(s).name+'错题':'错题本')+' · 比格多栋';
    renderAll();
    if(typeof restoreScrollPosition==='function')restoreScrollPosition();
  }
  document.addEventListener('click',async e=>{const s=e.target.closest('[data-subject]');if(s)selectSubject(s.dataset.subject);const a=e.target.closest('[data-action]');if(!a)return;const q=state.questions.find(q=>q.id===a.dataset.id);if(a.dataset.action==='add')openEditor();if(a.dataset.action==='toggle-solution'){const card=a.closest('.question-card');const panel=card?.querySelector('.card-solution');if(panel){const open=panel.hidden;panel.hidden=!open;a.setAttribute('aria-expanded',String(open));card.classList.toggle('solution-open',open);}return;}if(a.dataset.action==='reset-filter')resetFilters();if(a.dataset.action==='edit'&&q)openEditor(q);if(a.dataset.action==='mastery'&&q){if(await commitMastery([q.id],!q.mastered)){renderAll();toast(q.mastered?'已标记为待复习':'已标记为已掌握');}}if(a.dataset.action==='delete'&&q)confirmDelete(q);});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-image]');if(!b)return;$('image-large').src=b.dataset.image;$('image-large').alt=b.dataset.alt;$('image-caption').textContent=b.dataset.alt;$('image-dialog').showModal();});$('image-close').onclick=()=>$('image-dialog').close();
  $('entry-kind-filter').addEventListener('click',event=>{
    const button=event.target.closest('[data-entry-kind]');
    if(!button||button.dataset.entryKind===kindFilter)return;
    kindFilter=button.dataset.entryKind;
    currentPage=1;
    syncPageInURL();
    renderList();
  });
  $('search-input').addEventListener('input',e=>{query=e.target.value;currentPage=1;renderList();});
  $('topic-options-filter').onchange=e=>{if(!e.target.matches('input[type=checkbox]'))return;e.target.checked?topicFilters.add(e.target.value):topicFilters.delete(e.target.value);currentPage=1;$('topic-summary').textContent=topicFilters.size?`已选 ${topicFilters.size} 类`:'全部类别';renderList();};$('topic-expand').onclick=()=>{topicsExpanded=!topicsExpanded;renderTopics();};
  function closeStatusMenu(){const menu=$('status-menu');menu.hidden=true;$('status-menu-button').setAttribute('aria-expanded','false');}
  function syncStatusMenu(){const select=$('status-filter');$('status-menu-label').textContent=select.selectedOptions[0]?.textContent||'全部状态';$('status-menu').querySelectorAll('[data-status]').forEach(b=>{const active=b.dataset.status===select.value;b.classList.toggle('active',active);b.setAttribute('aria-checked',String(active));});}
    // 纸张选择：与「全部状态」使用同一套自定义下拉
  function closePaperMenu(){const menu=$('paper-menu');if(!menu)return;menu.hidden=true;$('paper-menu-button').setAttribute('aria-expanded','false');}
  function syncPaperMenu(){const select=$('paper-size');if(!select)return;const label=$('paper-menu-label');if(label)label.textContent=select.selectedOptions[0]?.textContent||'B5 纸张';$('paper-menu')?.querySelectorAll('[data-paper]').forEach(b=>{const active=b.dataset.paper===select.value;b.classList.toggle('active',active);b.setAttribute('aria-checked',String(active));});}
  if($('paper-menu-button')){
    $('paper-menu-button').onclick=()=>{const menu=$('paper-menu');if(!menu.hidden){closePaperMenu();return;}closeStatusMenu();closeDateMenu();syncPaperMenu();const rect=$('paper-menu-button').getBoundingClientRect();menu.style.left=Math.max(8,Math.min(rect.left,innerWidth-200))+'px';menu.style.top=Math.max(8,Math.min(rect.bottom+6,innerHeight-130))+'px';menu.hidden=false;$('paper-menu-button').setAttribute('aria-expanded','true');};
    $('paper-menu').onclick=e=>{const option=e.target.closest('[data-paper]');if(!option)return;const select=$('paper-size');select.value=option.dataset.paper;select.dispatchEvent(new Event('change',{bubbles:true}));syncPaperMenu();closePaperMenu();};
    document.addEventListener('click',e=>{if(!e.target.closest('#paper-menu')&&!e.target.closest('#paper-menu-button'))closePaperMenu();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closePaperMenu();});
  }
$('status-menu-button').onclick=()=>{const menu=$('status-menu');if(!menu.hidden){closeStatusMenu();return;}closeDateMenu();syncStatusMenu();const rect=$('status-menu-button').getBoundingClientRect();menu.style.left=Math.max(8,Math.min(rect.left,innerWidth-216))+'px';menu.style.top=Math.max(8,Math.min(rect.bottom+6,innerHeight-160))+'px';menu.hidden=false;$('status-menu-button').setAttribute('aria-expanded','true');};
  $('status-menu').onclick=e=>{const option=e.target.closest('[data-status]');if(!option)return;$('status-filter').value=option.dataset.status;statusFilter=option.dataset.status;syncStatusMenu();closeStatusMenu();currentPage=1;renderList();};
  document.addEventListener('click',e=>{if(!e.target.closest('#status-menu,#status-menu-button'))closeStatusMenu();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeStatusMenu();});
  function updateDateFilter(){
    const preset=$('date-preset').value;
    todayMode=preset==='today';
    $('custom-dates').hidden=preset!=='custom';
    currentPage=1;
    if(preset==='custom'){
      dateFrom=$('date-from').value;
      dateTo=$('date-to').value;
    }else if(preset==='all'){
      dateFrom=dateTo='';
    }else{
      const now=new Date();
      const start=new Date(now);
      const end=new Date(now);
      if(preset==='today'&&now.getHours()<6)start.setDate(start.getDate()-1);
      else if(preset==='yesterday'){
        start.setDate(start.getDate()-1);
        end.setDate(end.getDate()-1);
      }else if(preset==='week')start.setDate(start.getDate()-6);
      else if(preset==='month30')start.setDate(start.getDate()-29);
      else if(preset==='this-month')start.setDate(1);
      else if(preset==='last-month'){
        start.setMonth(start.getMonth()-1,1);
        end.setDate(0);
      }
      dateFrom=localDate(start);
      dateTo=localDate(end);
    }
  }
  function applyDatePreset(){updateDateFilter();renderList();}
  $('date-preset').onchange=applyDatePreset;$('date-from').onchange=applyDatePreset;$('date-to').onchange=applyDatePreset;
  function closeDateMenu(){const menu=$('date-menu');menu.hidden=true;$('date-menu-button').setAttribute('aria-expanded','false');}
  function syncDateMenu(){const select=$('date-preset');$('date-menu-label').textContent=select.selectedOptions[0]?.textContent||'全部时间';$('date-menu').querySelectorAll('[data-date]').forEach(b=>{const active=b.dataset.date===select.value;b.classList.toggle('active',active);b.setAttribute('aria-checked',String(active));});}
  $('date-menu-button').onclick=()=>{const menu=$('date-menu');if(!menu.hidden){closeDateMenu();return;}syncDateMenu();const rect=$('date-menu-button').getBoundingClientRect();menu.style.left=Math.max(8,Math.min(rect.left,innerWidth-216))+'px';menu.style.top=Math.max(8,Math.min(rect.bottom+6,innerHeight-352))+'px';menu.hidden=false;$('date-menu-button').setAttribute('aria-expanded','true');};
  $('date-menu').onclick=e=>{const option=e.target.closest('[data-date]');if(!option)return;$('date-preset').value=option.dataset.date;syncDateMenu();closeDateMenu();applyDatePreset();};
  document.addEventListener('click',e=>{if(!e.target.closest('#date-menu,#date-menu-button'))closeDateMenu();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDateMenu();});

  const uploadDateDialog=$('upload-date-dialog');
  const uploadCalendarDays=$('upload-calendar-days');
  const selectedUploadDates=new Set();
  let uploadCalendarMonth, uploadsByDate;

  function groupSubjectUploads(){
    const groups=new Map();
    for(const q of state.questions){
      if(q.subject!==selectedSubject)continue;
      const date=localDate(q.createdAt);
      if(!date)continue;
      if(!groups.has(date))groups.set(date,[]);
      groups.get(date).push(q);
    }
    return groups;
  }

  function renderUploadDateSummary(){
    let count=0;
    for(const date of selectedUploadDates)count+=uploadsByDate.get(date).length;
    $('upload-date-summary').textContent=selectedUploadDates.size
      ?`已选 ${selectedUploadDates.size} 天 · 共 ${count} 道`
      :(uploadsByDate.size?'可选择多个日期':'本学科暂无上传记录');
    $('upload-date-apply').disabled=!count;
  }

  function renderUploadCalendar(){
    const year=uploadCalendarMonth.getFullYear(), month=uploadCalendarMonth.getMonth();
    const heading=`${year} 年 ${month+1} 月`;
    const monthLabel=$('upload-calendar-month');
    if(monthLabel.textContent!==heading)monthLabel.textContent=heading;
    const offset=(uploadCalendarMonth.getDay()+6)%7;
    const dayCount=new Date(year,month+1,0).getDate();
    const focusedDate=uploadCalendarDays.contains(document.activeElement)
      ?document.activeElement.dataset.uploadDate
      :null;
    const cells=Array(offset).fill('<span aria-hidden="true"></span>');
    for(let day=1;day<=dayCount;day++){
      const date=localDate(new Date(year,month,day,12));
      const count=uploadsByDate.get(date)?.length||0;
      cells.push(`<button type="button" data-upload-date="${date}" aria-label="${year}年${month+1}月${day}日，${count} 道"`
        +` aria-pressed="${selectedUploadDates.has(date)}"${count?'':' disabled'}><span>${day}</span><small>${count} 道</small></button>`);
    }
    uploadCalendarDays.innerHTML=cells.join('');
    if(focusedDate)uploadCalendarDays.querySelector(`[data-upload-date="${focusedDate}"]:enabled`)?.focus({preventScroll:true});
    renderUploadDateSummary();
  }

  function refreshUploadCalendar(){
    uploadsByDate=groupSubjectUploads();
    for(const date of selectedUploadDates)if(!uploadsByDate.has(date))selectedUploadDates.delete(date);
    renderUploadCalendar();
  }

  function moveUploadCalendarMonth(offset){
    uploadCalendarMonth.setMonth(uploadCalendarMonth.getMonth()+offset);
    renderUploadCalendar();
  }

  $('select-by-date').onclick=()=>{
    uploadsByDate=groupSubjectUploads();
    selectedUploadDates.clear();
    const latest=[...uploadsByDate.keys()].sort().at(-1);
    uploadCalendarMonth=latest?new Date(latest+'T12:00:00'):new Date();
    uploadCalendarMonth.setDate(1);
    $('upload-date-scope').textContent=subject(selectedSubject).name+' · 含错题与笔记';
    renderUploadCalendar();
    uploadDateDialog.showModal();
  };
  $('upload-calendar-prev').onclick=()=>moveUploadCalendarMonth(-1);
  $('upload-calendar-next').onclick=()=>moveUploadCalendarMonth(1);
  uploadCalendarDays.onclick=event=>{
    const button=event.target.closest('button[data-upload-date]');
    if(!button||button.disabled)return;
    const date=button.dataset.uploadDate;
    if(selectedUploadDates.has(date))selectedUploadDates.delete(date);
    else selectedUploadDates.add(date);
    button.setAttribute('aria-pressed',String(selectedUploadDates.has(date)));
    renderUploadDateSummary();
  };
  $('upload-date-cancel').onclick=()=>uploadDateDialog.close();
  uploadDateDialog.addEventListener('close',()=>{
    if(mobileLayout.matches)$('mobile-more').querySelector('summary').focus({preventScroll:true});
  });
  $('upload-date-apply').onclick=()=>{
    const items=[...selectedUploadDates].flatMap(date=>uploadsByDate.get(date)).sort(compareByUploadTime);
    if(!items.length)return;
    $('date-preset').value='all';
    updateDateFilter();
    syncDateMenu();
    syncPageInURL();
    selectQuestions(items,filtered());
    uploadDateDialog.close();
  };

  const listAnswersPreference='zhixu-show-list-answers';
  const listAnswerToggle=$('list-answer-toggle');

  function setListAnswersVisible(visible){
    const list=$('question-list');
    list.classList.toggle('list-answers-hidden',!visible);
    listAnswerToggle.setAttribute('aria-pressed',String(visible));
    listAnswerToggle.title=visible?'隐藏列表答案':'显示列表答案';
    listAnswerToggle.innerHTML=icon(visible?'eye':'eye-off')+'<span>答案</span>';
    if(visible){
      for(const button of list.querySelectorAll('.card-answer-toggle[aria-expanded="true"]')){
        button.setAttribute('aria-expanded','false');
        button.setAttribute('aria-label','查看本题答案');
      }
    }
  }

  let listAnswersVisible=true;
  try{listAnswersVisible=localStorage.getItem(listAnswersPreference)!=='false';}catch{}
  setListAnswersVisible(listAnswersVisible);

  listAnswerToggle.onclick=()=>{
    listAnswersVisible=!listAnswersVisible;
    setListAnswersVisible(listAnswersVisible);
    try{localStorage.setItem(listAnswersPreference,String(listAnswersVisible));}catch{}
  };

  $('question-list').addEventListener('click',event=>{
    const button=event.target.closest('.card-answer-toggle');
    if(!button)return;
    const show=button.getAttribute('aria-expanded')!=='true';
    button.setAttribute('aria-expanded',String(show));
    button.setAttribute('aria-label',show?'隐藏本题答案':'查看本题答案');
  });

  $('question-list').onchange=async e=>{const masteryId=e.target.dataset.masteryId;if(masteryId){const q=state.questions.find(q=>q.id===masteryId);if(!q)return;const mastered=e.target.checked;e.target.disabled=true;const ok=await commitMastery([masteryId],mastered);if(!ok){e.target.checked=!mastered;renderAll();return;}renderAll();toast(mastered?'已标记为已掌握':'已改回待复习');return;}const id=e.target.dataset.selectId;if(!id)return;e.target.checked?selectedIds.add(id):selectedIds.delete(id);{const label=e.target.closest('.question-select');if(label){label.querySelector('.selection-order')?.remove();const order=selectedIds.has(id)?Array.from(selectedIds).indexOf(id)+1:0;if(order){const em=document.createElement('em');em.className='selection-order';em.textContent='第 '+order+' 题';label.append(em);}}e.target.closest('.question-card')?.classList.toggle('selected',selectedIds.has(id));}renderSelection(currentFilteredItems);updatePreview(false,e.target.checked);};
  async function markSelected(mastered){if(!selectedIds.size){toast('请先勾选要标记的题目。');return;}const ids=[...selectedIds].filter(id=>state.questions.some(q=>q.id===id));const targets=ids.filter(id=>{const q=state.questions.find(x=>x.id===id);return !!q.mastered!==mastered;});if(!targets.length){toast(`已勾选的 ${ids.length} 道题已经是${mastered?'已掌握':'待复习'}状态`);return;}if(await commitMastery(targets,mastered)){renderAll();toast(`已将 ${targets.length} 道题标为${mastered?'已掌握':'待复习'}`+(ids.length>targets.length?`，其余 ${ids.length-targets.length} 道原本就是该状态。`:'。'));}}
  $('mark-mastered').onclick=()=>markSelected(true);
  $('mark-review').onclick=()=>markSelected(false);

  function selectQuestions(items,visibleItems=currentFilteredItems){
    const previousCount=selectedIds.size;
    for(const {id} of items)selectedIds.add(id);
    renderList(visibleItems,false);
    updatePreview(false,selectedIds.size>previousCount);
  }
  $('select-visible').onclick=()=>selectQuestions(currentFilteredItems);
  $('clear-selection').onclick=()=>{selectedIds.clear();renderList(currentFilteredItems);};
  function resetFilters(){query='';kindFilter=defaultKindFilter;topicFilters.clear();topicsExpanded=false;statusFilter='';dateFrom=dateTo='';todayMode=false;$('date-preset').value='all';applyDatePreset();syncDateMenu();closeDateMenu();$('custom-dates').hidden=true;$('search-input').value='';$('status-filter').value='';syncStatusMenu();closeStatusMenu();$('date-from').value=$('date-to').value='';renderAll();}
  $('reset-filter').onclick=()=>resetFilters();
