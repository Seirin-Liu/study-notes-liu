(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.Formula=factory(root.katex);})(typeof window==='undefined'?globalThis:window,function(katex){
  'use strict';
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sub={'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'};
  const sup={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-'};
  function chemicalSource(s){return String(s).replace(/[₀-₉]/g,c=>sub[c]).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g,t=>'^'+[...t].map(c=>sup[c]).join('')).replace(/⇌/g,' <=> ').replace(/→/g,' -> ').replace(/↑/g,' ^ ').replace(/↓/g,' v ');}
  // Copied JSON/Markdown may double-escape math delimiters. Keep TeX row breaks intact.
  function normalizeDelimiters(source){return String(source??'').replace(/\\{2,}([()[\]])/g,'\\$1');}
  function tokenize(source,equation=false){
    source=normalizeDelimiters(source);
    if(equation&&source.trim()&&!source.includes('\\(')&&!source.includes('\\['))source='\\(\\ce{'+chemicalSource(source)+'}\\)';
    const tokens=[];let offset=0;
    while(offset<source.length){
      const a=source.indexOf('\\(',offset),b=source.indexOf('\\[',offset);
      const start=a===-1?b:b===-1?a:Math.min(a,b);
      if(start===-1){tokens.push({type:'text',value:source.slice(offset)});break;}
      if(start>offset)tokens.push({type:'text',value:source.slice(offset,start)});
      const display=source[start+1]==='[',close=display?'\\]':'\\)';const end=source.indexOf(close,start+2);
      if(end===-1){tokens.push({type:'error',value:source.slice(start),error:'公式缺少结束标记 '+close});break;}
      tokens.push({type:'math',value:source.slice(start+2,end),display});offset=end+2;
    }
    return tokens;
  }
  // 轻量富文本：**加粗** 与 __下划线__。仅在已转义的纯文本块内生效，不影响公式与图片标记。
  function emphasize(html){
    return html
      .replace(/\*\*(?=[^\s*])([\s\S]*?[^\s*])\*\*/g,'<strong>$1</strong>')
      .replace(/__(?=[^\s_])([\s\S]*?[^\s_])__/g,'<u>$1</u>');
  }
  // Match paired color tags before escaping text. Only the three toolbar colors are accepted.
  function colorText(source, renderText, editable=false){
    const pattern=/\[(\/?)(black|red|blue)\]/g;
    const stack=[], pairs=new Map();
    for(const match of source.matchAll(pattern)){
      const [tag,closing,color]=match;
      if(!closing) stack.push(match);
      else if(stack.at(-1)?.[2]===color){
        const open=stack.pop();
        pairs.set(open.index,{tag:open[0],html:'<span class="text-color-'+color+'"'+(editable?' data-saved-color="'+color+'"':'')+'>'});
        pairs.set(match.index,{tag,html:'</span>'});
      }
    }
    let offset=0, html='';
    for(const index of [...pairs.keys()].sort((a,b)=>a-b)){
      const {tag,html:markup}=pairs.get(index);
      html+=renderText(source.slice(offset,index))+markup;
      offset=index+tag.length;
    }
    return html+renderText(source.slice(offset));
  }
  function renderToken(t){
    if(t.type==='text')return emphasize(escape(t.value));
    try{if(t.error)throw Error(t.error);if(!katex)throw Error('公式组件未加载');const html=katex.renderToString(t.value,{displayMode:!!t.display,throwOnError:true,trust:false,strict:'error',maxExpand:500,maxSize:20,output:'htmlAndMathml'});return `<span class="formula-atom ${t.display?'formula-display':''}" data-tex="${escape(t.value)}">${html}</span>`;}
    catch(e){return `<span class="formula-error" title="${escape(e.message)}">公式待修正：${escape(t.value)}</span>`;}
  }
  function render(source,options={}){const renderSource=text=>tokenize(text,options.equation).map(renderToken).join('');return options.equation?renderSource(source):colorText(String(source??''),renderSource);}
  function check(source,options={}){const errors=[];
    if(!options.equation&&!options.colorSegment&&/\[\/?(?:black|red|blue)\]/.test(String(source??''))){
      colorText(String(source??''),text=>{errors.push(...check(text,{colorSegment:true}));return '';});
      return errors;
    }
    for(const t of tokenize(source,options.equation)){if(t.type==='text')continue;try{if(t.error)throw Error(t.error);katex.renderToString(t.value,{displayMode:!!t.display,throwOnError:true,trust:false,strict:'error',maxExpand:500,maxSize:20});}catch(e){errors.push(e.message.replace(/^KaTeX parse error: /,''));}}return errors;}
  return {render,check,colorText,tokenize,escape,emphasize,normalizeDelimiters};
});
