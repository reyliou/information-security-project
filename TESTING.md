# 資訊安全專案測試指南

## 測試前準備

### 環境需求
- Node.js v16+
- npm v8+
- Docker & Docker Compose (用於容器化測試)
- 瀏覽器: Chrome/Firefox

### 專案結構確認
```
資訊安全/
├── backend/
│   ├── models/
│   ├── package.json
│   ├── server.js
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .github/workflows/
└── README.md
```

---

## 本地測試步驟

### 1. 安裝依賴
```bash
# 後端依賴
cd backend
npm install

# 前端依賴
cd ../frontend
npm install
```

### 2. 啟動後端服務
```bash
cd backend
npm start
```
- 預期輸出: `後端運行在 http://localhost:3001`
- 服務將在背景運行

### 3. 啟動前端應用 (新終端機)
```bash
cd frontend
npm start
```
- 預期輸出: 編譯成功，應用運行在 http://localhost:3000
- 自動開啟瀏覽器，或手動訪問

### 4. 測試用戶註冊
1. 開啟瀏覽器訪問 http://localhost:3000
2. 在登入表單中輸入:
   - 用戶名: `testuser`
   - 密碼: `testpass123`
3. 點擊 **註冊** 按鈕
4. 預期結果: 顯示 "註冊成功！請登入。"

### 5. 測試基本登入 (無 2FA)
1. 使用相同憑證點擊 **登入**
2. 預期結果: 顯示 "登入成功！" 並進入儀表板
3. 點擊 **存取受保護資源**
4. 預期結果: 顯示 "歡迎, testuser"
5. 點擊 **登出** 返回登入頁面

### 6. 測試 2FA 啟用
1. 重新註冊新用戶: `testuser2` / `testpass123`
2. 點擊 **啟用 2FA** 按鈕
3. 預期結果: 顯示 QR 碼和成功訊息
4. 使用手機 App (如 Google Authenticator) 掃描 QR 碼

### 7. 測試 2FA 登入
1. 使用 `testuser2` 點擊 **登入**
2. 輸入密碼後，系統要求 2FA 代碼
3. 在手機 App 中獲取 6 位代碼並輸入
4. 點擊 **驗證 2FA**
5. 預期結果: 登入成功並進入儀表板

### 8. 測試安全功能
1. **速率限制**: 快速重複請求登入 API 多次
   - 預期結果: 收到 "請求過多，請稍後再試" 錯誤
2. **輸入驗證**: 嘗試註冊無效用戶名/密碼
   - 預期結果: 顯示驗證錯誤訊息
3. **授權控制**: 嘗試直接訪問受保護路由 (無令牌)
   - 預期結果: 收到 401 錯誤

---

## Docker 容器化測試

### 1. 確保 Docker 運行
```bash
docker --version
docker-compose --version
```

### 2. 建置並啟動容器
```bash
# 在專案根目錄
docker-compose up --build
```
- 建置過程可能需要幾分鐘
- 預期輸出: 所有服務啟動成功

### 3. 驗證服務運行
```bash
docker ps
```
- 應看到 2 個容器運行:
  - `資訊安全_backend_1`
  - `資訊安全_frontend_1`

### 4. 測試應用功能
1. 訪問前端: http://localhost:3000
2. 訪問後端 API: http://localhost:3001
3. 重複上述本地測試步驟 4-8

### 5. 檢查日誌
```bash
# 查看後端日誌
docker-compose logs backend

# 查看前端日誌
docker-compose logs frontend
```

### 6. 清理容器 (測試後)
```bash
docker-compose down
docker-compose down -v  # 包含卷
```

---

## CI/CD 測試

### GitHub Actions 驗證
1. 推送程式碼至 GitHub
2. 進入倉庫的 **Actions** 標籤
3. 確認 "Security Scan" workflow 運行
4. 查看 CodeQL 掃描結果

---

## 故障排除

### 常見問題

**端口衝突**
- 錯誤: `EADDRINUSE`
- 解決: 關閉其他 Node.js 進程，或更改端口

**資料庫錯誤**
- 錯誤: SQLite 相關錯誤
- 解決: 確保寫入權限，刪除 `database.sqlite` 重新啟動

**Docker 建置失敗**
- 檢查 Docker Desktop 運行
- 清除 Docker 快取: `docker system prune`

**2FA 不工作**
- 確保手機時間同步
- 檢查 QR 碼正確掃描
- 驗證 secret 正確儲存

### 測試數據清理
```bash
# 本地
rm backend/database.sqlite

# Docker
docker-compose down -v
```

---

## 測試完成檢查清單

- [ ] 後端服務啟動成功
- [ ] 前端應用載入正常
- [ ] 用戶註冊功能正常
- [ ] 基本登入 (無 2FA) 正常
- [ ] 2FA 啟用和 QR 碼生成正常
- [ ] 2FA 登入驗證正常
- [ ] 受保護資源存取正常
- [ ] 速率限制生效
- [ ] 輸入驗證生效
- [ ] Docker 容器建置成功
- [ ] Docker 環境功能正常
- [ ] CI/CD workflow 運行正常

所有測試通過後，專案準備就緒！