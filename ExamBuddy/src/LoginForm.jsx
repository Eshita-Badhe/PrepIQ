import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import userImg from './assets/user.png';

export default function LoginForm() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const checkCredentials = async () => {
    setLoading(true);
    setErr('');
    try {
      const resp = await fetch('http://localhost:5000/api/check-login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const result = await resp.json();
      if (result.success) {
        navigate('/desktop');
      } else {
        setErr(`wrong password! hint: ${result.hint || 'your pass'}`);
      }
    } catch {
      setErr('Server error!');
    }
    setLoading(false);
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter') checkCredentials();
  };

  return (
    <div className="win7-login-bg">
      <div className="win7-login-box">
        <img src={userImg} alt="User" className="win7-login-icon" />
        <input
          type="text"
          className="win7-username-input"
          placeholder="Enter Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ textAlign: 'center' }}
        />
        <div className="pass">
          <input
            type="password"
            className="win7-password-input"
            placeholder="Enter Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ marginTop: '16px' }}
            onKeyDown={handleKeyDown}
          />
          <button 
            className="win7-login-btn" 
            disabled={loading}
            onClick={checkCredentials}
          >
            {">"}
          </button>
        </div>
        {err && <div className="win7-error-msg">{err}</div>}
      </div>
    </div>
  );
}
