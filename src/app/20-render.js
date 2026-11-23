// 题库列表、学科导航与首页概览的 HTML 生成。
  function renderNav(){document.body.classList.toggle('subject-selected',!!selectedSubject);document.body.classList.toggle('overview-mode',!selectedSubject);{const t=$('page-title');if(t)t.textContent=selectedSubject?subject(selectedSubject).name+'错题':'错题本';const ti=$('page-title-icon');if(ti)ti.innerHTML=selectedSubject?icon(subject(selectedSubject).icon):'';}const reviewNav=$('review-nav');const counts=s=>state.questions.filter(q=>!s||q.subject===s).length;$('subject-nav').innerHTML=`<button class="nav-item ${selectedSubject?'':'active'}" data-subject=""><span>${icon('book')}题库总览</span><small>${counts('')}</small></button>`+subjects.map(s=>`<button class="nav-item ${selectedSubject===s.id?'active':''}" data-subject="${s.id}"><span>${icon(s.icon)}${s.name}</span><small>${counts(s.id)}</small></button>`).join('');$('subject-nav').append(reviewNav);}
  function renderTopics(){const topics=selectedSubject?subject(selectedSubject).topics:subjects.flatMap(s=>s.topics);topicFilters=new Set([...topicFilters].filter(t=>topics.includes(t)));const options=$('topic-options-filter');options.classList.remove('expanded');options.innerHTML=topics.length?topics.map(t=>`<label class="topic-option"><input type="checkbox" value="${esc(t)}" ${topicFilters.has(t)?'checked':''}><span>${esc(t)}</span></label>`).join(''):'<span class="no-topics">暂无题目类别</span>';const hasMore=options.scrollHeight>options.clientHeight+1;options.classList.toggle('expanded',topicsExpanded);const toggle=$('topic-expand');toggle.hidden=!hasMore;toggle.textContent=topicsExpanded?'收起类别':'展开全部类别';toggle.setAttribute('aria-expanded',String(topicsExpanded));$('topic-summary').textContent=topicFilters.size?`已选 ${topicFilters.size} 类`:'全部类别';}
  function dailyUploadChart(){const days=Array.from({length:30},(_,i)=>{const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()-(29-i));return {key:localDate(date),count:0};});const counts=new Map(days.map(day=>[day.key,day]));for(const q of state.questions){const day=counts.get(localDate(q.createdAt));if(day)day.count++;}const max=Math.max(1,...days.map(day=>day.count));const total=days.reduce((sum,day)=>sum+day.count,0);return `<section class="daily-chart" aria-label="近 30 天每日上传错题数量"><div class="chart-heading"><div><h3>每日上传</h3><p>近 30 天 · 按首次录入日期统计</p></div><span>${total} 道新题</span></div><div class="daily-bars" role="img" aria-label="${days.map(day=>`${day.key}：${day.count} 道`).join('；')}">${days.map((day,i)=>`<div class="daily-day" title="${day.key} · ${day.count} 道"><div class="daily-bar-track"><span class="daily-bar ${day.count?'has-data':''}" style="height:${day.count?Math.max(8,Math.round(day.count/max*100)):3}%"></span></div><span class="daily-tick">${i===0||i===9||i===19||i===29?esc(day.key.slice(5)):''}</span></div>`).join('')}</div></section>`;}
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
  function renderOverview(){
    const overview=$('overview');
    overview.hidden=!!selectedSubject;
    if(selectedSubject)return;
    const topicCounts=new Map();
    for(const q of state.questions){const key=q.subject+'|'+q.topic;const item=topicCounts.get(key)||{subject:q.subject,topic:q.topic,count:0};item.count++;topicCounts.set(key,item);}
    const topics=[...topicCounts.values()].sort((a,b)=>b.count-a.count||a.topic.localeCompare(b.topic,'zh-CN')).slice(0,8);
    const maxTopic=topics[0]?.count||1;
    overview.innerHTML=`${dailyUploadChart()}<section class="category-chart"><div class="chart-heading"><div><h3>错题类别</h3><p>按专题统计题目数量</p></div><span>${topicCounts.size} 个类别</span></div>${topics.length?`<div class="chart-rows">${topics.map(x=>`<div class="chart-row"><span class="chart-subject">${subject(x.subject).name}</span><span class="chart-topic" title="${esc(x.topic)}">${esc(x.topic)}</span><span class="chart-track"><i style="width:${Math.max(8,Math.round(x.count/maxTopic*100))}%"></i></span><b>${x.count}</b></div>`).join('')}</div>`:'<p class="chart-empty">录入题目后会显示类别统计</p>'}</section><div class="overview-grid">${subjects.map(s=>`<button data-subject="${s.id}" class="overview-card"><span>${icon(s.icon)} ${s.name}</span><strong>${state.questions.filter(q=>q.subject===s.id).length}</strong><small>查看题目 →</small></button>`).join('')}</div>`;
  }
  function questionCardHTML(q,order){
    const s=subject(q.subject),selected=order>0;
    return `<article class="question-card ${selected?'selected':''}"><div class="card-top"><label class="question-select"><input type="checkbox" data-select-id="${esc(q.id)}" aria-label="选择题目：${esc(q.topic)}" ${selected?'checked':''}><span>本次打印</span>${order?`<em class="selection-order">第 ${order} 题</em>`:``}</label><div class="tags"><span class="tag subject" style="${style(s)}">${s.name}</span><span class="tag entry-kind-tag">${q.kind==='note'?'笔记':'错题'}</span><span class="topic-tag" title="${esc(q.topic)}">${esc(q.topic)}</span></div><span class="card-status ${q.mastered?'mastered':''}">${q.mastered?'✓ 已掌握':'○ 待复习'}</span></div><div class="question-text">${richQuestion(q)}</div>${q.answer?`<div class="card-answer"><b>答案</b>${richQuestion(q,'answer')}</div>`:''}<div class="card-bottom"><small>${q.demo?'示例题 · ':''}上传于 ${q.createdAt?new Date(q.createdAt).toLocaleDateString('zh-CN'):''}</small><div class="card-actions"><button type="button" class="review-toggle" data-action="toggle-solution" data-id="${esc(q.id)}" aria-expanded="false" aria-controls="solution-${esc(q.id)}" title="展开或收起解析">${icon('book')}<span>解析</span><i class="chevron" aria-hidden="true"></i></button><label class="mastery-switch" title="点一下切换已掌握"><input type="checkbox" role="switch" class="mastery-toggle" data-mastery-id="${esc(q.id)}" aria-label="${esc(q.topic)}：已掌握" ${q.mastered?'checked':''}><span class="mastery-track" aria-hidden="true"></span><span class="mastery-label">${q.mastered?'已掌握':'待复习'}</span></label><button data-action="edit" data-id="${esc(q.id)}">${icon('edit')}编辑</button><button data-action="delete" data-id="${esc(q.id)}" class="delete" aria-label="删除题目">${icon('trash')}</button></div></div><div class="card-solution" id="solution-${esc(q.id)}" hidden><div class="solution-body">${solutionHTML(q)}</div></div></article>`;
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
  function renderList(){
    for(const button of $('entry-kind-filter').querySelectorAll('[data-entry-kind]')){
      const active=button.dataset.entryKind===kindFilter;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    }
    const items=filtered();
    const {pageNumber,pageCount,pageItems}=paginateQuestions(items,currentPage);
    currentPage=pageNumber;
    $('collection-title').textContent=selectedSubject?'题目筛选':'题库概况 · '+state.questions.length+' 条记录';
    $('collection-count').textContent=selectedSubject?items.length+' 道':'';
    renderOverview();
    renderQuestionPage(pageItems);
    renderQuestionPagination(pageCount,items.length);
    renderSelection();
    schedulePreview();
  }
  $('question-pagination').onclick=e=>{const button=e.target.closest('[data-page]');if(!button||button.disabled)return;currentPage=Number(button.dataset.page);syncPageInURL();renderList();if(mobileLayout.matches)$('question-list').scrollIntoView({block:'start'});};
