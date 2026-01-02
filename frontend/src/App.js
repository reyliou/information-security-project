import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleRegister = async () => {
    try {
      const response = await axios.post('http://localhost:3001/register', { username, password });
      setMessage('註冊成功！請登入。');
    } catch (error) {
      setMessage(error.response?.data?.error || '註冊失敗');
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3001/login', { username, password });
      setToken(response.data.token);
      setIsLoggedIn(true);
      setMessage('登入成功！');
    } catch (error) {
      setMessage(error.response?.data?.error || '登入失敗');
    }
  };

  const handleProtected = async () => {
    try {
      const response = await axios.get('http://localhost:3001/protected', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.error || '存取失敗');
    }
  };

  const handleLogout = () => {
    setToken('');
    setIsLoggedIn(false);
    setMessage('已登出');
  };

  return (
    <div className="app">
      <header className="header">
        <h1>資訊安全專案</h1>
        <p>安全的用戶認證系統</p>
      </header>

      <main className="main">
        {!isLoggedIn ? (
          <div className="auth-container">
            <div className="auth-card">
              <h2>登入或註冊</h2>
              <form className="auth-form">
                <div className="input-group">
                  <label htmlFor="username">用戶名</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="輸入用戶名"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="password">密碼</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="輸入密碼"
                  />
                </div>
                <div className="button-group">
                  <button type="button" onClick={handleRegister} className="btn btn-secondary">
                    註冊
                  </button>
                  <button type="button" onClick={handleLogin} className="btn btn-primary">
                    登入
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <h2>歡迎回來！</h2>
            <button onClick={handleProtected} className="btn btn-success">
              存取受保護資源
            </button>
            <button onClick={handleLogout} className="btn btn-danger">
              登出
            </button>
          </div>
        )}

        {message && <div className="message">{message}</div>}
      </main>

      <footer className="footer">
        <p>&copy; 2026 資訊安全專案 - 實作安全設計</p>
      </footer>
    </div>
  );
}

export default App;