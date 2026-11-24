# 错题与笔记整理流程

```mermaid
flowchart TD
    Start(["准备试卷照片、PDF 或文字"])
    Start --> Codex["发给本地 Codex"]
    Start --> Web["网页手动录入或编辑"]

    Codex --> Classify["确认学科、专题与条目类型"]
    Web --> Classify
    Classify --> Type{"错题还是笔记？"}
    Type -->|错题| Question["整理题干、答案、解析与备注"]
    Type -->|笔记| Note["题干填标题，正文按原顺序写入解析"]
    Question --> Format["排版公式，有配图时处理并插入对应位置"]
    Note --> Format

    Format --> Check{"格式、公式和题图校验通过？"}
    Check -->|有问题| Format
    Check -->|通过| Save["保存到本机分学科题库"]
    Save --> Sync["网页自动同步题库"]

    Sync --> Filter["按学科、类型、专题等条件筛选"]
    Filter --> Select["按想要的顺序勾选条目"]
    Select --> Preview["查看打印预览，可点击纸面放大"]
    Preview --> Export(["打印或另存为 PDF"])

    Sync --> Review["随机复习从错题中抽取"]
    Review --> Practice(["逐题作答，再展开答案与解析"])
```

- **录入与核查**。Codex 根据指定范围核对题干、答案和推导。数学公式使用 LaTeX，化学式使用 mhchem。整理照片时裁掉无关内容、转正并增强对比度。
- **保存与同步**。Codex 可通过录入脚本新增或更新单条、批量记录，写入后再运行题库校验。网页可点击「保存到本地」，打开的页面约每 2 秒检测题库变化。
- **回顾与打印**。错题和笔记都可以筛选、勾选和打印。打印按勾选顺序编号，可选择纸张、栏数及答案、解析、备注的显隐。随机复习可指定单科或全部学科。

[本地录入与备份步骤](LOCAL_CODEX_WORKFLOW.md) · [题目与笔记的保存格式](../QUESTION_FORMAT.md)
