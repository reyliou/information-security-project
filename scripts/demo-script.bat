@echo off
chcp 65001 >nul
echo ========================================
echo 資訊安全專案 - Demo 展示腳本
echo ========================================
echo.
echo 快速 Demo 流程：
echo.
echo [1] 本地環境測試
echo [2] Docker 環境測試
echo [3] CTF Flag 測試
echo [4] 清理環境
echo.
echo 詳細腳本請參考 DEMO_SCRIPT.md
echo.
set /p choice="選擇操作 (1-4): "

if "%choice%"=="1" (
    echo.
    echo [本地環境測試]
    echo 啟動本地開發服務...
    call test-local.bat
) else if "%choice%"=="2" (
    echo.
    echo [Docker 環境測試]
    echo 啟動 Docker 容器...
    call test-docker.bat
) else if "%choice%"=="3" (
    echo.
    echo [CTF Flag 測試]
    echo 測試 CTF Flag 功能...
    echo.
    echo 測試 1: 無認證存取 (應該失敗)
    curl http://localhost:3002/secret-flag 2>nul
    echo.
    echo 測試 2: 正確認證 (應該成功)
    curl -H "x-ctf-token: infosec2026" http://localhost:3002/secret-flag 2>nul
    echo.
    pause
) else if "%choice%"=="4" (
    echo.
    echo [清理環境]
    echo 停止所有服務...
    call test-docker.bat -Clean
    echo 清理完成！
) else (
    echo 無效選擇
)

echo.
echo Demo 腳本執行完畢！
pause
