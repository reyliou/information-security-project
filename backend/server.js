const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { sequelize, User } = require('./models/User');
require('dotenv').config();

const PORT = process.env.PORT || 3001;
const app = express();

// ... existing code ...

// ... existing code ...

module.exports = app; // 添加導出

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`後端運行在 http://localhost:${PORT}`);
  });
}

// 中間件
app.use(helmet()); // 安全標頭
app.use(cors()); // CORS 保護
app.use(express.json());

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