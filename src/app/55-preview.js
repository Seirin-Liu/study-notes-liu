// 打印预览与保存设置的联动，以及富文本字段的定位工具。
  async function updatePreview(){clearTimeout(previewTimer);try{await Printer.render(editing?[draft()]:selectedSubject?selectedQuestions():[],state.settings,editing?subject($('f-subject').value).name+'错题专题集':titleFor(),Object.fromEntries(subjects.map(s=>[s.id,s.name])));}catch(e){$('preview-meta').textContent='预览失败：'+e.message;$('print-btn').disabled=true;}}
  $('prev-page').onclick=()=>Printer.previous();$('next-page').onclick=()=>Printer.next();window.addEventListener('resize',Printer.scale);window.addEventListener('resize',()=>{if(selectedSubject)renderTopics();});$('print-btn').onclick=async()=>{await updatePreview();if(!$('print-btn').disabled)window.print();};
  const previewCanvas = $('preview-canvas');
  const previewDialog = $('pdf-preview-dialog');
  const previewDialogBody = $('pdf-preview-dialog-body');
  const closePreviewButton = $('pdf-preview-close');

  if (previewCanvas && previewDialog && previewDialogBody && closePreviewButton) {
    function fitEnlargedPage() {
      const holder = previewDialogBody.firstElementChild;
      if (!previewDialog.open || !holder) return;

      const paper = holder.firstElementChild;
      const width = Math.min(paper.offsetWidth, previewDialogBody.clientWidth);
      const scale = width / paper.offsetWidth;
      holder.style.width = width + 'px';
      holder.style.height = Math.ceil(paper.offsetHeight * scale) + 'px';
      paper.style.transform = 'scale(' + scale + ')';
    }

    function enlargeCurrentPage() {
      const paper = previewCanvas.querySelector('.paper-page');
      if (!paper || previewDialog.open) return;

      const holder = document.createElement('div');
      holder.className = 'pdf-preview-sheet';
      holder.append(paper.cloneNode(true));
      previewDialogBody.replaceChildren(holder);
      previewDialog.showModal();
      fitEnlargedPage();
      previewDialogBody.scrollTop = 0;
    }

    previewCanvas.addEventListener('click', event => {
      if (event.target.closest('.paper-page') && !event.target.closest('[data-image]')) {
        enlargeCurrentPage();
      }
    });
    closePreviewButton.addEventListener('click', () => previewDialog.close());
    previewDialog.addEventListener('click', event => {
      if (event.target === previewDialog) previewDialog.close();
    });
    previewDialog.addEventListener('close', () => {
      if (!previewDialog.open) previewDialogBody.replaceChildren();
    });
    window.addEventListener('resize', fitEnlargedPage);
  }

    function editorFields(){return ['f-question','f-answer','f-explanation','f-notes'].map(id=>$(id)).filter(Boolean);}
  let lastField=null;
  function lastFocusedField(){
    const fields=editorFields();
    return fields.find(el=>el===document.activeElement)||(lastField&&fields.includes(lastField)?lastField:null)||$('f-question');
  }
  // 图片编辑器会把文字字段替换成 contenteditable 层（#rich-xxx），文字和选区都在那一层里。
  function richEditorFor(field){
    if(!field)return null;
    const name=field.id.replace(/^f-/,'');
    return document.getElementById('rich-'+name);
  }
  function richRangeIn(editor){
    if(!editor)return null;
    const selection=window.getSelection();
    if(!selection||!selection.rangeCount)return null;
    const range=selection.getRangeAt(0);
    if(!editor.contains(range.commonAncestorContainer))return null;
    return range;
  }
  function unwrapRich(editor,range,open,close){
