const express = require('express');
const logger = require('./simple-logger');

const app = express();
app.use(express.json());

// 簡單的測試路由
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.post('/test', (req, res) => {
  logger.info('Test request received');
  res.json({ message: 'Test successful' });
});

app.listen(3001, () => {
  logger.info('Test server running on port 3001');
});