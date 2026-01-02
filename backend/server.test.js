const request = require('supertest');
const app = require('./server'); // 假設 server.js 導出 app

describe('API Tests', () => {
  it('should register a user', async () => {
    const response = await request(app)
      .post('/register')
      .send({ username: 'testuser', password: 'testpass' });
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('用戶註冊成功');
  });

  it('should login a user', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'testpass' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('should access protected route with token', async () => {
    const loginRes = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'testpass' });
    const token = loginRes.body.token;

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toContain('歡迎');
  });

  it('should reject invalid login', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'wrong', password: 'wrong' });
    expect(response.status).toBe(401);
  });
});