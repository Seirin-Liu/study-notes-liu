/* 本文件由 node scripts/build-app.mjs 从 src/app/*.js 生成，请勿手工编辑。 */
(() => {
  'use strict';

  /* ===== 00-core.js ===== */
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

  /* ===== 10-format.js ===== */
// 题干/答案等正文渲染：LaTeX 公式、题图位置标记。卡片与打印预览共用。
  function richContent(q,text,equation=false){
    function renderImage(image,scale=null){const src=imageUrl(q,image);return '<span class="question-inline-image"'+(scale?' data-image-scale="'+scale+'" style="'+ImageReferences.style(scale)+'"':'')+'><button type="button" class="image-thumb" data-image="'+esc(src)+'" data-alt="'+esc(image.alt)+'"><img src="'+esc(src)+'" alt="'+esc(image.alt)+'" loading="lazy"><small>'+esc(image.alt)+'</small></button></span>';}
    return ImageReferences.parts(text).map(part=>{
      if(part.type==='text')return Formula.render(part.value,{equation});
      const image=(q.images||[]).find(x=>x.file===part.file);
      return image?renderImage(image,part.scale):esc(part.raw);
    }).join('');
  }
  function richQuestion(q,key='question'){
    let content=NoteSchema.fieldText(q,key);
    if(key==='question'){
      for(const image of ImageReferences.unplaced(q))content+='\n'+ImageReferences.marker(image.file);
    }
    return richContent(q,content,key==='equation');
  }
  function questionOptionsHTML(q,correctOption=''){
    if(q.answerType!=='single-choice')return '';
    return `<div class="question-options">${NoteSchema.optionKeys.map(key=>
      `<div${key===correctOption?' class="is-correct"':''}><b>${key}.</b><div>${richContent(q,q.options[key])}</div></div>`
    ).join('')}</div>`;
  }

  /* ===== 20-render.js ===== */
// 题库列表、学科导航与首页概览的 HTML 生成。
  let summarizedQuestions, librarySummary;
  function summarizeLibrary(){
    if(summarizedQuestions===state.questions)return librarySummary;
    const bySubject=new Map(), wrongBySubject=new Map(), topicCounts=new Map(), byDay=new Map();
    const increment=(map,key)=>map.set(key,(map.get(key)||0)+1);
    for(const q of state.questions){
      increment(bySubject,q.subject);
      increment(byDay,localDate(q.createdAt));
      if(q.kind==='note')continue;
      increment(wrongBySubject,q.subject);
      const key=q.subject+'|'+q.topic;
      const item=topicCounts.get(key)||{subject:q.subject,topic:NoteSchema.topicName(q.subject,q.topic),count:0};
      item.count++;
      topicCounts.set(key,item);
    }
    const topics=[...topicCounts.values()].sort((a,b)=>b.count-a.count||a.topic.localeCompare(b.topic,'zh-CN')).slice(0,8);
    summarizedQuestions=state.questions;
    return librarySummary={bySubject,wrongBySubject,topicCounts,topics,byDay};
  }
  function renderNav(){document.body.classList.toggle('subject-selected',!!selectedSubject);document.body.classList.toggle('overview-mode',!selectedSubject);{const t=$('page-title');if(t)t.textContent=selectedSubject?subject(selectedSubject).name+'错题':'';const ti=$('page-title-icon');if(ti)ti.innerHTML=selectedSubject?icon(subject(selectedSubject).icon):'';}const reviewNav=$('review-nav');const {bySubject}=summarizeLibrary();$('subject-nav').innerHTML=`<button class="nav-item ${selectedSubject?'':'active'}" data-subject=""><span>${icon('book')}题库总览</span><small>${state.questions.length}</small></button>`+subjects.map(s=>`<button class="nav-item ${selectedSubject===s.id?'active':''}" data-subject="${s.id}"><span>${icon(s.icon)}${s.name}</span><small>${bySubject.get(s.id)||0}</small></button>`).join('');$('subject-nav').append(reviewNav);}
  function renderTopics(){const optionsByTopic=(selectedSubject?[subject(selectedSubject)]:subjects).flatMap(s=>s.topics.map(id=>[id,NoteSchema.topicName(s.id,id)]));const topics=optionsByTopic.map(([id])=>id);topicFilters=new Set([...topicFilters].filter(t=>topics.includes(t)));const options=$('topic-options-filter');options.classList.remove('expanded');options.innerHTML=topics.length?optionsByTopic.map(([t,name])=>`<label class="topic-option"><input type="checkbox" value="${esc(t)}" ${topicFilters.has(t)?'checked':''}><span>${esc(name)}</span></label>`).join(''):'<span class="no-topics">暂无题目类别</span>';const hasMore=options.scrollHeight>options.clientHeight+1;options.classList.toggle('expanded',topicsExpanded);const toggle=$('topic-expand');toggle.hidden=!hasMore;toggle.textContent=topicsExpanded?'收起类别':'展开全部类别';toggle.setAttribute('aria-expanded',String(topicsExpanded));$('topic-summary').textContent=topicFilters.size?`已选 ${topicFilters.size} 类`:'全部类别';}
  function dailyUploadChart(byDay){const days=Array.from({length:30},(_,i)=>{const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()-(29-i));const key=localDate(date);return {key,count:byDay.get(key)||0};});const max=Math.max(1,...days.map(day=>day.count));const total=days.reduce((sum,day)=>sum+day.count,0);return `<section class="daily-chart" aria-label="近 30 天每日上传记录数量"><div class="chart-heading"><div><h3>每日上传</h3><p>近 30 天 · 含错题与笔记</p></div><span>${total} 条新记录</span></div><div class="daily-bars" data-overview-plot role="img" aria-label="${days.map(day=>`${day.key}：${day.count} 道`).join('；')}">${days.map((day,i)=>`<div class="daily-day" data-chart-hint="${day.key} · ${day.count} 条"><div class="daily-bar-track"><span class="daily-bar ${day.count?'has-data':''}" style="height:${day.count?Math.max(8,Math.round(day.count/max*100)):3}%"></span></div><span class="daily-tick">${i===0||i===9||i===19||i===29?esc(day.key.slice(5)):''}</span></div>`).join('')}<span class="overview-chart-tooltip" aria-hidden="true" hidden></span></div></section>`;}
  // Two different situations, two different messages: a subject that holds no
  // questions at all needs an entry point, not advice about filters.
  function hasActiveFilter(){
    return !!(query||topicFilters.size||kindFilter||statusFilter||dateFrom||dateTo||todayMode);
  }
  function emptyStateHTML(){
    const name=selectedSubject?subject(selectedSubject).name:'这里';
    if(!state.questions.some(q=>q.subject===selectedSubject)){
      return `<div class="empty-state"><div class="empty-icon">${icon('book')}</div><h3>${esc(name)}还没有错题</h3><p>录入第一道题后，可以在这里勾选并打印。</p><button type="button" class="primary empty-cta" data-action="add">${icon('plus')}录入第一道${esc(name)}错题</button></div>`;
    }
    if(hasActiveFilter()){
      return `<div class="empty-state"><div class="empty-icon">${icon('search')}</div><h3>没有符合筛选条件的题目</h3><p>${esc(name)}共有 ${state.questions.filter(q=>q.subject===selectedSubject).length} 道题，换个条件或清空筛选再看看。</p><button type="button" class="secondary empty-cta" data-action="reset-filter">${icon('rotate')}重置筛选</button></div>`;
    }
    return `<div class="empty-state"><div class="empty-icon">${icon('book')}</div><h3>还没有错题</h3><p>录入第一道题后，可以在这里勾选并打印。</p><button type="button" class="primary empty-cta" data-action="add">${icon('plus')}录入错题</button></div>`;
  }
  function paginateQuestions(items,page){
    const pageSize=10;
    const pageCount=Math.max(1,Math.ceil(items.length/pageSize));
    const pageNumber=Math.min(page,pageCount);
    return {pageNumber,pageCount,pageItems:items.slice((pageNumber-1)*pageSize,pageNumber*pageSize)};
  }
  function subjectPieChart(counts){
    const heading='<div class="chart-heading"><div><h3>按学科统计</h3><p>各学科错题数量与占比</p></div></div>';
    const palette=['#4a89d4','#9ec5ed','#7392b7','#c0d9f0','#acc2d8','#627b99'];
    const rows=subjects.map((subject,index)=>({
      name:subject.name,count:counts.get(subject.id)||0,color:palette[index]
    }));
    const total=rows.reduce((sum,row)=>sum+row.count,0);
    if(!total)return '<section class="category-chart">'+heading+'<p class="chart-empty">录入错题后会显示学科统计</p></section>';
    let end=0;
    const point=angle=>[50+50*Math.sin(angle),50-50*Math.cos(angle)].join(' ');
    const slices=rows.filter(row=>row.count>0).map(row=>{
      const start=end;
      end+=row.count;
      const label=esc(row.name+' · '+row.count+' 道 · '+(100*row.count/total).toFixed(1)+'%');
      const hint=`data-chart-hint="${label}"`;
      if(row.count===total)return `<circle cx="50" cy="50" r="50" fill="${row.color}" ${hint}/>`;
      const path=`M 50 50 L ${point(2*Math.PI*start/total)} A 50 50 0 ${row.count>total/2?1:0} 1 ${point(2*Math.PI*end/total)} Z`;
      return `<path d="${path}" fill="${row.color}" ${hint}/>`;
    }).join('');
    const legend=rows.map(row=>`<li><i aria-hidden="true" style="background:${row.color}"></i><span>${esc(row.name)}</span><b>${row.count} 道</b><span class="subject-pie-percent">${(100*row.count/total).toFixed(1)}%</span></li>`).join('');
    return `<section class="category-chart">${heading}<div class="subject-pie-plot" data-overview-plot><svg class="subject-pie" viewBox="0 0 100 100" aria-hidden="true">${slices}</svg><span class="overview-chart-tooltip" aria-hidden="true" hidden></span></div><ul class="subject-pie-legend">${legend}</ul></section>`;
  }
  function updateOverviewChartTooltip(event){
    const target=event.type==='pointermove'?event.target.closest('[data-chart-hint]'):null;
    const activePlot=target?.closest('[data-overview-plot]');
    for(const plot of event.currentTarget.querySelectorAll('[data-overview-plot]')){
      const tooltip=plot.querySelector('.overview-chart-tooltip');
      tooltip.hidden=plot!==activePlot;
      if(plot!==activePlot)continue;
      const hint=target.dataset.chartHint;
      if(tooltip.textContent!==hint)tooltip.textContent=hint;
      const gap=12, edge=8;
      const bounds=plot.getBoundingClientRect();
      const width=tooltip.offsetWidth, height=tooltip.offsetHeight;
      const viewportWidth=document.documentElement.clientWidth;
      const viewportHeight=document.documentElement.clientHeight;
      const left=Math.max(edge,Math.min(event.clientX+gap,viewportWidth-width-edge));
      const below=event.clientY+gap;
      const top=below+height<=viewportHeight-edge?below:Math.max(edge,event.clientY-gap-height);
      tooltip.style.left=(left-bounds.left-plot.clientLeft)+'px';
      tooltip.style.top=(top-bounds.top-plot.clientTop)+'px';
    }
  }
  $('overview').addEventListener('pointermove',updateOverviewChartTooltip);
  $('overview').addEventListener('pointerleave',updateOverviewChartTooltip);
  function renderOverview(){
    const overview=$('overview');
    overview.hidden=!!selectedSubject;
    if(selectedSubject)return;
    const {bySubject,wrongBySubject,topicCounts,topics,byDay}=summarizeLibrary();
    const maxTopic=topics[0]?.count||1;
    overview.innerHTML=`${dailyUploadChart(byDay)}<div class="overview-breakdown"><section class="category-chart"><div class="chart-heading"><div><h3>错题类别</h3><p>按专题统计错题数量</p></div><span>${topicCounts.size} 个类别</span></div>${topics.length?`<div class="chart-rows">${topics.map(x=>`<div class="chart-row"><span class="chart-subject">${subject(x.subject).name}</span><span class="chart-topic" title="${esc(x.topic)}">${esc(x.topic)}</span><span class="chart-track"><i style="width:${Math.max(8,Math.round(x.count/maxTopic*100))}%"></i></span><b>${x.count}</b></div>`).join('')}</div>`:'<p class="chart-empty">录入题目后会显示类别统计</p>'}</section>${subjectPieChart(wrongBySubject)}</div><div class="overview-grid">${subjects.map(s=>`<button data-subject="${s.id}" class="overview-card"><span>${icon(s.icon)} ${s.name}</span><strong>${bySubject.get(s.id)||0}</strong><small>查看题目 →</small></button>`).join('')}</div>`;
  }
  function questionCardHTML(q,order){
    const s=subject(q.subject),selected=order>0;
    const answerId='list-answer-'+esc(q.id);
    const answerToggle=q.answer?`<button type="button" class="card-answer-toggle" aria-label="查看本题答案" aria-expanded="false" aria-controls="${answerId}">${icon('eye')}</button>`:'';
    return `<article class="question-card ${selected?'selected':''}"><div class="card-top"><label class="question-select"><input type="checkbox" data-select-id="${esc(q.id)}" aria-label="选择题目：${esc(NoteSchema.topicName(q.subject,q.topic))}" ${selected?'checked':''}><span>本次打印</span>${order?`<em class="selection-order">第 ${order} 题</em>`:``}</label><div class="tags"><span class="tag subject" style="${style(s)}">${s.name}</span><span class="tag entry-kind-tag">${q.kind==='note'?'笔记':'错题'}</span>${NoteSchema.questionSource(q)?`<span class="tag entry-kind-tag">${esc(NoteSchema.questionSource(q))}</span>`: ''}<span class="topic-tag" title="${esc(NoteSchema.topicName(q.subject,q.topic))}">${esc(NoteSchema.topicName(q.subject,q.topic))}</span></div><span class="card-status ${q.mastered?'mastered':''}">${q.mastered?'✓ 已掌握':'○ 待复习'}</span></div><div class="question-text">${richQuestion(q)}${questionOptionsHTML(q)}</div>${q.answer?`<div class="card-answer" id="${answerId}" tabindex="0"><b>答案</b><span class="card-answer-content">${richQuestion(q,'answer')}</span><span class="card-answer-placeholder">移到此处查看</span></div>`:''}<div class="card-bottom"><small>${q.demo?'示例题 · ':''}上传于 ${q.createdAt?new Date(q.createdAt).toLocaleDateString('zh-CN'):''}</small><div class="card-actions">${answerToggle}<button type="button" class="review-toggle" data-action="toggle-solution" data-id="${esc(q.id)}" aria-expanded="false" aria-controls="solution-${esc(q.id)}" title="展开或收起解析">${icon('book')}<span>解析</span><i class="chevron" aria-hidden="true"></i></button><label class="mastery-switch" title="点一下切换已掌握"><input type="checkbox" role="switch" class="mastery-toggle" data-mastery-id="${esc(q.id)}" aria-label="${esc(NoteSchema.topicName(q.subject,q.topic))}：已掌握" ${q.mastered?'checked':''}><span class="mastery-track" aria-hidden="true"></span><span class="mastery-label">${q.mastered?'已掌握':'待复习'}</span></label><button data-action="edit" data-id="${esc(q.id)}">${icon('edit')}编辑</button><button data-action="delete" data-id="${esc(q.id)}" class="delete" aria-label="删除题目">${icon('trash')}</button></div></div><div class="card-solution" id="solution-${esc(q.id)}" hidden><div class="solution-body">${solutionHTML(q)}</div></div></article>`;
  }
  function renderQuestionPage(pageItems){
    const list=$('question-list');
    if(!selectedSubject){list.innerHTML='';return;}
    const selectionOrder=new Map([...selectedIds].map((id,index)=>[id,index+1]));
    list.innerHTML=pageItems.length?pageItems.map(q=>questionCardHTML(q,selectionOrder.get(q.id)||0)).join(''):emptyStateHTML();
  }
  function renderQuestionPagination(pageCount,itemCount){
    $('question-pagination').innerHTML=selectedSubject&&pageCount>1?`<button type="button" data-page="${currentPage-1}" ${currentPage===1?'disabled':''}>上一页</button><span>第 ${currentPage} / ${pageCount} 页 · 共 ${itemCount} 道</span><button type="button" data-page="${currentPage+1}" ${currentPage===pageCount?'disabled':''}>下一页</button>`:'';
  }

  // 卡片内展开的解析内容：解析 + 方程式 + 备注
  function solutionHTML(q){
    const parts=[];
    if(q.explanation)parts.push(`<section><h4>解析</h4><div>${richQuestion(q,'explanation')}</div></section>`);
    if(q.equation)parts.push(`<section><h4>方程式</h4><div>${richQuestion(q,'equation')}</div></section>`);
    if(q.notes)parts.push(`<section><h4>备注</h4><div>${richQuestion(q,'notes')}</div></section>`);
    return parts.length?parts.join(''):'<p class="solution-empty">这道题还没有填写解析。</p>';
  }
  // 页码写入地址栏，刷新或分享链接后可恢复
  function syncPageInURL(){
    if(!selectedSubject)return;
    const url=new URL(location.href);
    if(currentPage>1)url.searchParams.set('page',String(currentPage));
    else url.searchParams.delete('page');
    const next=url.pathname+(url.search?url.search:'');
    if(next!==location.pathname+location.search)history.replaceState(history.state,'',next);
  }
  function readPageFromURL(){
    const value=Number(new URL(location.href).searchParams.get('page'));
    return Number.isFinite(value)&&value>0?Math.floor(value):1;
  }
  let currentFilteredItems=[];
  function renderList(items=filtered(),refreshPreview=true){
    currentFilteredItems=items;
    for(const button of $('entry-kind-filter').querySelectorAll('[data-entry-kind]')){
      const active=button.dataset.entryKind===kindFilter;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    }
    const {pageNumber,pageCount,pageItems}=paginateQuestions(items,currentPage);
    currentPage=pageNumber;
    $('collection-title').textContent=selectedSubject?'题目筛选':'题库概况 · '+state.questions.length+' 条记录';
    $('collection-count').textContent=selectedSubject?items.length+' 道':'';
    renderOverview();
    renderQuestionPage(pageItems);
    renderQuestionPagination(pageCount,items.length);
    renderSelection(items);
    if(refreshPreview)schedulePreview();
  }
  $('question-pagination').onclick=e=>{const button=e.target.closest('[data-page]');if(!button||button.disabled)return;currentPage=Number(button.dataset.page);syncPageInURL();renderList(currentFilteredItems,false);if(mobileLayout.matches)$('question-list').scrollIntoView({block:'start'});};

  /* ===== 30-mascot.js ===== */
// 侧栏比格多栋表情与点击动效。
  const mascotReactions=[
    {motion:'original',file:'brand-dog.png',clickFile:'brand-dog-wave.png',name:'挥拳的比格多栋',src:'/brand-dog.png'},
    {motion:'smug',file:'beagle-smug.png',name:'得意的比格多栋'},
    {motion:'sad',file:'beagle-sad.png',name:'委屈的比格多栋'},
    {motion:'pleading',file:'beagle-pleading.png',name:'撒娇的比格多栋'},
    {motion:'crying',file:'beagle-crying.png',name:'爆哭的比格多栋'}
  ];
  function initHomeMascot(){
    const button=$('home-mascot'),image=$('home-mascot-image');
    const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);
    const reaction=mascotReactions[bytes[0]%mascotReactions.length];
    button.dataset.motion=reaction.motion;image.src=reaction.src||('/mascots/'+reaction.file);image.alt=reaction.name;window.currentMascotSrc=image.src;
    button.setAttribute('aria-label',reaction.name+'，点击播放动效');
    button.onclick=()=>{
      button.classList.remove('is-playing');void button.offsetWidth;button.classList.add('is-playing');
      if(!reaction.clickFile)return;
      if(button._mascotTimer)clearTimeout(button._mascotTimer);
      const base=reaction.src||('/mascots/'+reaction.file),wave='/'+reaction.clickFile;
      image.src=wave;let frames=0;
      const reset=()=>{image.src=base;button._mascotTimer=null;};
      const tick=()=>{if(frames>=6){reset();return;}image.src=frames%2?base:wave;frames++;button._mascotTimer=setTimeout(tick,100);};
      button._mascotTimer=setTimeout(tick,100);
    };
    button.addEventListener('animationend',e=>{if(e.target===button)button.classList.remove('is-playing');});
  }

  /* ===== 40-selection.js ===== */
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

  /* ===== 50-editor.js ===== */
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

  /* ===== 52-image-processing.js ===== */
// 本地题图处理：共享预览和导出的旋转、裁切及色调计算。
  function drawProcessedImage(canvas,image,settings,maxEdge,maxPixels){
    const radians=(settings.turn+settings.angle)*Math.PI/180;
    const cosine=Math.abs(Math.cos(radians)),sine=Math.abs(Math.sin(radians));
    const width=image.naturalWidth,height=image.naturalHeight;
    const rotatedWidth=width*cosine+height*sine,rotatedHeight=width*sine+height*cosine;
    const {left,right,top,bottom}=settings.crop;
    const cropWidth=rotatedWidth*(1-left-right),cropHeight=rotatedHeight*(1-top-bottom);
    const scale=Math.min(1,maxEdge/Math.max(cropWidth,cropHeight),Math.sqrt(maxPixels/(cropWidth*cropHeight)));
    canvas.width=Math.max(1,Math.round(cropWidth*scale));
    canvas.height=Math.max(1,Math.round(cropHeight*scale));
    const context=canvas.getContext('2d',{willReadFrequently:true,alpha:false});
    if(!context)throw Error('当前浏览器无法处理图片。');
    context.fillStyle='#fff';
    context.fillRect(0,0,canvas.width,canvas.height);
    context.save();
    context.scale(canvas.width/cropWidth,canvas.height/cropHeight);
    context.translate(rotatedWidth*(0.5-left),rotatedHeight*(0.5-top));
    context.rotate(radians);
    context.imageSmoothingQuality='high';
    context.drawImage(image,-width/2,-height/2,width,height);
    context.restore();
    if(!settings.gray&&!settings.contrast)return;
    const bitmap=context.getImageData(0,0,canvas.width,canvas.height);
    const pixels=bitmap.data;
    const factor=settings.contrast>=0?1+settings.contrast/50:1+settings.contrast/100;
    const tone=Uint8ClampedArray.from({length:256},(_,value)=>(value-128)*factor+128);
    for(let index=0;index<pixels.length;index+=4){
      if(settings.gray){
        const gray=Math.round(.2126*pixels[index]+.7152*pixels[index+1]+.0722*pixels[index+2]);
        pixels[index]=pixels[index+1]=pixels[index+2]=tone[gray];
      }else{
        pixels[index]=tone[pixels[index]];
        pixels[index+1]=tone[pixels[index+1]];
        pixels[index+2]=tone[pixels[index+2]];
      }
    }
    context.putImageData(bitmap,0,0);
  }

  function initImageProcessing(){
    const prefix='image-process-';
    const element=name=>$(prefix+name);
    const dialog=element('dialog');
    if(!dialog)return;
    const canvas=element('canvas'),cropBox=element('crop-box'),apply=element('apply');
    const controls=element('controls'),previewToggle=element('preview-toggle');
    const sides=['left','right','top','bottom'];
    const opposite={left:'right',right:'left',top:'bottom',bottom:'top'};
    const fullImage=()=>({left:0,right:0,top:0,bottom:0});
    let job=null,settings,showCrop=false,drag=null,frame=0,applying=false;

    function updateControls(){
      const {angle,contrast,crop,gray,turn}=settings;
      element('angle').value=angle;
      element('angle-text').textContent=angle+'°';
      element('contrast').value=contrast;
      element('contrast-text').textContent=contrast>0?'+'+contrast:String(contrast);
      element('gray').checked=gray;
      for(const side of sides){
        const input=element('crop-'+side);
        input.max=Math.floor((.95-crop[opposite[side]])*100+1e-8);
        input.value=Math.round(crop[side]*100);
      }
      previewToggle.textContent=showCrop?'返回裁切':'预览裁切';
      previewToggle.setAttribute('aria-pressed',String(showCrop));
      canvas.classList.toggle('crop-enabled',!showCrop);
      apply.disabled=!job?.ready||applying||!(turn||angle||contrast||gray||sides.some(side=>crop[side]));
    }

    function renderCropBox(){
      cropBox.hidden=showCrop||!sides.some(side=>settings.crop[side]);
      for(const side of sides)cropBox.style[side]=settings.crop[side]*100+'%';
    }

    function requestPreview(){
      cancelAnimationFrame(frame);
      const target=job;
      frame=requestAnimationFrame(()=>{
        if(job!==target||!target?.ready)return;
        try{
          drawProcessedImage(canvas,target.image,{...settings,crop:showCrop?settings.crop:fullImage()},1000,750000);
          renderCropBox();
        }catch(error){
          element('status').textContent=error.message;
        }
      });
    }

    function reset(){
      settings={turn:0,angle:0,contrast:0,gray:false,crop:fullImage()};
      showCrop=false;
      drag=null;
      updateControls();
      if(job?.ready)requestPreview();
    }

    async function open(index){
      if(editorImages.busy||applying||dialog.open)return;
      const item=editorImages.items[index];
      if(!item)return;
      const image=new Image();
      const target={index,item,image,ready:false};
      job=target;
      canvas.width=canvas.height=1;
      cropBox.hidden=true;
      controls.inert=true;
      element('name').textContent=editorImages.label(index);
      element('status').textContent='正在读取图片…';
      reset();
      dialog.showModal();
      try{
        image.src=editorImages.source(item);
        await image.decode();
        if(job!==target||!dialog.open)return;
        target.ready=true;
        controls.inert=false;
        element('status').textContent='';
        requestPreview();
      }catch{
        if(job===target)element('status').textContent='无法读取这张图片，请关闭后重试。';
      }
    }

    function change(){
      updateControls();
      requestPreview();
    }

    function cropPoint(event){
      const bounds=canvas.getBoundingClientRect();
      const clamp=value=>Math.max(0,Math.min(1,value));
      return {x:clamp((event.clientX-bounds.left)/bounds.width),y:clamp((event.clientY-bounds.top)/bounds.height)};
    }

    function moveCrop(event){
      if(!drag||drag.pointer!==event.pointerId)return;
      const point=cropPoint(event);
      if(Math.abs(point.x-drag.start.x)<.05||Math.abs(point.y-drag.start.y)<.05)return;
      settings.crop={left:Math.min(drag.start.x,point.x),right:1-Math.max(drag.start.x,point.x),
        top:Math.min(drag.start.y,point.y),bottom:1-Math.max(drag.start.y,point.y)};
      renderCropBox();
      updateControls();
    }

    async function applyImage(){
      if(!job?.ready||applying||apply.disabled)return;
      const target=job;
      applying=true;
      controls.inert=true;
      updateControls();
      element('status').textContent='正在生成图片…';
      try{
        const output=document.createElement('canvas');
        drawProcessedImage(output,target.image,settings,4200,12000000);
        const encode=(type,quality)=>new Promise(resolve=>output.toBlob(resolve,type,quality));
        let blob=await encode('image/png');
        if(!blob||blob.size>10*1024*1024)blob=await encode('image/jpeg',.92);
        if(!blob||blob.size>10*1024*1024)throw Error('处理后的图片过大，请缩小裁切区域后重试。');
        if(editorImages.busy||editorImages.items[target.index]!==target.item)throw Error('这张题图已变化，请重新打开后处理。');
        const extension=blob.type==='image/jpeg'?'jpg':'png';
        await editorImages.add(new File([blob],'processed.'+extension,{type:blob.type}),target.index,{preserveName:true});
        dialog.close();
      }catch(error){
        element('status').textContent=error.message;
      }finally{
        applying=false;
        if(dialog.open){
          controls.inert=false;
          updateControls();
        }
      }
    }

    $('editor-image-list').addEventListener('click',event=>{
      const button=event.target.closest('[data-process-image]');
      if(button)open(Number(button.dataset.processImage));
    });
    const close=()=>{if(!applying)dialog.close();};
    element('close').onclick=element('cancel').onclick=close;
    dialog.addEventListener('cancel',event=>{if(applying)event.preventDefault();});
    dialog.addEventListener('close',()=>{
      if(dialog.open)return;
      cancelAnimationFrame(frame);
      job=null;
      drag=null;
      canvas.width=canvas.height=1;
    });
    for(const [name,amount] of [['left',-90],['right',90]]){
      element(name).onclick=()=>{
        settings.turn=(settings.turn+amount)%360;
        settings.crop=fullImage();
        showCrop=false;
        change();
      };
    }
    for(const name of ['angle','contrast']){
      element(name).oninput=event=>{settings[name]=Number(event.target.value);change();};
    }
    element('gray').onchange=event=>{settings.gray=event.target.checked;change();};
    for(const side of sides){
      element('crop-'+side).onchange=event=>{
        const maximum=.95-settings.crop[opposite[side]];
        settings.crop[side]=Math.max(0,Math.min(maximum,(Number(event.target.value)||0)/100));
        change();
      };
    }
    element('reset').onclick=reset;
    previewToggle.onclick=()=>{showCrop=!showCrop;change();};
    apply.onclick=applyImage;
    canvas.addEventListener('pointerdown',event=>{
      if(!job?.ready||showCrop||applying||drag||event.button!==0)return;
      canvas.setPointerCapture(event.pointerId);
      drag={pointer:event.pointerId,start:cropPoint(event)};
    });
    canvas.addEventListener('pointermove',moveCrop);
    canvas.addEventListener('pointerup',event=>{moveCrop(event);if(drag?.pointer===event.pointerId)drag=null;});
    canvas.addEventListener('lostpointercapture',event=>{if(drag?.pointer===event.pointerId)drag=null;});
  }
  initImageProcessing();

  /* ===== 55-preview.js ===== */
// 打印预览与保存设置的联动，以及富文本字段的定位工具。
  let previewJob, optimizePrintOrder=false;
  const optimizeButton=$('optimize-print-order');
  function updatePreview(force=false,showLastPage=false){
    clearTimeout(previewTimer);
    const items=editing?[draft()]:selectedSubject?selectedQuestions():[];
    const optimize=!editing&&items.length>1&&optimizePrintOrder;
    optimizeButton.disabled=editing||items.length<2;
    optimizeButton.setAttribute('aria-pressed',String(optimize));
    optimizeButton.textContent=optimize?'恢复勾选顺序':'自动调整顺序';
    const title=editing?subject($('f-subject').value).name+'错题专题集':titleFor();
    const key=JSON.stringify([title,state.settings,optimize,items.map(({id,subject,topic,question,answer,answerType,options,explanation,notes,equation,images})=>[
      id,subject,topic,question,answer,answerType,options,explanation,notes,equation,images
    ])]);
    if(!force&&previewJob?.key===key){
      if(showLastPage){
        if(previewJob.pending)previewJob.showLastPage=true;
        else Printer.last();
      }
      return previewJob.promise;
    }

    const job={
      key,pending:true,
      showLastPage:showLastPage||(previewJob?.key===key&&previewJob.pending&&previewJob.showLastPage)
    };
    previewJob=job;
    job.promise=Printer.render(items,state.settings,title,Object.fromEntries(subjects.map(s=>[s.id,s.name])),optimize).then(()=>{
      job.pending=false;
      if(previewJob===job&&job.showLastPage)Printer.last();
    }).catch(error=>{
      if(previewJob!==job)return;
      previewJob=null;
      $('preview-meta').textContent='预览失败：'+error.message;
      $('print-btn').disabled=true;
    });
    return job.promise;
  }
  optimizeButton.onclick=()=>{
    optimizePrintOrder=!optimizePrintOrder;
    updatePreview();
  };
  $('prev-page').onclick=()=>Printer.previous();$('next-page').onclick=()=>Printer.next();window.addEventListener('resize',Printer.scale);window.addEventListener('resize',()=>{if(selectedSubject)renderTopics();});$('print-btn').onclick=async()=>{await updatePreview();if(!$('print-btn').disabled)window.print();};
  const previewCanvas = $('preview-canvas');
  const previewDialog = $('pdf-preview-dialog');
  const previewDialogBody = $('pdf-preview-dialog-body');
  const closePreviewButton = $('pdf-preview-close');

  if (previewCanvas && previewDialog && previewDialogBody && closePreviewButton) {
    function fitEnlargedPage() {
      const holder = previewDialogBody.firstElementChild;
      if (!previewDialog.open || !holder) return;

      const paper = holder.firstElementChild;
      const width = Math.min(paper.offsetWidth, previewDialogBody.clientWidth);
      const scale = width / paper.offsetWidth;
      holder.style.width = width + 'px';
      holder.style.height = Math.ceil(paper.offsetHeight * scale) + 'px';
      paper.style.transform = 'scale(' + scale + ')';
    }

    const previousEnlargedPage = $('pdf-preview-prev');
    const nextEnlargedPage = $('pdf-preview-next');

    function refreshEnlargedPage() {
      if (!previewDialog.open) return;
      const paper = previewCanvas.querySelector('.paper-page');
      if (!paper) { previewDialog.close(); return; }

      const holder = document.createElement('div');
      holder.className = 'pdf-preview-sheet';
      holder.append(paper.cloneNode(true));
      previewDialogBody.replaceChildren(holder);
      $('pdf-preview-page').textContent = $('page-indicator').textContent;
      previousEnlargedPage.disabled = $('prev-page').disabled;
      nextEnlargedPage.disabled = $('next-page').disabled;
      fitEnlargedPage();
      previewDialogBody.scrollTop = 0;
    }

    function enlargeCurrentPage() {
      if (previewDialog.open || !previewCanvas.querySelector('.paper-page')) return;
      previewDialog.showModal();
      refreshEnlargedPage();
    }

    previousEnlargedPage.addEventListener('click', () => Printer.previous());
    nextEnlargedPage.addEventListener('click', () => Printer.next());
    previewCanvas.addEventListener('printpreviewpagechange', refreshEnlargedPage);

    previewCanvas.addEventListener('click', event => {
      if (event.target.closest('.paper-page') && !event.target.closest('[data-image]')) {
        enlargeCurrentPage();
      }
    });
    closePreviewButton.addEventListener('click', () => previewDialog.close());
    previewDialog.addEventListener('click', event => {
      if (event.target === previewDialog) previewDialog.close();
    });
    previewDialog.addEventListener('close', () => {
      if (!previewDialog.open) previewDialogBody.replaceChildren();
    });
    window.addEventListener('resize', fitEnlargedPage);
  }

    function editorFields(){return ['f-question','f-answer','f-explanation','f-notes'].map(id=>$(id)).filter(Boolean);}
  let lastField=null;
  function lastFocusedField(){
    const fields=editorFields();
    return fields.find(el=>el===document.activeElement)||(lastField&&fields.includes(lastField)?lastField:null)||$('f-question');
  }
  // 图片编辑器会把文字字段替换成 contenteditable 层（#rich-xxx），文字和选区都在那一层里。
  function richEditorFor(field){
    if(!field)return null;
    const name=field.id.replace(/^f-/,'');
    return document.getElementById('rich-'+name);
  }
  function richRangeIn(editor){
    if(!editor)return null;
    const selection=window.getSelection();
    if(!selection||!selection.rangeCount)return null;
    const range=selection.getRangeAt(0);
    if(!editor.contains(range.commonAncestorContainer))return null;
    return range;
  }
  function unwrapRich(editor,range,open,close){

  /* ===== 60-rich-text.js ===== */
// 轻量富文本：加粗（**…**）与下划线（__…__）的插入与取消，
// 同时支持 contenteditable 编辑层和普通 textarea 两种字段形态。
    if(!range)return false;
    const text=range.toString();
    if(text.startsWith(open)&&text.endsWith(close)&&text.length>=open.length+close.length){
      const inner=text.slice(open.length,text.length-close.length);
      range.deleteContents();
      range.insertNode(document.createTextNode(inner));
      return true;
    }
    // The markers are plain text, so look just outside the selection for them.
    const node=range.startContainer;
    if(node.nodeType!==3)return false;
    const s=range.startOffset,e=range.endOffset,full=node.data;
    if(full.slice(s-open.length,s)===open&&full.slice(e,e+close.length)===close){
      const before=full.slice(0,s-open.length),after=full.slice(e+close.length),inner=full.slice(s,e);
      node.data=before+inner+after;
      const sel=window.getSelection();
      const r=document.createRange();r.setStart(node,before.length);r.setEnd(node,before.length+inner.length);
      sel.removeAllRanges();sel.addRange(r);
      return true;
    }
    const parent=node.parentNode;
    const host=parent?.closest?.('strong,u');
    if(host&&editor.contains(host)){
      host.replaceWith(document.createTextNode(host.textContent));
      return true;
    }
    return false;
  }

  function markRich(editor,range,open,close){
    if(!range)return false;
    const selected=range.toString();
    if(!selected)return false;
    const node=document.createTextNode(open+selected+close);
    range.deleteContents();
    range.insertNode(node);
    const selection=window.getSelection();
    const after=document.createRange();
    after.setStartAfter(node);after.collapse(true);
    selection.removeAllRanges();selection.addRange(after);
    return true;
  }
  function hasRichWrap(editor,range,open,close){
    if(!range)return false;
    const text=range.toString();
    if(text.startsWith(open)&&text.endsWith(close))return true;
    const node=range.startContainer;
    if(node.nodeType===3){
      const s=range.startOffset,e=range.endOffset,full=node.data;
      if(full.slice(s-open.length,s)===open&&full.slice(e,e+close.length)===close)return true;
      return false;
    }
    const parent=node.parentNode;
    return !!parent?.closest?.('strong,u');
  }
  function hasWrapAround(field,open,close){
    const start=field.selectionStart??0,end=field.selectionEnd??0;
    if(start===end)return false;
    const value=field.value;
    return (value.slice(start-open.length,start)===open&&value.slice(end,end+close.length)===close)||(value.slice(start,end).startsWith(open)&&value.slice(start,end).endsWith(close));
  }
  function markSelection(field,open,close){
    const start=field.selectionStart??field.value.length,end=field.selectionEnd??field.value.length;
    if(start===end)return false;
    if(hasWrapAround(field,open,close))return false;
    field.setRangeText(open+field.value.slice(start,end)+close,start,end,'select');
    field.focus();
    field.dispatchEvent(new Event('input',{bubbles:true}));
    return true;
  }
  function unwrapSelection(field,open,close){
    const start=field.selectionStart??0,end=field.selectionEnd??0;
    if(start===end)return false;
    const value=field.value;
    const outer=value.slice(start-open.length,start)===open&&value.slice(end,end+close.length)===close;
    const inner=value.slice(start,end).startsWith(open)&&value.slice(start,end).endsWith(close);
    if(outer)field.setRangeText(value.slice(start,end),start-open.length,end+close.length,'select');
    else if(inner)field.setRangeText(value.slice(start+open.length,end-close.length),start,end,'select');
    else return false;
    field.focus();
    field.dispatchEvent(new Event('input',{bubbles:true}));
    return true;
  }
  function syncRichInput(field,editor){
    if(!field||!editor)return;
    editor.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function applyMark(kind,targetField){
    const marks={bold:['**','**'],underline:['__','__']};
    const [open,close]=marks[kind]||['',''];
    const name=kind==='bold'?'加粗':'下划线';
    const field=targetField?$('f-'+targetField):lastFocusedField();
    if(!field)return;
    if(targetField)editorImages.focusField(targetField);
    const editor=richEditorFor(field);
    const range=richRangeIn(editor);
    if(editor&&range){
      const removing=hasRichWrap(editor,range,open,close);
      const changed=removing?unwrapRich(editor,range,open,close):markRich(editor,range,open,close);
      if(changed){syncRichInput(field,editor);toast((removing?'已取消':'已应用')+name);}
      else toast(range.toString()?'选中文字没有'+name+'格式':'请先选中要设置的文字，再点按钮');
      return;
    }
    if(field.selectionStart===field.selectionEnd){toast('请先选中要设置的文字，再点按钮');field.focus();return;}
    const removing=hasWrapAround(field,open,close);
    const changed=removing?unwrapSelection(field,open,close):markSelection(field,open,close);
    toast(changed?(removing?'已取消':'已应用')+name:('选中文字没有'+name+'格式'));
  }
  for(const button of document.querySelectorAll('[data-wrap]')){
    button.addEventListener('mousedown',e=>e.preventDefault());
    button.onclick=()=>applyMark(button.dataset.wrap,button.closest('[data-tool-field]')?.dataset.toolField);
  }
  document.addEventListener('focusin',e=>{if(e.target.id&&e.target.id.startsWith('f-'))lastField=e.target;});

  for(const button of document.querySelectorAll('[data-text-color]')){
    button.addEventListener('mousedown',e=>e.preventDefault());
    button.onclick=()=>{
      const field=button.closest('[data-tool-field]').dataset.toolField;
      if(!editorImages.colorSelection(field,button.dataset.textColor))toast('请选择文字或完整公式后再设置颜色');
    };
  }

  /* ===== 65-review.js ===== */
// 随机抽题和复习页导航。
  function renderReviewRoute(){
    const active=location.pathname==='/review';
    $('review-panel').hidden=!active;
    $('library-workbench').hidden=active;
    $('review-nav').classList.toggle('active',active);
    if(active){
      $('review-nav').setAttribute('aria-current','page');
      $('subject-nav').querySelector('.active')?.classList.remove('active');
      document.title='随机复习 · 比格多栋';
    }else $('review-nav').removeAttribute('aria-current');
    return active;
  }
  function sampleReviewQuestions(pool,count){
    const shuffled=[...pool];
    const limit=Math.min(count,shuffled.length);
    for(let index=0;index<limit;index++){
      const chosen=index+Math.floor(Math.random()*(shuffled.length-index));
      [shuffled[index],shuffled[chosen]]=[shuffled[chosen],shuffled[index]];
    }
    return shuffled.slice(0,limit);
  }
  function reviewAnswerOptions(question){
    if(question.answerType==='judgment')return NoteSchema.judgmentAnswers;
    if(question.answerType==='single-choice')return NoteSchema.optionKeys;
    return [];
  }
  function reviewChoicesHTML(question,choices,selected){
    if(!choices.length)return '';
    const answered=selected!==undefined;
    const singleChoice=question.answerType==='single-choice';
    const rows=choices.map(key=>{
      const isSelected=selected===key;
      const correct=answered&&key===question.answer;
      const state=correct?' correct':isSelected?' incorrect':'';
      const descriptionId='review-option-text-'+key;
      return `<div class="review-choice${state}" data-review-option="${key}">
        <button type="button" class="review-choice-button" aria-pressed="${isSelected}" ${answered?'disabled':''}
          ${singleChoice?`aria-describedby="${descriptionId}"`:''}>${key}</button>
        ${singleChoice?`<div id="${descriptionId}" class="review-choice-text">${richContent(question,question.options[key])}</div>`:''}
        ${correct?'<span class="review-choice-label">正确答案</span>':isSelected?'<span class="review-choice-label">你的选择</span>':''}
      </div>`;
    }).join('');
    const correct=selected===question.answer;
    const result=answered?(correct?'答对了。':'答错了。正确答案是 '+esc(question.answer)+'。'):'';
    return `<div class="review-choices ${singleChoice?'review-single-choice':'review-judgment'}" role="group" aria-label="${singleChoice?'单选题':'判断题'}">${rows}</div>
      <p class="review-answer-feedback ${correct?'correct':'incorrect'}" role="status" tabindex="-1" ${answered?'':'hidden'}>${result}</p>`;
  }
  function reviewQuestionHTML(question,index,selected){
    const choices=reviewAnswerOptions(question);
    const showSolution=!choices.length||selected!==undefined;
    const solutionFields=[['answer','答案'],['explanation','解析'],['equation','方程式'],['notes','备注']];
    const solution=showSolution?solutionFields.filter(([key])=>question[key])
      .map(([key,label])=>`<div><b>${label}</b>${richQuestion(question,key)}</div>`).join(''):'';
    return `<article class="question-card review-card"><h2>第 ${index+1} 题 · ${esc(subject(question.subject).name)} · ${esc(NoteSchema.topicName(question.subject,question.topic))}</h2>
      <div class="question-text">${richQuestion(question)}</div>${reviewChoicesHTML(question,choices,selected)}
      ${solution?`<details class="review-solution"><summary>查看答案和解析</summary>${solution}</details>`:''}</article>`;
  }
  function initReview(){
    const selector=$('review-subject');
    const results=$('review-results');
    const answers=new Map();
    let questions=[],position=0;
    function showQuestion(){
      const current=questions[position];
      $('review-progress').hidden=!current;
      $('review-pagination').hidden=!current;
      results.innerHTML=current?reviewQuestionHTML(current,position,answers.get(current.id)):'';
      if(!current)return;
      const progress=$('review-progress-bar');
      progress.max=questions.length;
      progress.value=position+1;
      $('review-progress-label').textContent=`${position+1} / ${questions.length}`;
      $('review-prev').disabled=position===0;
      $('review-next').disabled=position===questions.length-1;
    }
    results.addEventListener('click',event=>{
      const row=event.target.closest('[data-review-option]');
      const current=questions[position];
      if(!row||!current||answers.has(current.id)||event.target.closest('[data-image]'))return;
      const choice=row.dataset.reviewOption;
      if(!reviewAnswerOptions(current).includes(choice))return;
      answers.set(current.id,choice);
      showQuestion();
      results.querySelector('.review-answer-feedback').focus({preventScroll:true});
    });
    $('review-prev').onclick=()=>{if(position>0){position--;showQuestion();}};
    $('review-next').onclick=()=>{if(position+1<questions.length){position++;showQuestion();}};
    for(const entry of subjects)selector.add(new Option(entry.name,entry.id));
    $('review-nav').addEventListener('click',event=>{
      if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      event.preventDefault();
      if(editing){toast('请先保存或取消当前编辑。');return;}
      if(location.pathname==='/review')return;
      if(selectedSubject)selector.value=selectedSubject;
      history.pushState(null,'','/review');
      selectSubject('',false);
    });
    $('review-form').addEventListener('submit',event=>{
      event.preventDefault();
      if(!ready){toast('请等待本地题库连接。');return;}
      const count=Number($('review-count').value);
      const scope=selector.value;
      const pool=state.questions.filter(question=>question.kind!=='note'&&(!scope||question.subject===scope));
      questions=sampleReviewQuestions(pool,count);
      answers.clear();
      position=0;
      $('review-status').textContent=!questions.length?'所选学科暂无错题。':questions.length<count?`所选范围只有 ${questions.length} 道错题，已全部抽出。`:`已随机抽出 ${questions.length} 道题。`;
      showQuestion();
    });
  }

  /* ===== 70-boot.js ===== */
// 事件绑定与启动流程。
document.querySelectorAll('[data-insert]').forEach(b=>b.onclick=()=>{const snippets={fraction:'\\(\\frac{a}{b}\\)',power:'\\(a_n^2\\)',chem:'\\(\\ce{H2O}\\)'};const field=b.closest('[data-tool-field]')?.dataset.toolField;if(field)editorImages.focusField(field);editorImages.insertText(snippets[b.dataset.insert]);});
  function subjectFromPath(){const name=location.pathname.split('/')[1];return subjects.some(s=>s.id===name)?name:'';}
  function routeEditor(){const match=location.pathname.match(/^\/(chemistry|biology|math|physics|chinese|english)\/edit\/(new|[-a-zA-Z0-9_]+)$/);return match?{subject:match[1],id:match[2]}:null;}
  selectedSubject=subjectFromPath();
  const initialPage=readPageFromURL();
  if(location.pathname==='/'||location.pathname==='/index.html')history.replaceState(null,'','/overview');
  document.title=(selectedSubject?subject(selectedSubject).name+'错题':'错题本')+' · 比格多栋';
  window.addEventListener('popstate',()=>{if(editing){persistEditorDraft();closeEditor(false);}selectSubject(subjectFromPath(),false,true);if(typeof syncPageInURL==='function')syncPageInURL();restoreScrollPosition();const route=routeEditor();if(route&&ready){const q=route.id==='new'?null:state.questions.find(q=>q.id===route.id&&q.subject===route.subject);if(q||route.id==='new')openEditor(q,true,false);}});
  $('f-subject').innerHTML=subjects.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');if($('f-mastered')){$('f-mastered').addEventListener('change',syncEditorMasteryLabel);syncEditorMasteryLabel();}
    const missing=Object.keys(structuralIds).filter(id=>!structuralIds[id]);if(missing.length)console.warn('错题本页面缺少元素：'+missing.join('、')+'，请检查 dist/index.html 与 dist/app.js 是否同一版本。');
    initHomeMascot();initReview();icons();syncSettings();renderAll();
  loadLocal().then(()=>{applyDatePreset();syncDateMenu();currentPage=initialPage;renderAll();syncPageInURL();watchScrollPosition();const route=routeEditor();if(!route)return;const q=route.id==='new'?null:state.questions.find(q=>q.id===route.id&&q.subject===route.subject);if(q||route.id==='new')openEditor(q,true,false);});setInterval(()=>loadLocal(),2000);document.fonts.ready.then(()=>updatePreview(true));document.fonts.addEventListener('loadingdone',()=>updatePreview(true));

  /* ===== 75-scroll.js ===== */
// 记忆列表滚动位置：刷新、从编辑页返回时都能回到原处。
const SCROLL_KEY = 'zhixu-scroll';
function scrollStorage() {
  try { return JSON.parse(sessionStorage.getItem(SCROLL_KEY) || '{}'); } catch { return {}; }
}
let scrollPaused = false;
function listScrollTarget() {
  return mobileLayout.matches ? window : document.querySelector('.workspace');
}
function saveScrollPosition(force = false) {
  if ((scrollPaused && !force) || !selectedSubject) return;
  const target = listScrollTarget();
  if (!target) return;
  const all = scrollStorage();
  all[selectedSubject] = { top: Math.round(target===window?window.scrollY:target.scrollTop), at: Date.now() };
  try { sessionStorage.setItem(SCROLL_KEY, JSON.stringify(all)); } catch {}
}
function restoreScrollPosition(instant = true) {
  if (!selectedSubject) return;
  const subjectId = selectedSubject;
  const top = scrollStorage()[subjectId]?.top ?? 0;
  // 数据尚未渲染完时容器不可滚动，稍等一帧让高度就绪
  const apply = () => {
    if(selectedSubject!==subjectId||editing)return;
    listScrollTarget()?.scrollTo({top,behavior:instant?'instant':'smooth'});
  };
  requestAnimationFrame(() => requestAnimationFrame(apply));
}
function watchScrollPosition() {
  const workspace = document.querySelector('.workspace');
  if (!workspace) return;
  let timer = null;
  const onScroll = event => {
    if (scrollPaused || (event.currentTarget===window)!==mobileLayout.matches) return;
    clearTimeout(timer);
    timer = setTimeout(saveScrollPosition, 120);
  };
  workspace?.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  // 离开页面前再存一次，避免防抖未触发
  window.addEventListener('beforeunload', () => saveScrollPosition());
  window.addEventListener('pagehide', () => saveScrollPosition());
}

// 进入编辑页时保存并暂停记录，返回后恢复
function pauseScrollTracking() {
  saveScrollPosition(true);
  scrollPaused = true;
}
function resumeScrollTracking() {
  scrollPaused = false;
}

  /* ===== 76-mobile.js ===== */
// 手机工具栏复用桌面控件，保持原有事件和禁用状态。
const mobileLayout=matchMedia('screen and (max-width: 640px)');
function initMobileLayout(){
  const more=$('mobile-more'),toolbar=$('mobile-toolbar'),openPreview=$('mobile-show-preview');
  const heading=document.querySelector('.right-rail > .heading-tools');
  const controls=$('batch-selection-tools'),reset=$('reset-filter');
  if(!more||!toolbar||!openPreview||!heading||!controls||!reset)return;
  const summary=more.querySelector('summary');
  const moves=[
    [heading,$('mobile-primary-tools')],
    [controls,$('mobile-batch-tools')],
    [reset,$('mobile-batch-tools')]
  ].map(([element,destination])=>({element,destination,parent:element.parentNode,next:element.nextSibling}));

  function setPreview(open){
    document.body.classList.toggle('mobile-preview-open',open);
    openPreview.textContent=open?'收起打印预览':'打印预览与设置';
    openPreview.setAttribute('aria-expanded',String(open));
  }
  function layout(){
    more.open=false;
    setPreview(false);
    for(const {element,destination,parent,next} of moves){
      if(mobileLayout.matches)destination.append(element);
      else parent.insertBefore(element,next);
    }
    if(selectedSubject)renderTopics();
    requestAnimationFrame(Printer.scale);
  }
  openPreview.onclick=()=>{
    const open=!document.body.classList.contains('mobile-preview-open');
    setPreview(open);
    if(open){
      $('mobile-print-panel').scrollIntoView({block:'start'});
      requestAnimationFrame(Printer.scale);
      updatePreview();
    }
  };
  $('mobile-close-preview').onclick=()=>{
    setPreview(false);
    toolbar.scrollIntoView({block:'start'});
    summary.focus({preventScroll:true});
  };
  more.addEventListener('click',event=>{
    if(event.target.closest('button:not(:disabled), a')){
      more.open=false;
      if(event.target.closest('button')!==openPreview||!document.body.classList.contains('mobile-preview-open'))summary.focus({preventScroll:true});
    }
  });
  document.addEventListener('click',event=>{
    if(!more.contains(event.target))more.open=false;
  });
  more.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&more.open){more.open=false;summary.focus();}
  });
  $('subject-nav').addEventListener('click',()=>setPreview(false));
  window.addEventListener('popstate',()=>setPreview(false));
  mobileLayout.addEventListener('change',layout);
  layout();
}
initMobileLayout();

})();
