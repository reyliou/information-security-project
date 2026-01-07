const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello');
});

const server = app.listen(3004, () => {
  console.log('Server on 3004');
});

process.on('SIGINT', () => {
  server.close();
});