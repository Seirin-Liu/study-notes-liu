// 事件绑定与启动流程。
document.querySelectorAll('[data-insert]').forEach(b=>b.onclick=()=>{const snippets={fraction:'\\(\\frac{a}{b}\\)',power:'\\(a_n^2\\)',chem:'\\(\\ce{H2O}\\)'};editorImages.insertText(snippets[b.dataset.insert]);});
  function subjectFromPath(){const name=location.pathname.split('/')[1];return subjects.some(s=>s.id===name)?name:'';}
  function routeEditor(){const match=location.pathname.match(/^\/(chemistry|biology|math|physics|chinese|english)\/edit\/(new|[-a-zA-Z0-9_]+)$/);return match?{subject:match[1],id:match[2]}:null;}
  selectedSubject=subjectFromPath();
  const initialPage=readPageFromURL();
  if(location.pathname==='/'||location.pathname==='/index.html')history.replaceState(null,'','/overview');
  document.title=(selectedSubject?subject(selectedSubject).name+'错题':'错题本')+' · 比格多栋';
  window.addEventListener('popstate',()=>{if(editing)closeEditor(false);selectSubject(subjectFromPath(),false,true);if(typeof syncPageInURL==='function')syncPageInURL();restoreScrollPosition();const route=routeEditor();if(route&&ready){const q=route.id==='new'?null:state.questions.find(q=>q.id===route.id&&q.subject===route.subject);if(q||route.id==='new')openEditor(q,true,false);}});
  $('f-subject').innerHTML=subjects.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');if($('f-mastered')){$('f-mastered').addEventListener('change',syncEditorMasteryLabel);syncEditorMasteryLabel();}
    const missing=Object.keys(structuralIds).filter(id=>!structuralIds[id]);if(missing.length)console.warn('错题本页面缺少元素：'+missing.join('、')+'，请检查 dist/index.html 与 dist/app.js 是否同一版本。');
    initHomeMascot();initReview();icons();syncSettings();renderAll();
  loadLocal().then(()=>{applyDatePreset();syncDateMenu();currentPage=initialPage;renderAll();syncPageInURL();watchScrollPosition();const route=routeEditor();if(!route)return;const q=route.id==='new'?null:state.questions.find(q=>q.id===route.id&&q.subject===route.subject);if(q||route.id==='new')openEditor(q,true,false);});setInterval(()=>loadLocal(),2000);document.fonts.ready.then(schedulePreview);document.fonts.addEventListener('loadingdone',schedulePreview);
