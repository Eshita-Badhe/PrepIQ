import React, { useState } from 'react';
import userImg from './assets/user.png';
import LoginForm from './LoginForm';
import './Login.css';

export default function Login() {
  const [showLogin, setShowLogin] = useState(false);

  // Show page 2 when image is clicked
  if (showLogin) return <LoginForm />;

  return (
    <div className="win7-login-bg">
      <div className="win7-login-box">
        <div className="img-box">
            <img
            src={userImg}
            alt="User"
            className="win7-user-img"
            onClick={() => setShowLogin(true)}
            style={{ cursor: 'pointer', width: '120px', borderRadius: '12px', boxShadow: '0 0 16px #1793ee44' }}
            />
        </div>
        <div className="win7-username-label">USER</div>
      </div>
    </div>
  );
}
