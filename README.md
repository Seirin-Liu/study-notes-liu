# 知序 · 本地错题工作台

按学科和专题整理错题与笔记的本地题库，题库保存在本机文件中，公式由本地 KaTeX 0.16.30 和 mhchem 组件排版。不需要联网加载公式库或字体，也不需要 API 密钥。

## 项目目标与本地 Codex 接管

这个项目的长期目标是：在自己的电脑上运行，由本地 Codex 接管项目文件夹。你在 Codex 发送卷子照片，它识别并核对题目、生成程序支持的数据，直接修改本地题库；必要题图也由 Codex 处理并保存在项目内。网页用于按学科、条目类型、上传时间和专题筛选，再勾选要打印的条目，右侧展示本次所选题目的打印预览。

- [完整目标与验收标准](docs/PRODUCT_GOAL.md)
- [错题与笔记整理流程图](docs/QUESTION_WORKFLOW.md)
- [本地 Codex 接管、照片录题和备份流程](docs/LOCAL_CODEX_WORKFLOW.md)
- [当前实现状态与后续开发顺序](docs/IMPLEMENTATION_STATUS.md)
- [Codex 工作规则](AGENTS.md)与[当前题目格式](QUESTION_FORMAT.md)

学科页顶部可切换「全部 / 错题 / 笔记」。在录入或编辑时，通过「条目类型」设置分类。打印预览按勾选顺序显示所选内容。点击纸面或「放大预览」可居中查看整页，点击题图可查看单张大图。 题图需保存在 `data/assets/`，备份时复制整个 `data/` 文件夹。

## 在 Mac 启动

支持 Apple Silicon 和 Intel Mac，安装对应架构的 [Node.js LTS](https://nodejs.org/)（至少 18），无需 `npm install`。完整解压项目到固定文件夹，在本地 Codex 中打开整个文件夹。

双击 `start-local.command`，启动后在浏览器打开终端显示的地址（默认 `http://127.0.0.1:4318/`）。保留终端窗口，按 Ctrl+C 停止服务。题库仍保存在项目的 `data/` 中。

也可以在终端输入 `cd `（末尾留一个空格），把解压后的文件夹拖入终端，按回车，然后执行：

```sh
sh start-local.sh
```

如果双击提示没有执行权限，在项目目录运行 `chmod +x start-local.command` 后重试；如果 macOS 阻止打开下载的脚本，直接使用上面的终端启动方式，无需更改系统安全设置。端口被占用时运行 `sh start-local.sh --port 4320`，然后访问 `http://127.0.0.1:4320/`。

建议使用最新版 Chrome 或 Safari。打印时选择与预览一致的 B5/A4 纸张、100% 比例，并关闭浏览器页眉页脚；也可在打印对话框保存为 PDF。

## 在局域网使用

先停止已运行的本机实例，再在项目目录执行：

```sh
node server.mjs --lan
```

在同一网段的手机或电脑上直接打开终端显示的局域网地址。本机仍可打开 `http://127.0.0.1:4318/`，两个入口共用本机题库。若有多个网卡，可运行 `node server.mjs --lan 192.168.1.10` 并替换为本机实际地址；也可用 `--port 4320` 指定端口。

同网段设备无需登录即可查看和编辑题库。局域网使用 HTTP，请仅在信任的网络内使用，无需配置路由器端口映射。省略 `--lan` 则只开放本机入口。

## 在 Windows 启动

1. 将压缩包完整解压到一个固定文件夹，例如 `D:\Study\zhixu-local`。需要 Node.js 18 或更新版本。
2. 双击 `start-local.cmd`，浏览器会打开 `http://127.0.0.1:4318/`。保留服务窗口；关闭窗口或按 Ctrl+C 即停止。

无需 `npm install`。macOS/Linux 可运行 `sh start-local.sh`，或直接运行 `node server.mjs`。其他端口可用 `node server.mjs --port 4320`。

## 上传错题与笔记

用本地 Codex 打开项目文件夹，发送照片、PDF 或文字，并说明学科、专题和条目类型。

> 把这道题整理到“化学 / 硫”专题。按 AGENTS.md 和 QUESTION_FORMAT.md 整理题干、答案、解析、备注，公式用 LaTeX，化学式用 mhchem。独立核对答案和方程式后写入本地题库，并运行校验。

上传复习笔记时，在题干填写标题，在解析里按原顺序分点整理正文，并把公式和裁好的配图插在对应位置。浏览器也可以通过「录入新题」手动上传。

Codex 生成单条或批量 JSON 后，执行以下命令。

```sh
node scripts/add-question.mjs examples/new-question.json
node scripts/validate.mjs
```

完整格式见 `QUESTION_FORMAT.md`，示例见 `examples/new-question.json`。文件实际写入 `data/subjects/chemistry.json 等`，网页约每 2 秒检测一次变化，也可点击“同步文件”。同一 id 更新需加 `--replace`。

## 使用与数据

- 选择学科后，可以组合条目类型、专题、关键词、上传时间和掌握状态筛选。随机复习从错题中抽取。题目、答案、解析、备注都支持公式。
- 默认 B5 双栏紧凑排版；可切 A4、单栏、隐藏答案。按公式实际尺寸分页，公式节点不拆分。
- 浏览器中的“保存到本地”会写回 JSON。题目修改前自动保存 `data/history/` 快照。
- 整个 `data` 文件夹包含分学科题库、设置和题图；备份或迁移时复制整个文件夹。旧版纯文本数学式需要由 Codex 转成 LaTeX 才能以公式排版。
- 删除题目后，可从历史快照找出对应条目，再用录入脚本恢复。历史快照是整库结构，分学科文件使用各自的结构。
- 题库损坏时会报错，不会悄悄清空；并发修改会拒绝覆盖。编辑草稿另外暂存在当前浏览器。
- 本地服务默认只监听回环地址；显式启用局域网模式后，只额外向所选网卡所在子网开放。无统计脚本、外部字体或题目上传。

公式组件检查语法，化学助手检查简单方程式的原子数、电荷守恒与常见知识点。它们不能证明推导、学科答案或反应条件一定正确，Codex 仍应先核查后录入。

## 验证

```sh
node --test tests/local.test.mjs
node tests/chemistry.cjs
node scripts/validate.mjs
```

已验证本地文件自动同步、浏览器保存后磁盘持久化、公式错误拦截、纸张切换及含 160 个完整公式的长题分页。自动测试覆盖公式渲染、数据格式、历史快照、并发冲突、损坏文件保护、本地 API、22 个化学方程式用例与 3 个知识点检查。

组件说明：[KaTeX API](https://katex.org/docs/api)、[mhchem](https://katex.org/docs/libs)。组件许可证位于 `dist/vendor/katex/LICENSE`。
