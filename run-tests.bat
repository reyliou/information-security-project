@echo off
echo ========================================
echo 資訊安全專案 - 完整測試套件
echo ========================================
echo.

echo 選擇測試類型:
echo [1] 本地測試 (Node.js)
echo [2] Docker 測試
echo [3] 退出
echo.
set /p choice="請輸入選擇 (1-3): "

if "%choice%"=="1" goto local
if "%choice%"=="2" goto docker
if "%choice%"=="3" goto exit

echo 無效選擇
pause
exit /b 1

:local
echo 執行本地測試...
call test-local.bat
goto end

:docker
echo 執行 Docker 測試...
call test-docker.bat
goto end

:exit
echo 再見！
goto end

:end