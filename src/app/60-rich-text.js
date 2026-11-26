// 轻量富文本：加粗（**…**）与下划线（__…__）的插入与取消，
// 同时支持 contenteditable 编辑层和普通 textarea 两种字段形态。
    if(!range)return false;
    const text=range.toString();
    if(text.startsWith(open)&&text.endsWith(close)&&text.length>=open.length+close.length){
      const inner=text.slice(open.length,text.length-close.length);
      range.deleteContents();
      range.insertNode(document.createTextNode(inner));
      return true;
    }
    // The markers are plain text, so look just outside the selection for them.
    const node=range.startContainer;
    if(node.nodeType!==3)return false;
    const s=range.startOffset,e=range.endOffset,full=node.data;
    if(full.slice(s-open.length,s)===open&&full.slice(e,e+close.length)===close){
      const before=full.slice(0,s-open.length),after=full.slice(e+close.length),inner=full.slice(s,e);
      node.data=before+inner+after;
      const sel=window.getSelection();
      const r=document.createRange();r.setStart(node,before.length);r.setEnd(node,before.length+inner.length);
      sel.removeAllRanges();sel.addRange(r);
      return true;
    }
    const parent=node.parentNode;
    const host=parent?.closest?.('strong,u');
    if(host&&editor.contains(host)){
      host.replaceWith(document.createTextNode(host.textContent));
      return true;
    }
    return false;
  }

  function markRich(editor,range,open,close){
    if(!range)return false;
    const selected=range.toString();
    if(!selected)return false;
    const node=document.createTextNode(open+selected+close);
    range.deleteContents();
    range.insertNode(node);
    const selection=window.getSelection();
    const after=document.createRange();
    after.setStartAfter(node);after.collapse(true);
    selection.removeAllRanges();selection.addRange(after);
    return true;
  }
  function hasRichWrap(editor,range,open,close){
    if(!range)return false;
    const text=range.toString();
    if(text.startsWith(open)&&text.endsWith(close))return true;
    const node=range.startContainer;
    if(node.nodeType===3){
      const s=range.startOffset,e=range.endOffset,full=node.data;
      if(full.slice(s-open.length,s)===open&&full.slice(e,e+close.length)===close)return true;
      return false;
    }
    const parent=node.parentNode;
    return !!parent?.closest?.('strong,u');
  }
  function hasWrapAround(field,open,close){
    const start=field.selectionStart??0,end=field.selectionEnd??0;
    if(start===end)return false;
    const value=field.value;
    return (value.slice(start-open.length,start)===open&&value.slice(end,end+close.length)===close)||(value.slice(start,end).startsWith(open)&&value.slice(start,end).endsWith(close));
  }
  function markSelection(field,open,close){
    const start=field.selectionStart??field.value.length,end=field.selectionEnd??field.value.length;
    if(start===end)return false;
    if(hasWrapAround(field,open,close))return false;
    field.setRangeText(open+field.value.slice(start,end)+close,start,end,'select');
    field.focus();
    field.dispatchEvent(new Event('input',{bubbles:true}));
    return true;
  }
  function unwrapSelection(field,open,close){
    const start=field.selectionStart??0,end=field.selectionEnd??0;
    if(start===end)return false;
    const value=field.value;
    const outer=value.slice(start-open.length,start)===open&&value.slice(end,end+close.length)===close;
    const inner=value.slice(start,end).startsWith(open)&&value.slice(start,end).endsWith(close);
    if(outer)field.setRangeText(value.slice(start,end),start-open.length,end+close.length,'select');
    else if(inner)field.setRangeText(value.slice(start+open.length,end-close.length),start,end,'select');
    else return false;
    field.focus();
    field.dispatchEvent(new Event('input',{bubbles:true}));
    return true;
  }
  function syncRichInput(field,editor){
    if(!field||!editor)return;
    editor.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function applyMark(kind,targetField){
    const marks={bold:['**','**'],underline:['__','__']};
    const [open,close]=marks[kind]||['',''];
    const name=kind==='bold'?'加粗':'下划线';
    const field=targetField?$('f-'+targetField):lastFocusedField();
    if(!field)return;
    if(targetField)editorImages.focusField(targetField);
    const editor=richEditorFor(field);
    const range=richRangeIn(editor);
    if(editor&&range){
      const removing=hasRichWrap(editor,range,open,close);
      const changed=removing?unwrapRich(editor,range,open,close):markRich(editor,range,open,close);
      if(changed){syncRichInput(field,editor);toast((removing?'已取消':'已应用')+name);}
      else toast(range.toString()?'选中文字没有'+name+'格式':'请先选中要设置的文字，再点按钮');
      return;
    }
    if(field.selectionStart===field.selectionEnd){toast('请先选中要设置的文字，再点按钮');field.focus();return;}
    const removing=hasWrapAround(field,open,close);
    const changed=removing?unwrapSelection(field,open,close):markSelection(field,open,close);
    toast(changed?(removing?'已取消':'已应用')+name:('选中文字没有'+name+'格式'));
  }
  for(const button of document.querySelectorAll('[data-wrap]')){
    button.addEventListener('mousedown',e=>e.preventDefault());
    button.onclick=()=>applyMark(button.dataset.wrap,button.closest('[data-tool-field]')?.dataset.toolField);
  }
  document.addEventListener('focusin',e=>{if(e.target.id&&e.target.id.startsWith('f-'))lastField=e.target;});

  for(const button of document.querySelectorAll('[data-text-color]')){
    button.addEventListener('mousedown',e=>e.preventDefault());
    button.onclick=()=>{
      const field=button.closest('[data-tool-field]').dataset.toolField;
      if(!editorImages.colorSelection(field,button.dataset.textColor))toast('请选择文字或完整公式后再设置颜色');
    };
  }
