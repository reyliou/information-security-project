import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

// JWT 解碼輔助函數
const decodeJWT = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('JWT 解碼失敗:', error);
    return null;
  }
};

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminStats, setAdminStats] = useState({});

  const handleRegister = useCallback(async () => {
    if (password !== confirmPassword) {
      setMessage('密碼確認不符合');
      return;
    }

    try {
      await axios.post('/api/register', { username, password });
      setMessage('註冊成功！請登入。');
      setIsRegistering(false);
      setConfirmPassword('');
    } catch (error) {
      setMessage(error.response?.data?.error || '註冊失敗');
    }
  }, [password, confirmPassword, username]);

  const handleEnable2FA = async () => {
    try {
      const response = await axios.post('/api/enable-2fa', { username });
      setQrCode(response.data.qrCode);
      setIsSettingUp2FA(true);
      setMessage('請掃描 QR 碼，然後輸入 6 位驗證碼來完成設置。');
    } catch (error) {
      setMessage(error.response?.data?.error || '啟用 2FA 失敗');
    }
  };

  const handleVerify2FASetup = async () => {
    try {
      await axios.post('/api/verify-2fa-setup', { username, token: otpToken });
      setIsSettingUp2FA(false);
      setQrCode('');
      setOtpToken('');
      setMessage('2FA 設置完成！');
    } catch (error) {
      setMessage(error.response?.data?.error || '驗證失敗');
    }
  };

  const handleCancel2FASetup = () => {
    setIsSettingUp2FA(false);
    setQrCode('');
    setOtpToken('');
    setMessage('2FA 設置已取消');
  };

  const handleLogin = useCallback(async () => {
    try {
      const response = await axios.post('/api/login', {
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
      
      // 解碼 JWT token 獲取用戶角色
      const decodedToken = decodeJWT(response.data.token);
      if (decodedToken && decodedToken.role) {
        setUserRole(decodedToken.role);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || '登入失敗');
    }
  }, [username, password, requires2FA, otpToken]);

  const handleProtected = useCallback(async () => {
    try {
      const response = await axios.get('/api/protected', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      const permissionsText = data.permissions.join(', ');
      setMessage(`${data.message} (${data.roleText}) - 您的權限: ${permissionsText}`);
    } catch (error) {
      setMessage(error.response?.data?.error || '存取失敗');
    }
  }, [token]);

  const handleLogout = () => {
    setToken('');
    setIsLoggedIn(false);
    setRequires2FA(false);
    setQrCode('');
    setUserRole('');
    setMessage('已登出');
  };

  const switchToLogin = () => {
    setIsRegistering(false);
    setConfirmPassword('');
    setMessage('');
  };

  const switchToRegister = () => {
    setIsRegistering(true);
    setOtpToken('');
    setRequires2FA(false);
    setMessage('');
  };

  // 管理員功能
  const handleGetUsers = useCallback(async () => {
    try {
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminUsers(response.data.users);
      setMessage('用戶列表獲取成功');
    } catch (error) {
      setMessage(error.response?.data?.error || '獲取用戶列表失敗');
    }
  }, [token]);

  const handleGetAdminStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminStats(response.data);
      setMessage('管理員統計數據獲取成功');
    } catch (error) {
      setMessage(error.response?.data?.error || '獲取統計數據失敗');
    }
  }, [token]);

  const handleChangeUserRole = useCallback(async (userId, newRole) => {
    try {
      await axios.put(`/api/admin/users/${userId}/role`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('用戶角色修改成功');
      // 重新獲取用戶列表
      handleGetUsers();
    } catch (error) {
      setMessage(error.response?.data?.error || '修改用戶角色失敗');
    }
  }, [token, handleGetUsers]);

  // 鍵盤事件監聽器
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Enter') {
        if (isLoggedIn) {
          // 已登入狀態下，Enter 鍵可以存取受保護資源
          handleProtected();
        } else if (isRegistering) {
          // 註冊頁面，Enter 鍵觸發註冊
          handleRegister();
        } else {
          // 登入頁面，Enter 鍵觸發登入
          handleLogin();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isLoggedIn, isRegistering, handleRegister, handleLogin, handleProtected]);

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
              {isRegistering ? (
                <>
                  <h2>註冊帳號</h2>
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
                    <div className="input-group">
                      <label htmlFor="confirmPassword">確認密碼</label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="再次輸入密碼"
                      />
                    </div>
                    <div className="button-group">
                      <button type="button" onClick={handleRegister} className="btn btn-primary">
                        註冊
                      </button>
                      <button type="button" onClick={switchToLogin} className="btn btn-outline">
                        返回登入
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h2>登入帳號</h2>
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
                      <button type="button" onClick={handleLogin} className="btn btn-primary">
                        {requires2FA ? '驗證 2FA' : '登入'}
                      </button>
                      <button type="button" onClick={switchToRegister} className="btn btn-outline">
                        註冊新帳號
                      </button>
                    </div>
                    {!requires2FA && (
                      <button type="button" onClick={handleEnable2FA} className="btn btn-secondary">
                        啟用 2FA
                      </button>
                    )}
                  </form>
                  {qrCode && isSettingUp2FA && (
                    <div className="qr-container">
                      <h3>掃描 QR 碼設置 2FA</h3>
                      <img src={qrCode} alt="2FA QR Code" />
                      <p>使用 Microsoft Authenticator 掃描此 QR 碼</p>
                      <div className="input-group">
                        <label htmlFor="setup-otp">輸入 6 位驗證碼</label>
                        <input
                          id="setup-otp"
                          type="text"
                          value={otpToken}
                          onChange={(e) => setOtpToken(e.target.value)}
                          placeholder="000000"
                          maxLength="6"
                        />
                      </div>
                      <div className="button-group">
                        <button type="button" onClick={handleVerify2FASetup} className="btn btn-success">
                          完成設置
                        </button>
                        <button type="button" onClick={handleCancel2FASetup} className="btn btn-outline">
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <h2>歡迎回來！</h2>
            <p>您的角色: <strong>{userRole === 'admin' ? '管理員' : '一般使用者'}</strong></p>
            
            <div className="dashboard-buttons">
              <button onClick={handleProtected} className="btn btn-success">
                存取受保護資源
              </button>
              
              {userRole === 'admin' && (
                <div className="admin-section">
                  <h3>管理員功能</h3>
                  <div className="admin-buttons">
                    <button onClick={handleGetUsers} className="btn btn-primary">
                      查看所有用戶
                    </button>
                    <button onClick={handleGetAdminStats} className="btn btn-info">
                      查看統計數據
                    </button>
                  </div>
                  
                  {adminUsers.length > 0 && (
                    <div className="user-list">
                      <h4>用戶列表</h4>
                      <div className="user-table">
                        {adminUsers.map(user => (
                          <div key={user.id} className="user-row">
                            <span>{user.username}</span>
                            <span>角色: {user.role}</span>
                            <span>2FA: {user.is2FAEnabled ? '啟用' : '未啟用'}</span>
                            <select 
                              value={user.role} 
                              onChange={(e) => handleChangeUserRole(user.id, e.target.value)}
                              className="role-select"
                            >
                              <option value="user">一般使用者</option>
                              <option value="admin">管理員</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {Object.keys(adminStats).length > 0 && (
                    <div className="admin-stats">
                      <h4>系統統計</h4>
                      <div className="stats-grid">
                        <div className="stat-item">
                          <strong>總用戶數:</strong> {adminStats.totalUsers}
                        </div>
                        <div className="stat-item">
                          <strong>管理員:</strong> {adminStats.adminUsers}
                        </div>
                        <div className="stat-item">
                          <strong>一般使用者:</strong> {adminStats.regularUsers}
                        </div>
                        <div className="stat-item">
                          <strong>啟用 2FA 用戶:</strong> {adminStats.usersWith2FA}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <button onClick={handleLogout} className="btn btn-danger">
                登出
              </button>
            </div>
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