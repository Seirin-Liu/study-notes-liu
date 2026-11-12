# 给 Codex 的题目格式

在本地 Codex 中打开此项目后，发送题目图片或文字，并说明学科、专题、需要整理的题号或选项。让 Codex 读取 `AGENTS.md`，生成 JSON 后运行录入命令。无需手动粘贴到网页。

一份文件可为一道题（JSON 对象）、多道题（数组），或题库包 `{"version":2,"questions":[...]}`。完整示例见 `examples/new-question.json`。

| 字段 | 内容 |
| --- | --- |
| `id` | 唯一标识，只含字母、数字、连字符、下划线，最多 80 字符 |
| `subject` | `chemistry`、`biology`、`math`、`physics` |
| `topic` | 自定义专题，必填，最多 60 字 |
| `question` | 原题题干与所需选项，必填 |
| `answer` | 正确答案，字符串 |
| `explanation` | 完整解析，字符串 |
| `notes` | 易错点、备注，字符串 |
| `equation` | 化学方程式，使用公式排版；其他学科可留空 |
| `equationPlain` | 守恒核查用普通文本式；离子电荷用 `^2-`、`^+` |
| `mastered` | `true` 或 `false` |
| `images` | 可选题图数组，每项为 `{"file":"diagram.png","alt":"装置示意图"}`；文件放在 `data/assets/<id>/` |

所有公式使用 LaTeX。行内使用 `\(...\)`，独立一行使用 `\[...\]`；化学式用 `\(\ce{SO4^2-}\)`。JSON 字符串中，每个反斜杠必须双写，由 JSON 解析器恢复为一个。请以 `examples/new-question.json` 的实际字节为准。

保存与校验：

```sh
node scripts/add-question.mjs examples/new-question.json
node scripts/validate.mjs
```

网页每约 2 秒检测 `data/subjects/<subject>.json` 的变化；也可点击“同步文件”。同 id 更新时，命令末尾加 `--replace`。修改前读取已有题目，不得用新题覆盖整个旧题库。浏览器编辑也会写回该文件，并检查版本以防覆盖 Codex 的并发修改。题目变更前的快照保存在 `data/history`，可将所需快照复制回 `data/subjects/<subject>.json` 恢复。

公式组件检查 LaTeX 语法；化学助手检查简单方程式的原子数和电荷守恒。这些检查不能替代题目答案、推导和反应条件的学科核查。

## 时间、原题号与图片兼容性

`createdAt` 是首次录入时间，`updatedAt` 是最后修改时间。新题显式填写合法 ISO 8601 时间，例如 `2026-11-12T10:30:00+08:00`；同 id 更新由录入脚本保留已有 createdAt。上传日期筛选使用 createdAt；凌晨 6 点前选“当日”时同时包含前一天。当前尚未严格校验时间字符串，详见实现状态。

原题号当前写在 question 开头，如“原卷第 7 题：……”，不要与打印自动编号混淆。题图支持 PNG、JPEG、WebP，文件名只能含英文字母、数字、下划线和连字符，单张不超过 10 MB。先将图片放进 `data/assets/<id>/`，再在 `images` 中登记。要指定图在题干、答案、解析或备注中的位置，在对应字段写 `[[image:diagram.png]]`；没有位置标记的图片显示在题干末尾。图片会在题目列表显示缩略图，点击可看大图；打印预览内点击图片也可放大。图片必须保留关键标注，不得生成虚构数据或图形。浏览器编辑文字会保留已有题图，但新增或替换题图应通过 Codex 保存文件和更新 JSON。备份和搬迁请复制整个 `data/` 文件夹，单独复制 `questions.json` 无法带走题图。

完整使用目标与图片开发要求见 `docs/PRODUCT_GOAL.md`；照片处理与写入步骤见 `docs/LOCAL_CODEX_WORKFLOW.md`；支持情况见 `docs/IMPLEMENTATION_STATUS.md`。
