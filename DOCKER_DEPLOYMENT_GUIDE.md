# 資訊安全專案 - Docker 部署指南

## 📋 概述

本指南提供完整的 Docker 容器化部署流程，包含前端、後端服務的建置、運行、測試和維護步驟。

## 🏗️ 專案架構

```
資訊安全專案/
├── backend/           # Node.js Express 後端
│   ├── Dockerfile     # 後端容器配置
│   ├── package.json
│   └── server.js
├── frontend/          # React 前端
│   ├── Dockerfile     # 前端容器配置
│   ├── nginx.conf     # Nginx 配置
│   └── src/
├── docker-compose.yml # 多服務編排配置
└── test-docker-https.bat # 測試腳本
```

## 🔧 環境準備

### 系統需求

- **作業系統**: Windows 10/11, macOS, Linux
- **Docker**: 20.10+ (包含 Docker Compose)
- **記憶體**: 至少 2GB RAM
- **磁碟空間**: 至少 2GB 可用空間

### 安裝 Docker

#### Windows
1. 下載 Docker Desktop: https://www.docker.com/products/docker-desktop
2. 執行安裝程式並完成安裝
3. 啟動 Docker Desktop 應用程式
4. 等待 Docker 服務完全載入 (通常需要 1-2 分鐘)

#### macOS
```bash
brew install --cask docker
# 或從官網下載安裝
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

### 驗證安裝

```bash
# 檢查 Docker 版本
docker --version
# 檢查 Docker Compose 版本
docker-compose --version
# 檢查 Docker 服務狀態
docker info
```

## 🚀 快速開始

### 方法一：使用測試腳本 (推薦)

1. **開啟 PowerShell 或命令提示字元**
2. **導航到專案目錄**
   ```bash
   cd c:\Users\reyli\Desktop\資訊安全
   ```
3. **運行測試腳本**
   ```bash
   .\test-docker-https.bat
   ```

腳本會自動執行以下步驟：
- 檢查 Docker 環境
- 驗證端口可用性
- 建置和啟動容器
- 提供測試說明

### 方法二：手動部署

#### 步驟 1：建置和啟動服務

```bash
# 從專案根目錄執行
docker-compose -p infosec up --build -d
```

#### 步驟 2：檢查服務狀態

```bash
# 查看容器狀態
docker-compose -p infosec ps

# 查看服務日誌
docker-compose -p infosec logs
```

#### 步驟 3：驗證部署

開啟瀏覽器訪問：
- **前端應用**: http://localhost:3000
- **後端 API (HTTP)**: http://localhost:3001
- **後端 API (HTTPS)**: https://localhost:3443

## 📁 詳細配置說明

### Docker Compose 配置

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "3002:3001"  # HTTP 端口映射
      - "3443:3443"  # HTTPS 端口映射
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your_docker_secret_key
      - PORT=3001
      - HTTPS_PORT=3443
    volumes:
      - ./backend/database.sqlite:/app/database.sqlite
    networks:
      - app-network

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### 後端 Dockerfile

```dockerfile
FROM node:16-alpine

WORKDIR /app

# 複製 package 文件
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製源代碼
COPY . .

# 重新建置原生模組
RUN npm rebuild sqlite3

# 創建資料庫文件
RUN touch database.sqlite

# 暴露端口
EXPOSE 3001 3443

# 啟動應用
CMD ["npm", "start"]
```

### 前端 Dockerfile

```dockerfile
# 建置階段
FROM node:16-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 生產階段
FROM nginx:alpine

# 複製建置好的應用
COPY --from=build /app/build /usr/share/nginx/html

# 複製 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

## 🧪 測試指南

### 功能測試清單

1. **用戶註冊**
   - 訪問 http://localhost:3000
   - 填寫用戶名和密碼
   - 點擊註冊按鈕

2. **用戶登入**
   - 使用註冊的帳號登入
   - 驗證 JWT token 生成

3. **雙因素認證 (2FA)**
   - 啟用 2FA 功能
   - 使用 Google Authenticator 掃描 QR 碼
   - 使用 TOTP 代碼登入

4. **受保護資源**
   - 登入後訪問受保護的端點
   - 驗證授權機制

5. **HTTPS 強制**
   - 嘗試訪問 HTTP 端點
   - 確認重定向到 HTTPS
   - 接受自簽名證書警告

6. **CTF Flag**
   - 使用特殊 header 訪問隱藏端點
   - 驗證安全機制

### API 端點測試

```bash
# 測試後端健康狀態
curl http://localhost:3001/

# 測試 HTTPS 端點
curl -k https://localhost:3443/

# 測試用戶註冊
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'

# 測試登入
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'

# 測試受保護資源 (需要 JWT token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/protected

# 測試 CTF Flag (需要特殊 header)
curl -H "x-ctf-token: infosec2026" \
  http://localhost:3001/secret-flag
```

## 🔧 維護與管理

### 查看日誌

```bash
# 查看所有服務日誌
docker-compose -p infosec logs

# 查看特定服務日誌
docker-compose -p infosec logs backend
docker-compose -p infosec logs frontend

# 實時查看日誌
docker-compose -p infosec logs -f
```

### 重啟服務

```bash
# 重啟所有服務
docker-compose -p infosec restart

# 重啟特定服務
docker-compose -p infosec restart backend
```

### 更新部署

```bash
# 重新建置並啟動
docker-compose -p infosec up --build -d

# 僅重新建置
docker-compose -p infosec build
```

### 進入容器

```bash
# 進入後端容器
docker-compose -p infosec exec backend sh

# 進入前端容器
docker-compose -p infosec exec frontend sh
```

## 🧹 清理與移除

### 停止服務

```bash
# 停止服務 (保留容器)
docker-compose -p infosec stop

# 停止並刪除容器
docker-compose -p infosec down
```

### 完全清理

```bash
# 停止服務並刪除容器、網路、卷
docker-compose -p infosec down -v

# 刪除未使用的鏡像
docker image prune -f

# 刪除未使用的卷
docker volume prune -f
```

### 使用清理腳本

```bash
# 使用測試腳本清理
.\test-docker-https.bat -Clean
```

## 🚨 故障排除

### 常見問題

#### 1. 端口衝突

**問題**: `bind: address already in use`
**解決方案**:
```bash
# 檢查端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :3443

# 殺死占用進程 (將 PID 替換為實際值)
taskkill /PID <PID> /F
```

#### 2. 建置失敗

**問題**: `npm install` 或 `npm run build` 失敗
**解決方案**:
```bash
# 清除 Docker 快取
docker system prune -f

# 重新建置
docker-compose -p infosec build --no-cache
```

#### 3. 資料庫連接失敗

**問題**: SQLite 資料庫無法訪問
**解決方案**:
```bash
# 檢查資料庫文件權限
docker-compose -p infosec exec backend ls -la database.sqlite

# 重新創建資料庫
docker-compose -p infosec exec backend rm database.sqlite
docker-compose -p infosec restart backend
```

#### 4. HTTPS 證書警告

**問題**: 瀏覽器顯示 "不安全的連接"
**解決方案**:
- 這是正常的，因為使用自簽名證書
- 在開發環境中點擊 "繼續前往" 或 "接受風險"
- 生產環境應使用有效的 SSL 證書

#### 5. 記憶體不足

**問題**: `Docker: out of memory`
**解決方案**:
- 增加 Docker Desktop 的記憶體限制
- 關閉其他應用程式
- 使用更輕量的基礎鏡像

### 診斷命令

```bash
# 查看容器資源使用
docker stats

# 查看 Docker 系統資訊
docker system df

# 檢查網路連接
docker network ls
docker network inspect infosec_app-network

# 查看容器詳細資訊
docker inspect infosec_backend_1
docker inspect infosec_frontend_1
```

## 🔒 安全注意事項

### 生產環境部署

1. **更改預設密鑰**
   ```bash
   # 在 docker-compose.yml 中修改
   JWT_SECRET=your_secure_random_key_here
   ```

2. **使用環境變數**
   ```bash
   # 創建 .env 文件
   echo "JWT_SECRET=your_secure_key" > .env
   echo "NODE_ENV=production" >> .env
   ```

3. **SSL 證書**
   - 生產環境使用 Let's Encrypt 或商業 SSL 證書
   - 配置 Nginx 或 Traefik 作為反向代理

4. **網路安全**
   - 使用內部網路，不要暴露資料庫端口
   - 配置防火牆規則
   - 定期更新基礎鏡像

### 開發環境安全

- 不要在生產環境使用開發模式的設定
- 定期更新 Docker 鏡像
- 監控容器日誌
- 使用 `.dockerignore` 排除敏感文件

## 📊 效能優化

### 鏡像優化

```dockerfile
# 使用多階段建置
FROM node:16-alpine as builder
# ... 建置步驟

FROM node:16-alpine as production
# ... 生產環境配置
```

### 卷掛載優化

```yaml
volumes:
  - ./backend/database.sqlite:/app/database.sqlite:rw
  - /app/node_modules  # 匿名卷，避免重複安裝
```

### 資源限制

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

## 📞 支援與幫助

### 獲取幫助

1. **檢查日誌**
   ```bash
   docker-compose -p infosec logs -f
   ```

2. **查看容器狀態**
   ```bash
   docker-compose -p infosec ps
   ```

3. **測試網路連接**
   ```bash
   docker-compose -p infosec exec backend curl -f http://localhost:3001/
   ```

### 常用命令速查表

| 命令 | 說明 |
|------|------|
| `docker-compose -p infosec up -d` | 啟動服務 |
| `docker-compose -p infosec down` | 停止服務 |
| `docker-compose -p infosec logs -f` | 查看日誌 |
| `docker-compose -p infosec restart` | 重啟服務 |
| `docker system prune -f` | 清理系統 |

---

## ✅ 部署檢查清單

- [ ] Docker 和 Docker Compose 已安裝
- [ ] 端口 3000, 3001, 3443 未被占用
- [ ] 專案文件完整 (Dockerfile, docker-compose.yml)
- [ ] 環境變數已配置
- [ ] 服務成功啟動
- [ ] 前端可正常訪問 (http://localhost:3000)
- [ ] 後端 API 可正常響應
- [ ] HTTPS 功能正常工作
- [ ] 資料庫連接正常
- [ ] 所有功能測試通過

**恭喜！您的資訊安全專案 Docker 部署已完成！🎉**