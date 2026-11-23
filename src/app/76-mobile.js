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
