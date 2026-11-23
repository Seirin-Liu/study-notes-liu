// 记忆列表滚动位置：刷新、从编辑页返回时都能回到原处。
const SCROLL_KEY = 'zhixu-scroll';
function scrollStorage() {
  try { return JSON.parse(sessionStorage.getItem(SCROLL_KEY) || '{}'); } catch { return {}; }
}
let scrollPaused = false;
function listScrollTarget() {
  return mobileLayout.matches ? window : document.querySelector('.workspace');
}
function saveScrollPosition(force = false) {
  if ((scrollPaused && !force) || !selectedSubject) return;
  const target = listScrollTarget();
  if (!target) return;
  const all = scrollStorage();
  all[selectedSubject] = { top: Math.round(target===window?window.scrollY:target.scrollTop), at: Date.now() };
  try { sessionStorage.setItem(SCROLL_KEY, JSON.stringify(all)); } catch {}
}
function restoreScrollPosition(instant = true) {
  if (!selectedSubject) return;
  const subjectId = selectedSubject;
  const top = scrollStorage()[subjectId]?.top ?? 0;
  // 数据尚未渲染完时容器不可滚动，稍等一帧让高度就绪
  const apply = () => {
    if(selectedSubject!==subjectId||editing)return;
    listScrollTarget()?.scrollTo({top,behavior:instant?'instant':'smooth'});
  };
  requestAnimationFrame(() => requestAnimationFrame(apply));
}
function watchScrollPosition() {
  const workspace = document.querySelector('.workspace');
  if (!workspace) return;
  let timer = null;
  const onScroll = event => {
    if (scrollPaused || (event.currentTarget===window)!==mobileLayout.matches) return;
    clearTimeout(timer);
    timer = setTimeout(saveScrollPosition, 120);
  };
  workspace?.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  // 离开页面前再存一次，避免防抖未触发
  window.addEventListener('beforeunload', () => saveScrollPosition());
  window.addEventListener('pagehide', () => saveScrollPosition());
}

// 进入编辑页时保存并暂停记录，返回后恢复
function pauseScrollTracking() {
  saveScrollPosition(true);
  scrollPaused = true;
}
function resumeScrollTracking() {
  scrollPaused = false;
}
