#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo '请先安装 Node.js 18 或更新版本：https://nodejs.org/'
  exit 1
fi
node scripts/validate.mjs
exec node server.mjs
