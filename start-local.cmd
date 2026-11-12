@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 18 或更新版本：https://nodejs.org/
  echo 安装完成后再次双击本文件，无需运行 npm install。
  pause
  exit /b 1
)
node scripts/validate.mjs
if errorlevel 1 (
  echo 题库存在错误，请修正后再启动。
  pause
  exit /b 1
)
set PORT=4318
echo 浏览器地址：http://127.0.0.1:4318/
echo 请保留此窗口。关闭窗口或按 Ctrl+C 即停止服务。
start "" "http://127.0.0.1:4318/"
node server.mjs
pause
