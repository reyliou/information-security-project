# 專案結構說明

## 📁 資料夾組織

本專案採用清晰的資料夾結構來組織不同類型的文件：

### `/docs` - 文檔目錄
存放所有專案相關的文檔檔案：
- `DOCKER_DEPLOYMENT_GUIDE.md` - Docker 部署完整指南
- `DEMO_SCRIPT.md` - 專案演示腳本
- `prompt.md` - 專案需求和提示

### `/scripts` - 腳本目錄
存放所有測試和工具腳本：
- `test-local.bat` - 本地開發環境測試
- `test-docker.bat` - Docker 環境測試
- `test-docker-https.bat` - HTTPS 支援的 Docker 測試
- `test-docker.ps1` - PowerShell Docker 測試腳本
- `run-tests.bat` - 互動式測試選單
- `demo-script.bat` - 演示腳本
- `demo-https.bat` - HTTPS 功能演示

### `/backend` - 後端代碼
Node.js Express 應用程式：
- 實現 5 項後端安全設計
- JWT 認證和 2FA
- HTTPS 強制功能
- CTF Flag 挑戰

### `/frontend` - 前端代碼
React 應用程式：
- 實現 3 項前端安全設計
- 安全的 API 通信
- 雙因素認證界面

## 🚀 快速開始

### 本地開發
```bash
# 安裝依賴並啟動服務
.\scripts\test-local.bat
```

### Docker 部署
```bash
# 建置和運行容器
.\scripts\test-docker-https.bat
```

### 專案演示
```bash
# 運行演示腳本
.\scripts\demo-script.bat
```

## 📖 文檔

- **部署指南**: `docs/DOCKER_DEPLOYMENT_GUIDE.md`
- **演示腳本**: `docs/DEMO_SCRIPT.md`
- **專案總結**: `PROJECT_SUMMARY.md`
- **測試說明**: `TESTING.md`

## 🔧 維護

定期檢查腳本和文檔的更新，請參考各資料夾中的 README 文件。