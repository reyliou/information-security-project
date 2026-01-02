# 資訊安全專案

## 專案概述
這是一個全端 web 應用，實作資訊安全設計。後端使用 Node.js + Express，前端使用 React。

### 功能
- 用戶註冊與登入
- JWT 認證
- 受保護資源存取

### 架構
- `backend/`: Express 伺服器
- `frontend/`: React 應用
- `.github/workflows/`: CI/CD workflow

### 部署方式
1. 安裝依賴：`npm install` (後端與前端)
2. 運行後端：`npm start` (在 backend/)
3. 運行前端：`npm start` (在 frontend/)

### 運行流程
1. 啟動後端伺服器 (http://localhost:3001)
2. 啟動前端應用 (http://localhost:3000)
3. 在前端註冊/登入，測試安全功能

## 安全設計說明

### 後端安全設計 (5 項)
1. **速率限制 (Rate Limiting)**: 使用 express-rate-limit 防止 DoS 攻擊。
2. **輸入驗證**: 使用 Joi 驗證用戶輸入，防止注入攻擊。
3. **密碼雜湊**: 使用 bcrypt 雜湊密碼，保護用戶憑證。
4. **JWT 認證**: 使用 JSON Web Token 進行身份驗證。
5. **授權控制**: 檢查令牌確保資源存取權限。

### 前端安全設計 (3 項)
1. **Content Security Policy (CSP)**: 在 index.html 中設定 CSP，防止 XSS。
2. **輸入消毒**: 在 React 中使用受控組件，防止惡意輸入。
3. **HTTPS 強制**: (待實作) 使用 HTTPS 加密傳輸。

### 其他優化設計 (2 項)
1. **環境變數管理**: 使用 dotenv 管理敏感資訊，避免硬編碼。
2. **CI/CD 集成**: 使用 GitHub Actions 進行自動安全掃描。

## 測試環境
- Node.js v16+
- npm v8+
- 瀏覽器: Chrome/Firefox

## 測試腳本

### 本地測試
運行 `test-local.bat` 來啟動本地開發環境：
```bash
test-local.bat
```

### Docker 測試
運行 `test-docker.ps1` 來測試 Docker 部署：
```powershell
.\test-docker.ps1
```

清理 Docker 容器：
```powershell
.\test-docker.ps1 -Clean
```

**注意**: Docker 測試腳本使用 PowerShell 來解決中文顯示亂碼問題。

## 資料庫建置方式與資料表設計

### 資料庫
使用 SQLite 作為資料庫，檔案儲存在 `backend/database.sqlite`。

### 建置方式
1. 安裝依賴：`npm install sqlite3 sequelize`
2. 啟動後端：`npm start`，Sequelize 會自動同步資料庫。

### 資料表設計
#### User 表
- **id**: INTEGER (主鍵，自動增量)
- **username**: VARCHAR(255) (唯一，非空)
- **password**: VARCHAR(255) (非空，雜湊儲存)
- **createdAt**: DATETIME (自動)
- **updatedAt**: DATETIME (自動)

**注意**: 密碼欄位儲存 bcrypt 雜湊值，不儲存明文密碼。