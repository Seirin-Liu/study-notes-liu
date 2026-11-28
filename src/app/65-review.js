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
