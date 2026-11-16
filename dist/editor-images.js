(() => {
 'use strict';
 const $=id=>document.getElementById(id),fields=['question','answer','explanation','notes','equation'];
 class ImageEditor{
  constructor(onChange){this.items=[];this.onChange=onChange;this.busy=false;
   $('image-upload').onchange=async e=>{if(this.busy)return;try{for(const file of e.target.files)await this.add(file);}catch(error){this.message(error.message);}e.target.value='';};
   $('editor-image-list').onclick=e=>{const b=e.target.closest('[data-remove-image]');if(b&&!this.busy)this.remove(Number(b.dataset.removeImage));};
   $('editor-image-list').onchange=async e=>{if(e.target.dataset.replaceImage===undefined||this.busy)return;const file=e.target.files[0];if(!file)return;try{await this.add(file,Number(e.target.dataset.replaceImage));}catch(error){this.message(error.message);}};
  }
  open(id,images){this.questionId=id;this.items=images.map(x=>({...x}));this.original=JSON.stringify(this.images());this.message('');this.render();}
  images(){return this.items.map(({file,alt})=>({file,alt}));}
  dirty(){return this.original!==JSON.stringify(this.images());}
  message(text){$('image-message').textContent=text;}
  marker(oldFile,newFile){for(const field of fields){const el=$('f-'+field);el.value=el.value.split(`[[image:${oldFile}]]`).join(newFile?`[[image:${newFile}]]`:'');}}
  remove(index){const old=this.items[index];if(!old)return;this.marker(old.file,null);this.items.splice(index,1);this.render();this.onChange();}
  async add(file,index){
   if(file.size>10*1024*1024)throw Error('单张图片不能超过10 MB。');
   if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('请选择PNG、JPEG或WebP图片。');
   if(index===undefined&&this.items.length>=20)throw Error('每道题最多20张图片。');
   const preview=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('读取图片失败'));reader.readAsDataURL(file);});
   await new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=()=>reject(Error('图片无法解码，请换一张图片'));image.src=preview;});
   const item={file:'pending-'+crypto.randomUUID()+'.'+({'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[file.type]),alt:file.name.slice(0,200),pending:file,preview};
   if(index===undefined){this.items.push(item);$('f-question').value+='\n[[image:'+item.file+']]';}else{this.marker(this.items[index].file,item.file);this.items[index]=item;}
   this.message('图片更改尚未保存，请点击“保存到本地”。');this.render();this.onChange();
  }
  render(){const escape=Formula.escape;$('editor-image-list').innerHTML=this.items.length?this.items.map((im,i)=>`<div class="editor-image-card"><img src="${escape(im.preview||'/assets/'+encodeURIComponent(this.questionId)+'/'+encodeURIComponent(im.file))}" alt="${escape(im.alt)}"><div><p>${escape(im.alt)}</p><div class="image-actions"><label>替换图片<input type="file" accept="image/png,image/jpeg,image/webp" data-replace-image="${i}"></label><button type="button" data-remove-image="${i}">删除图片</button></div></div></div>`).join(''):'<p class="field-help">这道题暂时没有图片。</p>';}
  async upload(){if(this.busy)throw Error('图片正在保存，请稍候。');this.busy=true;$('save-question-btn').disabled=true;
   try{for(const item of this.items){if(!item.pending)continue;const res=await fetch('/api/assets/'+encodeURIComponent(this.questionId),{method:'POST',headers:{'X-Zhixu-Local':'1','Content-Type':item.pending.type},body:item.pending});const data=await res.json();if(!res.ok)throw Error(data.error||'图片上传失败');this.marker(item.file,data.file);item.file=data.file;delete item.pending;delete item.preview;}this.render();}
   finally{this.busy=false;$('save-question-btn').disabled=false;}
  }
 }
 window.ImageEditor=ImageEditor;
})();
