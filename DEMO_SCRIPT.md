# 資訊安全專案 Demo 腳本

## 🎬 Demo 視頻腳本 (約 8-10 分鐘)

### 📋 準備工作
- 開啟命令提示字元 (cmd 或 PowerShell)
- 開啟瀏覽器 (Chrome/Firefox)
- 確保 Docker Desktop 正在運行
- 專案已從 GitHub clone 下來

---

## 📖 第一部分：專案介紹 (1 分鐘)

### 1. 展示專案結構
```bash
# 進入專案目錄
cd 資訊安全專案目錄

# 展示專案結構
tree /F
```

**講解內容：**
- 這是一個全端 Web 應用，實作資訊安全設計
- 後端：Node.js + Express + SQLite
- 前端：React + 安全 headers
- 部署：Docker + Docker Compose
- 測試：完整的自動化測試腳本

### 2. 展示專案特色
```bash
# 展示 README
type README.md
```

**講解內容：**
- 5 項後端安全設計
- 3 項前端安全設計
- 2 項優化設計
- 加分項目：Docker、2FA、CI/CD、CTF Flag

---

## 🏠 第二部分：本地開發環境測試 (3 分鐘)

### 1. 啟動本地測試環境
```bash
# 運行本地測試腳本
test-local.bat
```

**展示內容：**
- 腳本檢查並安裝依賴
- 啟動後端服務 (port 3001)
- 啟動前端服務 (port 3000)
- 顯示服務狀態

### 2. 測試基本功能
**在瀏覽器中操作：**
- 開啟 http://localhost:3000
- 註冊新用戶 (testuser/123456)
- 登入系統
- 查看受保護資源

### 3. 測試 2FA 功能
**在瀏覽器中操作：**
- 進入 2FA 設置頁面
- 使用手機掃描 QR 碼
- 輸入 2FA 驗證碼
- 測試登入時需要 2FA

### 4. 測試安全功能
**測試速率限制：**
```bash
# 快速發送多個請求測試速率限制
for /L %i in (1,1,20) do curl -X POST http://localhost:3001/login -H "Content-Type: application/json" -d "{\"username\":\"test\",\"password\":\"test\"}"
```

**測試輸入驗證：**
```bash
# 測試 SQL 注入防護
curl -X POST http://localhost:3001/register -H "Content-Type: application/json" -d "{\"username\":\"admin'; DROP TABLE users;--\",\"password\":\"123\"}"
```

---

## 🐳 第三部分：Docker 生產環境測試 (3 分鐘)

### 1. 清理本地服務
```bash
# 停止本地服務 (Ctrl+C 或關閉視窗)
# 或者使用任務管理器結束 node.exe 進程
```

### 2. 啟動 Docker 環境
```bash
# 運行 Docker 測試腳本
test-docker.bat
```

**展示內容：**
- Docker 環境檢查
- 容器建置過程
- 服務啟動狀態
- 端口映射說明

### 3. 測試生產環境功能
**在瀏覽器中操作：**
- 開啟 http://localhost:3000 (前端)
- 測試所有功能與本地相同
- 驗證資料持久性 (用戶資料保留)

### 4. 檢查容器狀態
```bash
# 檢查運行中的容器
docker-compose -p infosec ps

# 查看容器日誌
docker-compose -p infosec logs backend
```

---

## 🛡️ 第四部分：CTF Flag 挑戰 (1 分鐘)

### 1. 展示隱藏功能
```bash
# 測試沒有認證的存取 (應該失敗)
curl http://localhost:3002/secret-flag
```

### 2. 展示正確的存取方式
```bash
# 使用正確的 CTF token
curl -H "x-ctf-token: infosec2026" http://localhost:3002/secret-flag
```

**講解內容：**
- 隱藏端點發現
- Header 認證機制
- 安全測試概念

---

## 🧹 第五部分：清理和總結 (1 分鐘)

### 1. 清理 Docker 環境
```bash
# 停止並刪除容器
test-docker.bat -Clean

# 或者手動清理
docker-compose -p infosec down -v
```

### 2. 專案總結
**講解內容：**
- 實現了所有課程要求
- 包含多項加分功能
- 完整的開發到部署流程
- 良好的程式碼品質和文檔

### 3. Q&A 時間
- 開放觀眾提問
- 展示原始碼結構
- 解釋關鍵安全實現

---

## 📝 Demo 檢查清單

### 必須展示的功能：
- [ ] 專案結構說明
- [ ] 本地環境啟動
- [ ] 用戶註冊/登入
- [ ] 2FA 功能完整流程
- [ ] Docker 容器建置
- [ ] 生產環境測試
- [ ] CTF Flag 挑戰
- [ ] 環境清理

### 技術要點：
- [ ] 5 項後端安全設計
- [ ] 3 項前端安全設計
- [ ] 2 項優化設計
- [ ] Docker 部署流程
- [ ] 測試腳本使用

### 錄製建議：
- 使用螢幕錄製軟體 (OBS Studio, Bandicam)
- 同時顯示命令行和瀏覽器
- 語速適中，解釋每個步驟
- 總長度控制在 8-10 分鐘
- 確保聲音清晰

---

## 🚀 快速測試命令 (用於驗證)

```bash
# 1. 本地測試
test-local.bat

# 2. Docker 測試
test-docker.bat

# 3. CTF Flag 測試
curl -H "x-ctf-token: infosec2026" http://localhost:3002/secret-flag

# 4. 清理
test-docker.bat -Clean
```

---

## 📞 聯絡資訊
- GitHub: https://github.com/reyliou/information-security-project
- Demo 視頻: [上傳後的連結]