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
