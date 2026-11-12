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

所有公式使用 LaTeX。行内使用 `\(...\)`，独立一行使用 `\[...\]`；化学式用 `\(\ce{SO4^2-}\)`。JSON 字符串中，每个反斜杠必须双写，由 JSON 解析器恢复为一个。请以 `examples/new-question.json` 的实际字节为准。

保存与校验：

```sh
node scripts/add-question.mjs examples/new-question.json
node scripts/validate.mjs
```

网页每约 2 秒检测 `data/questions.json` 的变化；也可点击“同步文件”。同 id 更新时，命令末尾加 `--replace`。修改前读取已有题目，不得用新题覆盖整个旧题库。浏览器编辑也会写回该文件，并检查版本以防覆盖 Codex 的并发修改。题目变更前的快照保存在 `data/history`，可将所需快照复制回 `data/questions.json` 恢复。

公式组件检查 LaTeX 语法；化学助手检查简单方程式的原子数和电荷守恒。这些检查不能替代题目答案、推导和反应条件的学科核查。
