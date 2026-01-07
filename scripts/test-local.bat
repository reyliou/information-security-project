@echo off
chcp 65001 >nul
echo ========================================
echo 資訊安全專案 - 本地測試腳本
echo ========================================
echo.

echo [1/4] 安裝後端依賴...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo 後端依賴安裝失敗
    pause
    exit /b 1
)
echo 後端依賴安裝完成
echo.

echo [2/4] 安裝前端依賴...
cd ../frontend
call npm install
if %errorlevel% neq 0 (
    echo 前端依賴安裝失敗
    pause
    exit /b 1
)
echo 前端依賴安裝完成
echo.

echo [3/4] 啟動服務...
echo 啟動後端服務...
cd ../backend
start "Backend Server" cmd /c "npm start"
timeout /t 3 /nobreak > nul

echo 啟動前端應用...
cd ../frontend
start "Frontend App" cmd /c "npm start"
timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo 服務已啟動！
echo 後端: http://localhost:3001
echo 前端: http://localhost:3000
echo ========================================
echo.
echo 現在可以測試以下功能:
echo 1. 用戶註冊和登入
echo 2. 2FA 啟用和驗證
echo 3. 受保護資源存取
echo.
echo 測試完成後，按任意鍵關閉所有服務...
pause > nul

echo.
echo 關閉服務...
taskkill /f /im node.exe > nul 2>&1
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Backend Server*" > nul 2>&1
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Frontend App*" > nul 2>&1
echo 所有服務已關閉！
pause