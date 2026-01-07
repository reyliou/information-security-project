const express = require('express');

const app = express();
app.use(express.json());

// 簡單的測試路由
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.post('/test', (req, res) => {
  console.log('Test request received');
  res.json({ message: 'Test successful' });
});

app.listen(3003, (err) => {
  if (err) {
    console.error('Server failed to start:', err);
  } else {
    console.log('Test server running on port 3003');
  }
});