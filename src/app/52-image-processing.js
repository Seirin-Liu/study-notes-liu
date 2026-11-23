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
