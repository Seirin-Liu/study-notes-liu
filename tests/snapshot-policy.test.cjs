const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');

async function setup(initial) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'zhixu-snap-'));
  const dataDir = path.join(dir, 'data');
  await fs.mkdir(path.join(dataDir, 'subjects'), { recursive: true });
  const questions = initial || [
    { id: 'q1', subject: 'chemistry', topic: '离子反应', question: '题目一', answer: 'A', explanation: '', notes: '', equation: '', equationPlain: '', mastered: false, createdAt: '2026-11-20T10:00:00+08:00', updatedAt: '2026-11-20T10:00:00+08:00' },
    { id: 'q2', subject: 'biology', topic: '细胞的分子组成', question: '题目二', answer: 'B', explanation: '', notes: '', equation: '', equationPlain: '', mastered: false, createdAt: '2026-11-20T10:00:00+08:00', updatedAt: '2026-11-20T10:00:00+08:00' }
  ];
  for (const subject of ['chemistry', 'biology', 'math', 'physics', 'chinese', 'english']) {
    const list = questions.filter(q => q.subject === subject);
    await fs.writeFile(path.join(dataDir, 'subjects', subject + '.json'), JSON.stringify({ version: 2, subject, questions: list }, null, 2) + '\n');
  }
  await fs.writeFile(path.join(dataDir, 'settings.json'), JSON.stringify({ paper: 'B5', columns: 2, compact: true, answers: true }, null, 2) + '\n');
  await fs.writeFile(path.join(dataDir, 'questions.json'), JSON.stringify({ version: 2, questions }, null, 2) + '\n');
  await fs.writeFile(path.join(dataDir, 'storage-v1.json'), JSON.stringify({ version: 1 }, null, 2) + '\n');
  const { LocalStore } = await import('../lib/store.mjs');
  const store = new LocalStore(dataDir);
  return {
    store,
    dataDir,
    historyDir: path.join(dataDir, 'history'),
    history: async () => (await fs.readdir(path.join(dataDir, 'history')).catch(() => [])).length,
    cleanup: () => fs.rm(dir, { recursive: true, force: true })
  };
}

const flip = (questions, id) => questions.map(q => q.id === id ? { ...q, mastered: !q.mastered, updatedAt: new Date().toISOString() } : q);

test('a content edit always keeps the previous library', async () => {
  const t = await setup();
  try {
    const before = await t.store.read();
    const edited = before.questions.map(q => q.id === 'q1' ? { ...q, notes: '补充易错点' } : q);
    await t.store.save({ ...before, questions: edited }, before.revision);
    assert.equal(await t.history(), 1, '内容修改必须留快照');
    const saved = JSON.parse(await fs.readFile(path.join(t.dataDir, 'history', (await fs.readdir(t.historyDir))[0]), 'utf8'));
    assert.equal(saved.questions.find(q => q.id === 'q1').notes, '', '快照保存修改前的内容');
  } finally { await t.cleanup(); }
});

test('the first state-only change is snapshotted', async () => {
  const t = await setup();
  try {
    const before = await t.store.read();
    await t.store.save({ ...before, questions: flip(before.questions, 'q1') }, before.revision);
    assert.equal(await t.history(), 1, '第一次状态变化需要快照');
  } finally { await t.cleanup(); }
});

test('repeated state-only changes inside the window are merged', async () => {
  const t = await setup();
  try {
    let bank = await t.store.read();
    for (const id of ['q1', 'q2', 'q1']) {
      bank = await t.store.read();
      await t.store.save({ ...bank, questions: flip(bank.questions, id) }, bank.revision);
    }
    assert.equal(await t.history(), 1, '连续勾选掌握状态只留 1 个快照');
  } finally { await t.cleanup(); }
});

test('a content edit after state churn still gets its own snapshot', async () => {
  const t = await setup();
  try {
    let bank = await t.store.read();
    await t.store.save({ ...bank, questions: flip(bank.questions, 'q1') }, bank.revision);
    bank = await t.store.read();
    await t.store.save({ ...bank, questions: flip(bank.questions, 'q2') }, bank.revision);
    bank = await t.store.read();
    const edited = bank.questions.map(q => q.id === 'q2' ? { ...q, explanation: '新增解析' } : q);
    await t.store.save({ ...bank, questions: edited }, bank.revision);
    assert.equal(await t.history(), 2, '合并只针对状态变化，内容修改必须另起一份');
  } finally { await t.cleanup(); }
});

test('deleting or adding a question is never treated as a state-only change', async () => {
  const t = await setup();
  try {
    let bank = await t.store.read();
    await t.store.save({ ...bank, questions: flip(bank.questions, 'q1') }, bank.revision);
    bank = await t.store.read();
    await t.store.save({ ...bank, questions: bank.questions.filter(q => q.id !== 'q2') }, bank.revision);
    assert.equal(await t.history(), 2, '删除题目必须留快照');
  } finally { await t.cleanup(); }
});

test('a stale state-only snapshot outside the window is kept', async () => {
  const t = await setup();
  try {
    const before = await t.store.read();
    await t.store.save({ ...before, questions: flip(before.questions, 'q1') }, before.revision);
    // Age the snapshot well past the merge window.
    const [file] = await fs.readdir(t.historyDir);
    const old = path.join(t.historyDir, '0-' + file.replace(/^\d+-/, ''));
    await fs.rename(path.join(t.historyDir, file), old);
    const bank = await t.store.read();
    await t.store.save({ ...bank, questions: flip(bank.questions, 'q2') }, bank.revision);
    assert.equal(await t.history(), 2, '超过时间窗口的状态变化应另存快照');
  } finally { await t.cleanup(); }
});

test('settings-only saves do not create snapshots', async () => {
  const t = await setup();
  try {
    const before = await t.store.read();
    await t.store.save({ ...before, settings: { ...before.settings, paper: 'A4' } }, before.revision);
    assert.equal(await t.history(), 0, '只改打印设置不需要快照');
  } finally { await t.cleanup(); }
});
