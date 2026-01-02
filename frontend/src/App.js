import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [qrCode, setQrCode] = useState('');

  const handleRegister = async () => {
    try {
      const response = await axios.post('https://localhost:3443/register', { username, password });
      setMessage('註冊成功！請登入。');
    } catch (error) {
      setMessage(error.response?.data?.error || '註冊失敗');
    }
  };

  const handleEnable2FA = async () => {
    try {
      const response = await axios.post('https://localhost:3443/enable-2fa', { username });
      setQrCode(response.data.qrCode);
      setMessage('2FA 已啟用！請掃描 QR 碼並保存密鑰。');
    } catch (error) {
      setMessage(error.response?.data?.error || '啟用 2FA 失敗');
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post('https://localhost:3443/login', {
        username,
        password,
        otpToken: requires2FA ? otpToken : undefined
      });

      if (response.data.requires2FA) {
        setRequires2FA(true);
        setMessage('請輸入 2FA 代碼');
        return;
      }

      setToken(response.data.token);
      setIsLoggedIn(true);
      setRequires2FA(false);
      setMessage('登入成功！');
    } catch (error) {
      setMessage(error.response?.data?.error || '登入失敗');
    }
  };

  const handleProtected = async () => {
    try {
      const response = await axios.get('https://localhost:3443/protected', {
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
    setRequires2FA(false);
    setQrCode('');
    setMessage('已登出');
  };

  return (
    <div className="app">
      <header className="header">
        <h1>資訊安全專案</h1>
        <p>安全的用戶認證系統 (含 2FA)</p>
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
                {requires2FA && (
                  <div className="input-group">
                    <label htmlFor="otp">2FA 代碼</label>
                    <input
                      id="otp"
                      type="text"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                      placeholder="輸入 6 位代碼"
                      maxLength="6"
                    />
                  </div>
                )}
                <div className="button-group">
                  <button type="button" onClick={handleRegister} className="btn btn-secondary">
                    註冊
                  </button>
                  <button type="button" onClick={handleLogin} className="btn btn-primary">
                    {requires2FA ? '驗證 2FA' : '登入'}
                  </button>
                </div>
                {!requires2FA && (
                  <button type="button" onClick={handleEnable2FA} className="btn btn-outline">
                    啟用 2FA
                  </button>
                )}
              </form>
              {qrCode && (
                <div className="qr-container">
                  <h3>掃描 QR 碼啟用 2FA</h3>
                  <img src={qrCode} alt="2FA QR Code" />
                  <p>使用 Google Authenticator 或類似 App 掃描</p>
                </div>
              )}
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
        <p>&copy; 2026 資訊安全專案 - 實作安全設計與 2FA</p>
      </footer>
    </div>
  );
}

export default App;