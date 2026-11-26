// 侧栏比格多栋表情与点击动效。
  const mascotReactions=[
    {motion:'original',file:'brand-dog.png',clickFile:'brand-dog-wave.png',name:'挥拳的比格多栋',src:'/brand-dog.png'},
    {motion:'smug',file:'beagle-smug.png',name:'得意的比格多栋'},
    {motion:'sad',file:'beagle-sad.png',name:'委屈的比格多栋'},
    {motion:'pleading',file:'beagle-pleading.png',name:'撒娇的比格多栋'}
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
