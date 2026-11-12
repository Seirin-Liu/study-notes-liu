#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo '请先安装 Node.js 18 或更新版本：https://nodejs.org/'
  exit 1
fi
if ! node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 18 ? 0 : 1)'; then
  echo 'Node.js 版本过旧，请安装 Node.js 18 或更新版本：https://nodejs.org/'
  exit 1
fi
node scripts/validate.mjs
echo '请在浏览器打开终端显示的本机地址。保持窗口运行，按 Ctrl+C 停止。'
exec node server.mjs "$@"
