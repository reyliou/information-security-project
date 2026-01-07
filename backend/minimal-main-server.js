const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./logger');

const PORT = process.env.PORT || 3001;
const app = express();

// 中間件
app.use(helmet()); // 安全標頭
app.use(cors()); // CORS 保護
app.use(express.json());

// 簡單的測試路由
app.post('/register', (req, res) => {
  res.json({ message: '註冊成功' });
});

app.listen(PORT, () => {
  logger.info(`HTTP 伺服器運行在 http://localhost:${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});