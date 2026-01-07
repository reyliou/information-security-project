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
const logger = require('./logger');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
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
  // 非同步同步資料庫
  sequelize.sync().then(() => {
    logger.info('資料庫同步完成');
  }).catch(err => {
    logger.error('資料庫同步失敗', { error: err.message, stack: err.stack });
    logger.info('繼續啟動服務器（使用內存用戶存儲）');
  });

  // 啟動 HTTP 伺服器
  app.listen(PORT, () => {
    logger.info(`HTTP 伺服器運行在 http://localhost:${PORT}`, {
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // 在生產環境中啟動 HTTPS 伺服器
  if (process.env.NODE_ENV === 'production') {
    try {
      const sslOptions = generateSelfSignedCert();
      if (sslOptions) {
        const httpsServer = https.createServer(sslOptions, app);
        httpsServer.listen(HTTPS_PORT, () => {
          logger.info(`HTTPS 伺服器運行在 https://localhost:${HTTPS_PORT}`, {
            port: HTTPS_PORT,
            sslEnabled: true
          });
        });
      } else {
        logger.warn('跳過 HTTPS 伺服器啟動 (無有效證書)');
      }
    } catch (error) {
      logger.error('HTTPS 伺服器啟動失敗', { error: error.message, stack: error.stack });
      logger.info('繼續使用 HTTP 伺服器');
    }
  } else {
    logger.info('開發環境: 如需 HTTPS，請設置 NODE_ENV=production');
  }
}

// 中間件
app.use(helmet()); // 安全標頭
app.use(cors()); // CORS 保護
app.use(express.json());

// 請求日誌記錄中間件 (優化設計 3: 結構化日誌系統)
/*
app.use((req, res, next) => {
  const start = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';

  // 記錄請求開始
  logger.info('請求開始', {
    method: req.method,
    url: req.url,
    ip: clientIP,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // 攔截響應以記錄完成
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;

    logger.info('請求完成', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: clientIP,
      responseSize: Buffer.isBuffer(data) ? data.length : (data ? data.length : 0)
    });

    originalSend.call(this, data);
  };

  next();
});
*/

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
  message: '請求過多，請稍後再試',
  handler: (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    logger.securityEvent('RATE_LIMIT_EXCEEDED', {
      ip: clientIP,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({ error: '請求過多，請稍後再試' });
  }
});
app.use(limiter);

// Swagger API 文檔配置 (優化設計 4: API 文檔)
/*
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '資訊安全 API',
      version: '1.0.0',
      description: '資訊安全專案的 REST API 文檔，包含身份驗證、安全功能和 CTF 挑戰',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: '開發環境',
      },
      {
        url: `https://localhost:${HTTPS_PORT}`,
        description: '生產環境 (HTTPS)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./server.js'], // 掃描當前文件的註釋
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 提供原始 Swagger JSON
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
*/

/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: API 文檔界面
 *     description: 互動式 Swagger UI API 文檔界面
 *     tags: [文檔]
 *     responses:
 *       200:
 *         description: 返回 Swagger UI 界面
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: HTML 頁面內容
 */

/**
 * @swagger
 * /swagger.json:
 *   get:
 *     summary: OpenAPI 規範 JSON
 *     description: 返回 OpenAPI 3.0 規範的 JSON 文檔
 *     tags: [文檔]
 *     responses:
 *       200:
 *         description: 返回 OpenAPI JSON 規範
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: OpenAPI 3.0 規範文檔
 */

// 模擬用戶資料庫
const users = [];

// 輸入驗證模式 (後端安全設計 2: 輸入驗證)
const userSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(6).required()
});

/**
 * @swagger
 * /register:
 *   post:
 *     summary: 用戶註冊
 *     description: 註冊新用戶帳號，密碼將被安全雜湊
 *     tags: [認證]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用戶名稱 (3-30個字符)
 *               password:
 *                 type: string
 *                 description: 密碼 (至少6個字符)
 *     responses:
 *       201:
 *         description: 註冊成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 用戶註冊成功
 *       400:
 *         description: 輸入驗證失敗
 */
app.post('/register', async (req, res) => {
  const { error } = userSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  res.status(201).json({ message: '用戶註冊成功' });
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: 用戶登入
 *     description: 用戶登入並獲取 JWT 令牌
 *     tags: [認證]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用戶名稱
 *               password:
 *                 type: string
 *                 description: 密碼
 *     responses:
 *       200:
 *         description: 登入成功，返回 JWT 令牌
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT 認證令牌
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: 輸入驗證失敗
 *       401:
 *         description: 認證失敗
 *       429:
 *         description: 請求過於頻繁（速率限制）
 */
app.post('/login', async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';

  try {
    const { error } = userSchema.validate(req.body);
    if (error) {
      logger.securityEvent('INVALID_LOGIN_INPUT', {
        ip: clientIP,
        error: error.details[0].message,
        userAgent: req.get('User-Agent')
      });
      return res.status(400).json({ error: error.details[0].message });
    }

    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.securityEvent('FAILED_LOGIN_ATTEMPT', {
        ip: clientIP,
        username: username,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ error: '無效憑證' });
    }

    const token = jwt.sign({ username }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    logger.securityEvent('SUCCESSFUL_LOGIN', {
      ip: clientIP,
      username: username,
      userAgent: req.get('User-Agent')
    });

    res.json({ token });
  } catch (error) {
    logger.error('登入處理錯誤', {
      ip: clientIP,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
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

/**
 * @swagger
 * /protected:
 *   get:
 *     summary: 受保護的資源
 *     description: 需要有效的 JWT 令牌才能訪問的受保護資源
 *     tags: [受保護資源]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功訪問受保護資源
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 歡迎, username
 *       401:
 *         description: 未提供認證令牌
 *       403:
 *         description: 無效或過期的令牌
 */
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: `歡迎, ${req.user.username}` });
});

/**
 * @swagger
 * /secret-flag:
 *   get:
 *     summary: 隱藏的 CTF Flag
 *     description: 隱藏的端點，需要特殊的 CTF token header 才能訪問。這個端點用於 CTF 挑戰。
 *     tags: [CTF 挑戰]
 *     parameters:
 *       - in: header
 *         name: x-ctf-token
 *         required: true
 *         schema:
 *           type: string
 *         description: 特殊的 CTF 認證令牌
 *         example: infosec2026
 *     responses:
 *       200:
 *         description: 成功獲取 CTF Flag
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 恭喜你找到了隱藏的 Flag！
 *                 flag:
 *                   type: string
 *                   description: CTF Flag 內容
 *                 hint:
 *                   type: string
 *                   example: 你成功發現了這個隱藏的端點！
 *       403:
 *         description: 存取被拒絕，CTF token 無效
 *       500:
 *         description: 伺服器內部錯誤
 */
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