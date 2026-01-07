# 資訊安全專案 - Docker 測試腳本 (PowerShell 版本)
# 使用 UTF-8 編碼解決中文顯示問題

param(
    [switch]$Clean
)

# 設置控制台編碼
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "資訊安全專案 - Docker 測試腳本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($Clean) {
    Write-Host "[清理模式] 停止並刪除容器..." -ForegroundColor Yellow
    docker-compose -p infosec down -v 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "容器清理完成！" -ForegroundColor Green
    } else {
        Write-Host "清理過程中出現錯誤" -ForegroundColor Red
    }
    exit
}

Write-Host "[1/4] 檢查 Docker..." -ForegroundColor Yellow
$dockerVersion = docker --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker 版本: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "錯誤: Docker 未安裝或未運行" -ForegroundColor Red
    Write-Host "請安裝並啟動 Docker Desktop" -ForegroundColor Red
    Write-Host "下載地址: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Read-Host "按 Enter 鍵退出"
    exit 1
}

Write-Host ""
Write-Host "[2/4] 檢查 Docker Compose..." -ForegroundColor Yellow
$composeVersion = docker-compose --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker Compose 版本: $composeVersion" -ForegroundColor Green
} else {
    Write-Host "錯誤: Docker Compose 未安裝" -ForegroundColor Red
    Read-Host "按 Enter 鍵退出"
    exit 1
}

Write-Host ""
Write-Host "[3/4] 建置並啟動容器..." -ForegroundColor Yellow
Write-Host "正在建置和啟動服務..." -ForegroundColor Cyan
Write-Host "這可能需要幾分鐘，請稍候..." -ForegroundColor Cyan
Write-Host ""

# 先清理舊容器
docker-compose -p infosec down -v 2>$null | Out-Null

# 建置並啟動
docker-compose -p infosec up --build -d
if ($LASTEXITCODE -eq 0) {
    Write-Host "" -ForegroundColor Green
    Write-Host "服務啟動成功！" -ForegroundColor Green
    Write-Host "前端: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "後端: http://localhost:3001" -ForegroundColor Cyan
    Write-Host ""

    # 檢查容器狀態
    Write-Host "容器狀態:" -ForegroundColor Yellow
    docker-compose -p infosec ps

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "測試說明:" -ForegroundColor White
    Write-Host "1. 開啟瀏覽器訪問 http://localhost:3000" -ForegroundColor White
    Write-Host "2. 測試用戶註冊和登入功能" -ForegroundColor White
    Write-Host "3. 測試 2FA 功能" -ForegroundColor White
    Write-Host "4. 測試受保護資源存取" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "測試完成後，運行以下命令清理:" -ForegroundColor Yellow
    Write-Host ".\test-docker.ps1 -Clean" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "按 Enter 鍵繼續 (容器會在背景運行)"
} else {
    Write-Host "建置失敗！" -ForegroundColor Red
    Write-Host "請檢查 Docker 配置和網路連接" -ForegroundColor Red
    Read-Host "按 Enter 鍵退出"
    exit 1
}