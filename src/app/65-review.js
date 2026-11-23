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
  function reviewQuestionHTML(question,index){
    const hasSolution=['answer','explanation','equation','notes'].some(key=>question[key]);
    const solution=[['answer','答案'],['explanation','解析'],['equation','方程式'],['notes','备注']].filter(([key])=>question[key]).map(([key,label])=>`<div><b>${label}</b>${richQuestion(question,key)}</div>`).join('');
    return `<article class="question-card review-card"><h2>第 ${index+1} 题 · ${esc(subject(question.subject).name)} · ${esc(question.topic)}</h2><div class="question-text">${richQuestion(question)}</div>${hasSolution?`<details class="review-solution"><summary>查看答案和解析</summary>${solution}</details>`:''}</article>`;
  }
  function initReview(){
    const selector=$('review-subject');
    let questions=[],position=0;
    function showQuestion(){
      const current=questions[position];
      $('review-progress').hidden=!current;
      $('review-pagination').hidden=!current;
      $('review-results').innerHTML=current?reviewQuestionHTML(current,position):'';
      if(!current)return;
      const progress=$('review-progress-bar');
      progress.max=questions.length;
      progress.value=position+1;
      $('review-progress-label').textContent=`${position+1} / ${questions.length}`;
      $('review-prev').disabled=position===0;
      $('review-next').disabled=position===questions.length-1;
    }
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
      position=0;
      $('review-status').textContent=!questions.length?'所选学科暂无错题。':questions.length<count?`所选范围只有 ${questions.length} 道错题，已全部抽出。`:`已随机抽出 ${questions.length} 道题。`;
      showQuestion();
    });
  }
