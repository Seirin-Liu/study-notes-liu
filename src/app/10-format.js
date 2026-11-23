// 题干/答案等正文渲染：LaTeX 公式、题图位置标记。卡片与打印预览共用。
  function richQuestion(q,key='question'){
    function renderImage(image,scale=null){const src=imageUrl(q,image);return '<span class="question-inline-image"'+(scale?' data-image-scale="'+scale+'" style="'+ImageReferences.style(scale)+'"':'')+'><button type="button" class="image-thumb" data-image="'+esc(src)+'" data-alt="'+esc(image.alt)+'"><img src="'+esc(src)+'" alt="'+esc(image.alt)+'" loading="lazy"><small>'+esc(image.alt)+'</small></button></span>';}
    let html=ImageReferences.parts(q[key]||'').map(part=>{
      if(part.type==='text')return Formula.render(part.value,{equation:key==='equation'});
      const image=(q.images||[]).find(x=>x.file===part.file);
      return image?renderImage(image,part.scale):esc(part.raw);
    }).join('');
    if(key==='question')html+=ImageReferences.unplaced(q).map(image=>renderImage(image)).join('');
    return html;
  }
