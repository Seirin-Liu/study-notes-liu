#!/bin/sh
# Finder starts .command files in Terminal with a limited PATH.
PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export PATH
cd "$(dirname "$0")" || exit 1
sh ./start-local.sh "$@"
result=$?
if [ "$result" -ne 0 ]; then
  printf '\n启动失败，请查看上方提示。按回车关闭窗口…'
  read -r reply || :
fi
exit "$result"
