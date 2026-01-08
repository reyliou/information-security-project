const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const https = require('https');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
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

// 設置信任代理 (允許 nginx 代理標頭)
app.set('trust proxy', true);

// 請求日誌記錄中間件 (優化設計 3: 結構化日誌系統)
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

// HTTPS 強制中間件 (後端安全設計 6: HTTPS 加密傳輸)
app.use((req, res, next) => {
  // 允許來自 nginx 代理的 HTTP 請求 (Docker 容器間通信)
  const forwardedHost = req.header('x-forwarded-host');
  const isFromProxy = forwardedHost && (forwardedHost.includes('localhost') || forwardedHost.includes('frontend'));

  // 在 Docker 環境中允許 HTTP 通信 (沒有 x-forwarded-proto 標頭表示直接容器間通信)
  const isDockerInternal = !req.header('x-forwarded-proto');

  if (!isFromProxy && !isDockerInternal && req.header('x-forwarded-proto') !== 'https' && req.protocol !== 'https') {
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
  password: Joi.string().min(6).required(),
  otpToken: Joi.string().length(6).pattern(/^\d+$/).optional() // 可選的6位數字
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
app.post('/api/register', async (req, res) => {
  const { error } = userSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { username, password } = req.body;

  try {
    // 檢查用戶是否已存在
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: '用戶名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 創建新用戶
    await User.create({
      username,
      password: hashedPassword,
      role: 'user' // 預設角色為一般使用者
    });

    res.status(201).json({ message: '用戶註冊成功' });
  } catch (error) {
    logger.error('註冊處理錯誤', { error: error.message, stack: error.stack });
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
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
app.post('/api/login', async (req, res) => {
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

    const { username, password, otpToken } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.securityEvent('FAILED_LOGIN_ATTEMPT', {
        ip: clientIP,
        username: username,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ error: '無效憑證' });
    }

    // 檢查是否啟用 2FA
    if (user.is2FAEnabled) {
      if (!otpToken) {
        return res.json({ requires2FA: true });
      }

      // 驗證 2FA 代碼
      const verified = speakeasy.totp.verify({
        secret: user.otpSecret,
        encoding: 'base32',
        token: otpToken,
        window: 2
      });

      if (!verified) {
        logger.securityEvent('FAILED_2FA_ATTEMPT', {
          ip: clientIP,
          username: username,
          userAgent: req.get('User-Agent')
        });
        return res.status(401).json({ error: '無效的 2FA 代碼' });
      }
    }

    const token = jwt.sign({ 
      username: user.username,
      role: user.role,
      id: user.id
    }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

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

// 2FA 相關路由

app.post('/api/enable-2fa', async (req, res) => {
  try {
    const { username } = req.body;

    // 查找用戶 (使用數據庫)
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    // 檢查是否已經啟用 2FA
    if (user.is2FAEnabled) {
      return res.status(400).json({ error: '2FA 已經啟用' });
    }

    // 生成 TOTP 密鑰
    const secret = speakeasy.generateSecret({
      name: `資訊安全專案 (${username})`,
      issuer: '資訊安全專案'
    });

    // 生成 QR 碼
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    // 更新用戶數據庫記錄
    await user.update({
      otpSecret: secret.base32,
      is2FAEnabled: false // 還沒有完成設置
    });

    logger.securityEvent('2FA_SECRET_GENERATED', {
      username: username,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({
      qrCode: qrCodeUrl,
      secret: secret.base32 // 提供備用密鑰
    });
  } catch (error) {
    logger.error('啟用 2FA 錯誤', { error: error.message, stack: error.stack });
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

app.post('/api/verify-2fa-setup', async (req, res) => {
  try {
    const { username, token } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    if (!user.otpSecret) {
      return res.status(400).json({ error: '尚未生成 2FA 密鑰' });
    }

    if (user.is2FAEnabled) {
      return res.status(400).json({ error: '2FA 已經啟用' });
    }

    // 驗證 TOTP 代碼
    const verified = speakeasy.totp.verify({
      secret: user.otpSecret,
      encoding: 'base32',
      token: token,
      window: 2 // 允許 2 個時間窗口的容錯
    });

    if (!verified) {
      return res.status(400).json({ error: '無效的 2FA 代碼' });
    }

    // 完成 2FA 設置
    await user.update({ is2FAEnabled: true });

    logger.securityEvent('2FA_SETUP_COMPLETED', {
      username: username,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({ message: '2FA 設置完成' });
  } catch (error) {
    logger.error('驗證 2FA 設置錯誤', { error: error.message, stack: error.stack });
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

app.post('/api/disable-2fa', async (req, res) => {
  try {
    const { username } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    await user.update({
      otpSecret: null,
      is2FAEnabled: false
    });

    logger.securityEvent('2FA_DISABLED', {
      username: username,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({ message: '2FA 已停用' });
  } catch (error) {
    logger.error('停用 2FA 錯誤', { error: error.message, stack: error.stack });
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

const authorizeRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未認證' });
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      return res.status(403).json({ error: '權限不足' });
    }

    next();
  };
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
app.get('/api/protected', authenticateToken, (req, res) => {
  const roleText = req.user.role === 'admin' ? '管理員' : '一般使用者';
  res.json({ 
    message: `歡迎, ${req.user.username}`,
    role: req.user.role,
    roleText: roleText,
    permissions: req.user.role === 'admin' ? 
      ['基本功能', '用戶管理', '系統統計', '管理員儀表板'] : 
      ['基本功能'],
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: 獲取所有用戶列表 (管理員專用)
 *     description: 只有管理員才能訪問的用戶管理功能
 *     tags: [管理員功能]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功獲取用戶列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: [admin, user]
 *                       is2FAEnabled:
 *                         type: boolean
 *       403:
 *         description: 權限不足
 */
app.get('/api/admin/users', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'is2FAEnabled'],
      order: [['createdAt', 'DESC']]
    });
    res.json({ users });
  } catch (error) {
    logger.error('獲取用戶列表錯誤', { error: error.message });
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

/**
 * @swagger
 * /admin/users/{id}/role:
 *   put:
 *     summary: 修改用戶角色 (管理員專用)
 *     description: 管理員可以修改其他用戶的角色
 *     tags: [管理員功能]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用戶 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *     responses:
 *       200:
 *         description: 角色修改成功
 *       403:
 *         description: 權限不足
 *       404:
 *         description: 用戶不存在
 */
app.put('/api/admin/users/:id/role', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: '無效的角色' });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    // 防止管理員移除自己的管理員權限
    if (user.id === req.user.id && role === 'user') {
      return res.status(400).json({ error: '不能移除自己的管理員權限' });
    }

    await user.update({ role });
    logger.info('用戶角色已修改', { admin: req.user.username, targetUser: user.username, newRole: role });
    res.json({ message: '用戶角色修改成功' });
  } catch (error) {
    logger.error('修改用戶角色錯誤', { error: error.message });
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: 管理員儀表板 (管理員專用)
 *     description: 管理員專用的系統統計資訊
 *     tags: [管理員功能]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功獲取儀表板數據
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 adminUsers:
 *                   type: integer
 *                 regularUsers:
 *                   type: integer
 *                 usersWith2FA:
 *                   type: integer
 */
app.get('/api/admin/dashboard', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const totalUsers = await User.count();
    const adminUsers = await User.count({ where: { role: 'admin' } });
    const regularUsers = await User.count({ where: { role: 'user' } });
    const usersWith2FA = await User.count({ where: { is2FAEnabled: true } });

    res.json({
      totalUsers,
      adminUsers,
      regularUsers,
      usersWith2FA
    });
  } catch (error) {
    logger.error('獲取儀表板數據錯誤', { error: error.message });
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
});

/**
 * @swagger
 * /admin/setup-first-admin:
 *   post:
 *     summary: 設置第一個管理員 (一次性使用)
 *     description: 將指定用戶設為管理員，僅在系統首次設置時使用
 *     tags: [管理員功能]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: 要設為管理員的用戶名
 *     responses:
 *       200:
 *         description: 管理員設置成功
 *       400:
 *         description: 用戶不存在或已是管理員
 */
app.post('/api/admin/setup-first-admin', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: '請提供用戶名' });
  }

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: '用戶已是管理員' });
    }

    await user.update({ role: 'admin' });
    logger.info('第一個管理員已設置', { username: user.username });
    res.json({ message: '管理員設置成功' });
  } catch (error) {
    logger.error('設置管理員錯誤', { error: error.message });
    res.status(500).json({ error: '伺服器內部錯誤' });
  }
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