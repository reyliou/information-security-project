const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/test.log' })
  ]
});

// 安全事件日誌記錄函數
logger.securityEvent = (event, details) => {
  logger.warn(`SECURITY: ${event}`, {
    eventType: 'security',
    ...details,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;