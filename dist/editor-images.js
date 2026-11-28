(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const optionFields = ['A', 'B', 'C', 'D'].map(key => 'option-' + key);
  const fields = ['question', 'answer', 'explanation', 'notes', ...optionFields];
  const labels = {question: '题目', answer: '答案', explanation: '解析', notes: '备注',
    ...Object.fromEntries(optionFields.map(field => [field, '选项 ' + field.at(-1)]))};
  const escape = value => Formula.escape(String(value));

  // Serialize editable image chips and colored spans back to their stored markers.
  function plainText(node) {
    if (node.nodeType === 3) return node.nodeValue;
    if (node.nodeType === 1 && node.hasAttribute('data-image-token')) return node.dataset.imageToken;
    if (node.nodeName === 'BR') return '\n';
    let text = '';
    for (const child of node.childNodes) {
      const block = /^(DIV|P|LI)$/.test(child.nodeName);
      if (block && text && !text.endsWith('\n')) text += '\n';
      text += plainText(child);
      if (block && child.nextSibling && !text.endsWith('\n')) text += '\n';
    }
    const color = node.nodeType === 1 && node.dataset.savedColor;
    return color && text ? `[${color}]${text}[/${color}]` : text;
  }

  class ImageEditor {
    constructor(onChange) {
      this.items = [];
      this.onChange = onChange;
      this.busy = false;
      this.editors = new Map();
      this.active = null;
      $('image-upload').onchange = async e => {
        if (this.busy) return;
        try { for (const file of e.target.files) await this.add(file); }
        catch (error) { this.message(error.message); }
        e.target.value = '';
      };
      $('editor-image-list').onclick = e => {
        const button = e.target.closest('[data-remove-image]');
        if (button && !this.busy) this.remove(Number(button.dataset.removeImage));
      };
      $('editor-image-list').onchange = async e => {
        if (this.busy) return;
        if (e.target.dataset.imageName !== undefined) {
          const item = this.items[Number(e.target.dataset.imageName)];
          if (!item) return;
          item.alt = e.target.value.trim().slice(0, 180) || '未命名';
          this.render();
          this.updateChips();
          this.changed();
          return;
        }
        if (e.target.dataset.replaceImage === undefined || !e.target.files[0]) return;
        try { await this.add(e.target.files[0], Number(e.target.dataset.replaceImage)); }
        catch (error) { this.message(error.message); }
      };
      if (document.createElement) this.setupEditors();
      if ($('insert-image')) $('insert-image').onclick = () => this.openPicker('question');
      document.querySelectorAll?.('[data-insert-image-field]').forEach(button => {
        button.onclick = () => this.openPicker(button.dataset.insertImageField);
      });
      if ($('image-picker-list')) $('image-picker-list').onclick = e => {
        const button = e.target.closest('[data-pick-image]');
        if (!button) return;
        const item = this.items[Number(button.dataset.pickImage)];
        if (!item) return;
        this.active = this.pickerEntry;
        $('image-picker').close();
        this.insertText(ImageReferences.marker(item.file));
      };
      if ($('image-picker-close')) $('image-picker-close').onclick = () => $('image-picker').close();
      if ($('image-picker-upload')) $('image-picker-upload').onclick = () => {
        $('image-picker').close();
        $('image-upload').click();
      };
      if ($('image-scale-value')) $('image-scale-value').oninput = () => this.updateScalePreview();
      if ($('image-scale-cancel')) $('image-scale-cancel').onclick = () => $('image-scale-dialog').close();
      if ($('image-scale-apply')) $('image-scale-apply').onclick = () => this.applyScale();
      for (const id of ['image-picker', 'image-scale-dialog']) {
        const dialog = $(id);
        if (dialog) dialog.addEventListener('close', () => this.restoreCaret());
      }
    }

    setupEditors() {
      for (const field of fields) {
        const input = $('f-' + field);
        if (!input) continue;
        const editor = document.createElement('div');
        editor.id = 'rich-' + field;
        editor.className = 'image-text-editor' + (input.tagName === 'INPUT' ? ' single-line' : '');
        editor.contentEditable = 'true';
        editor.setAttribute('role', 'textbox');
        editor.setAttribute('aria-label', labels[field]);
        editor.setAttribute('aria-multiline', 'true');
        if (input.required) editor.setAttribute('aria-required', 'true');
        editor.dataset.placeholder = input.placeholder;
        input.required = false;
        input.hidden = true;
        input.after(editor);
        const entry = {field, input, editor, range: null};
        this.editors.set(field, entry);
        const remember = () => this.rememberCaret(entry);
        editor.addEventListener('focus', remember);
        editor.addEventListener('keyup', remember);
        editor.addEventListener('mouseup', remember);
        editor.addEventListener('input', e => {
          input.value = plainText(editor);
          remember();
          if (!e.bubbles) input.dispatchEvent(new Event('input', {bubbles: true}));
        });
        editor.addEventListener('beforeinput', e => {
          if (!e.isComposing && ['insertParagraph', 'insertLineBreak'].includes(e.inputType)) {
            e.preventDefault();
            remember();
            this.insertText('\n');
          }
        });
        editor.addEventListener('paste', e => {
          e.preventDefault();
          remember();
          this.insertText(e.clipboardData.getData('text/plain'));
        });
        for (const type of ['copy', 'cut']) editor.addEventListener(type, e => {
          const selection = window.getSelection();
          if (!selection.rangeCount || selection.isCollapsed) return;
          const range = selection.getRangeAt(0);
          if (!editor.contains(range.commonAncestorContainer)) return;
          e.clipboardData.setData('text/plain', plainText(range.cloneContents()));
          e.preventDefault();
          if (type === 'cut') document.execCommand('delete');
        });
        editor.addEventListener('click', e => {
          const chip = e.target.closest('[data-image-token]');
          if (chip) { e.preventDefault(); this.openScale(chip, entry); }
        });
        editor.addEventListener('keydown', e => {
          if (e.target.hasAttribute('data-image-token') && ['Enter', ' '].includes(e.key)) {
            e.preventDefault();
            this.openScale(e.target, entry);
          }
        });
      }
      document.addEventListener('selectionchange', () => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        const node = selection.getRangeAt(0).commonAncestorContainer;
        for (const entry of this.editors.values()) {
          if (entry.editor.contains(node)) { this.rememberCaret(entry); break; }
        }
      });
    }

    rememberCaret(entry) {
      this.active = entry;
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      if (entry.editor.contains(range.commonAncestorContainer)) entry.range = range.cloneRange();
    }

    restoreCaret() {
      const entry = this.active || this.editors.get('question');
      if (!entry) return null;
      this.active = entry;
      // Focusing may move selection; retain the saved range first.
      let range = entry.range?.cloneRange();
      entry.editor.focus();
      if (!range || !entry.editor.contains(range.commonAncestorContainer)) {
        range = document.createRange();
        range.selectNodeContents(entry.editor);
        range.collapse(false);
      }
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      entry.range = range.cloneRange();
      return entry;
    }

    chipHTML(part) {
      const index = this.items.findIndex(item => item.file === part.file);
      if (index < 0) return escape(part.raw);
      const title = this.label(index) + ' · 点击设置缩放';
      return '<span class="editor-image-token" contenteditable="false" role="button" tabindex="0" data-image-token="' + escape(part.raw) + '" title="' + escape(title) + '" aria-label="' + escape(title) + '">图片' + (index + 1) + (part.scale ? '<small>' + part.scale + '%</small>' : '') + '</span>';
    }

    fieldHTML(text) {
      return ImageReferences.parts(text).map(part => part.type === 'image' ? this.chipHTML(part) : Formula.colorText(part.value, escape, true)).join('');
    }

    syncFields() {
      for (const entry of this.editors.values()) {
        entry.editor.innerHTML = this.fieldHTML(entry.input.value);
        entry.range = null;
      }
    }

    updateChips() {
      for (const entry of this.editors.values()) {
        for (const chip of entry.editor.querySelectorAll('[data-image-token]')) {
          const part = ImageReferences.parts(chip.dataset.imageToken)[0];
          const index = this.items.findIndex(item => item.file === part?.file);
          if (index < 0) continue;
          chip.innerHTML = '图片' + (index + 1) + (part.scale ? '<small>' + part.scale + '%</small>' : '');
          chip.title = this.label(index) + ' · 点击设置缩放';
          chip.setAttribute('aria-label', chip.title);
        }
      }
    }

    insertText(text) {
      const entry = this.restoreCaret();
      if (!entry) return;
      // insertHTML retains native undo/redo for editable text and atomic image chips.
      document.execCommand('insertHTML', false, this.fieldHTML(text).replace(/\n/g, '<br>'));
      entry.input.value = plainText(entry.editor);
      this.rememberCaret(entry);
      entry.input.dispatchEvent(new Event('input', {bubbles: true}));
    }

    colorSelection(field, color) {
      const entry = this.editors.get(field);
      const range = entry?.range;
      if (!range || range.collapsed || !entry.editor.contains(range.commonAncestorContainer)) return false;
      const selected = range.cloneContents();
      if (!selected.textContent.trim() || selected.querySelector('[data-image-token]')) return false;
      const prefix = document.createRange();
      prefix.selectNodeContents(entry.editor);
      for (const [node, offset] of [[range.startContainer, range.startOffset], [range.endContainer, range.endOffset]]) {
        prefix.setEnd(node, offset);
        if (Formula.tokenize(plainText(prefix.cloneContents())).some(token => token.type === 'error')) return false;
      }
      this.active = entry;
      const text = plainText(selected).replace(/\[\/?(?:black|red|blue)\]/g, '');
      this.insertText(`[${color}]${text}[/${color}]`);
      return true;
    }

    focusField(field) {
      const entry = this.editors.get(field);
      if (entry) { this.active = entry; this.restoreCaret(); }
      else $('f-' + field)?.focus();
    }

    open(id, images) {
      this.questionId = id;
      this.items = images.map(item => ({...item}));
      this.original = JSON.stringify(this.images());
      this.active = null;
      for (const entry of this.editors.values()) entry.range = null;
      this.message('');
      this.render();
    }

    images({preview = false} = {}) {
      return this.items.map(({file, alt, placement, preview: source}) => ({
        file, alt, ...(placement ? {placement} : {}), ...(preview && source ? {preview: source} : {})
      }));
    }
    dirty() { return this.original !== JSON.stringify(this.images()); }
    message(text) { $('image-message').textContent = text; }
    changed() { this.message('图片更改尚未保存，请点击“保存到本地”。'); this.onChange(); }
    label(index) { return '图片' + (index + 1) + '-' + (this.items[index].alt || '未命名'); }
    source(item) { return item.preview || '/assets/' + encodeURIComponent(this.questionId) + '/' + encodeURIComponent(item.file); }

    marker(oldFile, newFile) {
      for (const field of fields) {
        const input = $('f-' + field);
        if (input) input.value = ImageReferences.replace(input.value, oldFile, newFile);
      }
      this.syncFields();
    }

    remove(index) {
      const old = this.items[index];
      if (!old) return;
      this.items.splice(index, 1);
      this.marker(old.file, null);
      this.render();
      this.changed();
    }

    async add(file, index, {preserveName = false} = {}) {
      if (file.size > 10 * 1024 * 1024) throw Error('单张图片不能超过10 MB。');
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw Error('请选择PNG、JPEG或WebP图片。');
      if (index === undefined && this.items.length >= 20) throw Error('每道题最多20张图片。');
      const preview = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(Error('读取图片失败'));
        reader.readAsDataURL(file);
      });
      await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = () => reject(Error('图片无法解码，请换一张图片'));
        image.src = preview;
      });
      const previous = this.items[index];
      const item = {
        file: 'pending-' + Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join('') + '.' + ({'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp'}[file.type]),
        alt: preserveName && previous ? previous.alt : file.name.replace(/\.[^.]+$/, '').slice(0, 180) || '未命名',
        placement: previous ? previous.placement : 'manual', pending: file, preview
      };
      if (index === undefined) this.items.push(item);
      else { this.items[index] = item; this.marker(previous.file, item.file); }
      this.render();
      this.changed();
    }

    render() {
      $('editor-image-list').innerHTML = this.items.length ? this.items.map((item, index) =>
        '<article class="editor-image-card"><div class="editor-image-thumbnail"><img src="' + escape(this.source(item)) + '" alt="' + escape(this.label(index)) + '"></div><div class="editor-image-details"><p class="editor-image-title" title="' + escape(this.label(index)) + '">' + escape(this.label(index)) + '</p><label class="image-name-label"><span>名称</span><input type="text" maxlength="180" data-image-name="' + index + '" value="' + escape(item.alt) + '" aria-label="图片' + (index + 1) + '名称"></label><div class="image-actions"><label class="replace-image">替换图片<input type="file" accept="image/png,image/jpeg,image/webp" data-replace-image="' + index + '" aria-label="替换图片' + (index + 1) + '"></label><button type="button" data-process-image="' + index + '">处理图片</button><button type="button" data-remove-image="' + index + '">删除</button></div></div></article>'
      ).join('') : '<p class="image-shelf-empty">还没有图片，上传后可从上方插入到题目、答案、解析或备注。</p>';
      if ($('editor-image-count')) $('editor-image-count').textContent = this.items.length + ' / 20';
    }

    openPicker(targetField) {
      this.pickerEntry = this.editors.get(targetField) || this.active || this.editors.get('question');
      const field = this.pickerEntry?.field || 'question';
      $('image-picker-target').textContent = '插入到' + labels[field] + '的光标位置';
      $('image-picker-list').innerHTML = this.items.length ? this.items.map((item, index) =>
        '<button class="image-picker-card" type="button" data-pick-image="' + index + '"><img src="' + escape(this.source(item)) + '" alt=""><span>' + escape(this.label(index)) + '</span></button>'
      ).join('') : '<p class="image-shelf-empty">请先为这道题上传图片。</p>';
      $('image-picker').showModal();
    }

    openScale(chip, entry) {
      const part = ImageReferences.parts(chip.dataset.imageToken)[0];
      const index = this.items.findIndex(item => item.file === part?.file);
      if (index < 0) return;
      this.active = entry;
      const range = document.createRange();
      range.setStartAfter(chip);
      range.collapse(true);
      entry.range = range;
      this.scaleTarget = {chip, entry, part};
      $('image-scale-title').textContent = this.label(index);
      $('image-scale-preview').src = this.source(this.items[index]);
      $('image-scale-preview').alt = this.label(index);
      $('image-scale-value').value = part.scale || 100;
      this.updateScalePreview();
      $('image-scale-dialog').showModal();
    }

    updateScalePreview() {
      const scale = Number($('image-scale-value').value);
      $('image-scale-output').textContent = scale + '%';
      $('image-scale-preview').style.width = scale + '%';
    }

    applyScale() {
      const target = this.scaleTarget;
      if (!target || !target.chip.isConnected) return;
      const scale = Math.max(10, Math.min(100, Math.round(Number($('image-scale-value').value) || 60)));
      target.chip.dataset.imageToken = ImageReferences.marker(target.part.file, scale);
      this.updateChips();
      target.entry.input.value = plainText(target.entry.editor);
      target.entry.input.dispatchEvent(new Event('input', {bubbles: true}));
      this.changed();
      $('image-scale-dialog').close();
    }

    async upload() {
      if (this.busy) throw Error('图片正在保存，请稍候。');
      this.busy = true;
      $('save-question-btn').disabled = true;
      try {
        for (const item of this.items) {
          if (!item.pending) continue;
          const response = await fetch('/api/assets/' + encodeURIComponent(this.questionId), {
            method: 'POST', headers: {'X-Zhixu-Local': '1', 'Content-Type': item.pending.type}, body: item.pending
          });
          const data = await response.json();
          if (!response.ok) throw Error(data.error || '图片上传失败');
          const previousFile = item.file;
          item.file = data.file;
          delete item.pending;
          delete item.preview;
          this.marker(previousFile, data.file);
        }
        this.render();
      } finally { this.busy = false; $('save-question-btn').disabled = false; }
    }
  }
  window.ImageEditor = ImageEditor;
})();
