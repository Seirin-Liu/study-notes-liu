(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.ImageReferences=factory();
})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  const filename=/^[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp)$/i;
  const fields=['question','answer','explanation','notes','equation'];
  const validScale=value=>Number.isInteger(value)&&value>=10&&value<=100;

  function parts(text){
    const source=String(text||''),result=[];
    const pattern=/\[\[image:([a-zA-Z0-9_-]+\.(?:png|jpe?g|webp))(?:\|([1-9]\d|100)%)?\]\]/gi;
    let start=0;
    for(const match of source.matchAll(pattern)){
      if(match.index>start)result.push({type:'text',value:source.slice(start,match.index)});
      result.push({type:'image',file:match[1],scale:match[2]?Number(match[2]):null,raw:match[0]});
      start=match.index+match[0].length;
    }
    if(start<source.length)result.push({type:'text',value:source.slice(start)});
    return result;
  }

  function marker(file,scale=null){
    if(!filename.test(file))throw Error('图片文件名无效。');
    if(scale!==null&&!validScale(scale))throw Error('图片比例应为 10% 至 100% 的整数。');
    return `[[image:${file}${scale===null?'':`|${scale}%`}]]`;
  }

  function replace(text,oldFile,newFile){
    return parts(text).map(part=>part.type==='text'?part.value:
      part.file===oldFile?(newFile?marker(newFile,part.scale):''):part.raw).join('');
  }

  function optionTexts(question){
    return question.answerType==='single-choice'?Object.values(question.options||{}):[];
  }

  function unplaced(question){
    const texts=[...fields.map(key=>question[key]),...optionTexts(question)];
    const used=new Set(texts.flatMap(text=>parts(text).filter(part=>part.type==='image').map(part=>part.file)));
    return (question.images||[]).filter(image=>image.placement!=='manual'&&!used.has(image.file));
  }

  function style(scale){return validScale(scale)?`width:${scale}%;`:'';}

  return {parts,marker,replace,optionTexts,unplaced,style};
});
