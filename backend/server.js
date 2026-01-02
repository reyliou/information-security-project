const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const https = require('https');
const crypto = require('crypto');
const { sequelize, User } = require('./models/User');
require('dotenv').config();

const PORT = process.env.PORT || 3001;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const app = express();

// 生成自簽名 SSL 證書 (僅用於開發環境)
function generateSelfSignedCert() {
  // 在開發環境中返回 null，讓 Node.js 使用默認證書
  return null;
}

module.exports = app; // 添加導出

if (require.main === module) {
  // 同步資料庫
  sequelize.sync().then(() => {
    // 啟動 HTTP 伺服器
    app.listen(PORT, () => {
      console.log(`HTTP 伺服器運行在 http://localhost:${PORT}`);
    });

    // 在生產環境中啟動 HTTPS 伺服器
    if (process.env.NODE_ENV === 'production') {
      try {
        const sslOptions = generateSelfSignedCert();
        if (sslOptions) {
          const httpsServer = https.createServer(sslOptions, app);
          httpsServer.listen(HTTPS_PORT, () => {
            console.log(`HTTPS 伺服器運行在 https://localhost:${HTTPS_PORT}`);
          });
        } else {
          console.log('跳過 HTTPS 伺服器啟動 (無有效證書)');
        }
      } catch (error) {
        console.warn('HTTPS 伺服器啟動失敗:', error.message);
        console.log('繼續使用 HTTP 伺服器');
      }
    } else {
      console.log('開發環境: 如需 HTTPS，請設置 NODE_ENV=production');
    }
  }).catch(err => {
    console.error('資料庫同步失敗:', err);
  });
}

// 中間件
app.use(helmet()); // 安全標頭
app.use(cors()); // CORS 保護
app.use(express.json());

// HTTPS 強制中間件 (後端安全設計 6: HTTPS 加密傳輸)
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && req.protocol !== 'https') {
    // 在生產環境中重定向到 HTTPS
    if (process.env.NODE_ENV === 'production') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    // 在開發環境中發出警告
    console.warn('警告: 請求使用 HTTP 而非 HTTPS。在生產環境中應強制使用 HTTPS。');
  }
  next();
});

// 速率限制 (後端安全設計 1: 防止 DoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 每個 IP 最多 100 請求
  message: '請求過多，請稍後再試'
});
app.use(limiter);

// 模擬用戶資料庫
const users = [];

// 輸入驗證模式 (後端安全設計 2: 輸入驗證)
const userSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(6).required()
});

// 註冊路由 (後端安全設計 3: 密碼雜湊)
app.post('/register', async (req, res) => {
  const { error } = userSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  res.status(201).json({ message: '用戶註冊成功' });
});

// 登入路由 (後端安全設計 4: JWT 認證)
app.post('/login', async (req, res) => {
  const { error } = userSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: '無效憑證' });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  res.json({ token });
});

// 受保護路由 (後端安全設計 5: 授權)
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '存取拒絕' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) return res.status(403).json({ error: '無效令牌' });
    req.user = user;
    next();
  });
};

app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: `歡迎, ${req.user.username}` });
});

// 隱藏的 CTF Flag 路由 - 需要特殊 header
app.get('/secret-flag', (req, res) => {
  const specialHeader = req.headers['x-ctf-token'];

  if (specialHeader === 'infosec2026') {
    const fs = require('fs');
    const path = require('path');

    try {
      const flagPath = path.join(__dirname, 'flag.txt');
      const flag = fs.readFileSync(flagPath, 'utf8');
      res.json({
        message: '恭喜你找到了隱藏的 Flag！',
        flag: flag.trim(),
        hint: '你成功發現了這個隱藏的端點！'
      });
    } catch (error) {
      res.status(500).json({ error: 'Flag 文件讀取失敗' });
    }
  } else {
    res.status(403).json({
      error: '存取被拒絕',
      hint: '你需要正確的 CTF token 才能獲取 flag'
    });
  }
});

// 服務器啟動邏輯已經在上面處理了