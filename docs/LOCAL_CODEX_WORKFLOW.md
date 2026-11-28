# 本地 Codex 接管与照片录题

## 用户启动

1. 安装 Node.js 18 或更新版本，把项目完整克隆或解压到固定文件夹。
2. 在本地 Codex 中打开这个项目根目录，确保能读取 `AGENTS.md`。在该对话发送卷子照片；不要只打开 `dist` 子目录。
3. Windows 双击 `start-local.cmd`；macOS 双击 `start-local.command`（或在终端运行 `sh start-local.sh`）；Linux 运行 `sh start-local.sh`。浏览器访问 `http://127.0.0.1:4318/`，保持终端运行。应用自身无需识图 API 密钥，也无需 npm install。
4. 本地 Codex 写入后，已打开的网页约每两秒检测一次变化。若正在编辑同一条记录且收到版本冲突提示，先保留草稿，再重新打开题目核对。

可以复制下面的请求给 Codex。

> 按项目 AGENTS.md 处理这张卷子的第 3、7 题，归入化学 / 元素化合物。处理并插入必要题图，核对答案和解析，直接写入本地题库并校验。

## Codex 每批必须执行的流程

1. 先读 `AGENTS.md`、`docs/PRODUCT_GOAL.md`、`docs/IMPLEMENTATION_STATUS.md`、`QUESTION_FORMAT.md`，检查当前 schema、题库和已有专题，不假设规划功能已实现。
2. 确认照片顺序、用户指定题号/选项、学科和专题。保留原题题号并区分本次打印流水号；未指定细节可合理推断并说明，关键条件不清先问，不能猜题。
3. 逐题识别题干、选项、图和批注，独立核对答案。解析写明必要步骤、易错点及关键依据。英语单选题解释整句或对话的意思、A–D 的释义和用法区别，并提炼重点短语。区分用户原选项和正确答案。
4. 有图片时按 `QUESTION_FORMAT.md` 的「截取原图与重绘」处理，将核对过的题图保存在 `data/assets/<question-id>/`，按 `QUESTION_FORMAT.md` 的 `images` 和位置标记录入；不能以 Markdown 图片、HTML 或纯文字“见图”假装完成。
5. 每题生成唯一稳定 ASCII id；新题首次创建时记录确定的 ISO 8601 `createdAt` 和 `updatedAt`。更新旧题保留 id 和 createdAt，先读取目标再使用 `--replace`。重复照片先检查是否已有同题，不盲目覆盖。
6. 将符合当前格式的单题或批次 JSON 写入 `work/`，运行 `node scripts/add-question.mjs work/<batch>.json`；更新使用 `--replace`。此命令必须从项目根目录执行。不清空题库、不改应用源码录题。
7. 运行 `node scripts/validate.mjs`；涉及化学时再运行 `node tests/chemistry.cjs` 并核查具体方程式、条件和结论。检查写入条数、题目内容、资产路径、时间、原题号，必要时在浏览器查看打印。
8. 告知录入题号、学科/专题、图像处理结果、验证结果，以及未解决的模糊内容。仅录题时无需 Git 提交或推送；照片、题库、图片不能自动发送远程。

## 英语词汇整理

1. 从 `data/subjects/english.json` 读取英语题，并按 ID 跳过 `vocabularyProcessed` 为 `true` 的记录。
2. 从题干和选项筛选较难单词，将常见屈折形式归到同一词条，并与用户指定的词表去重。沿用词表的现有格式。
3. 确认词表写入成功后，用 `--replace` 给本批已检查的题加上 `vocabularyProcessed: true`。按 ID 校验写入结果。编辑或替换导入题目时，现有标记默认保留。

## 备份和后续开发

备份时复制整个 `data/` 目录，包含分学科 JSON、存储标记、打印设置、题图和历史快照。若要恢复一道题，从 `data/history/` 中提取对应 ID 的记录，确认引用的图片仍在 `data/assets/`，再通过录入脚本导入。已有同 ID 时使用 `--replace`。恢复整库时，先备份当前数据并停止服务，复制备份目录后运行题库校验。

开发新功能时先对照进度表，把协议、前后端和回归检查一起完成，再更新进度与格式文档。用户没有要求时不部署 Sites、不修改旧站点、不把本地服务改为公网服务。
