import React, { useState } from 'react';
import './Reg.css';
import ShowWin7Popup from './ShowWin7Popup'; // Correctly import component (capitalize S)
import userImg from './assets/user.png';
import { useNavigate } from 'react-router-dom';


export default function Reg() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    age: '',
    accountType: 'standard',
    directLogin: false,
    agreeTerms: false,
    otp: '',
    emailVerified: false,
  });

  
  const navigate = useNavigate();

  const [otpSent, setOtpSent] = useState(false);

  // Popup state
  const [popupMsg, setPopupMsg] = useState('');

  // Popup handler function (do NOT conflict with component name!)
  const showWin7Popup = (msg) => setPopupMsg(msg);
  const closePopup = () => setPopupMsg('');

  // Form input handler
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  // OTP send handler
  const handleSendOtp = async () => {
    try {
      const resp = await fetch('http://localhost:5000/api/send-otp', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({ email: form.email })
      });
      const result = await resp.json();
      if (result.success) {
        setOtpSent(true);
        showWin7Popup("OTP sent to your email.");
      } else {
        showWin7Popup(result.msg || "Error sending OTP.");
      }
    } catch (err) {
      showWin7Popup("Network error sending OTP.");
    }
  };

  // OTP verify handler
  const handleVerifyOtp = async () => {
    try {
      const resp = await fetch('http://localhost:5000/api/verify-otp', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include', 
        body: JSON.stringify({ email: form.email, otp: form.otp })
      });
      const result = await resp.json();
      if (result.success) {
        setForm(f => ({ ...f, emailVerified: true }));
        showWin7Popup("Email verified!");
      } else {
        showWin7Popup(result.msg || "Invalid OTP!");
      }
    } catch (err) {
      showWin7Popup("Error verifying OTP.");
    }
  };

  // Registration submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit button clicked!", form);

    if (!form.emailVerified)
      return showWin7Popup('Email must be verified.');
    if (!form.username || !form.password || !form.age || !form.agreeTerms)
      return showWin7Popup('Fill all required fields & agree terms.');
    if (form.password !== form.confirmPassword)
      return showWin7Popup('Passwords do not match!');

    // Prepare payload
    const payload = {
      username: form.username,
      password: form.password,
      confirmPassword: form.confirmPassword,
      email: form.email,
      age: form.age,
      accountType: form.accountType === 'standard' ? "Standard" : "Administrator",
      directLogin: !!form.directLogin,
      termsAgreed: !!form.agreeTerms
    };

    try {
      const resp = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const result = await resp.json();
      if (result.success || result.message) {
        showWin7Popup(result.message || 'Registration successful!');
        setTimeout(() => {
          navigate('/login'); 
        }, 800);
      } else {
        showWin7Popup(result.error || result.msg || "Registration failed.");
      }
    } catch (err) {
      showWin7Popup("Error during registration.");
    }
  };

  const handleCancel = () => {
    navigate('/boot');
  };

  // FINAL RETURN: Popup rendered at top-level, below form
  return (
    <div className="win7-window-bg">
      <div className="win7-window">
        <div className="win7-title-bar">
          <div className="win7-window-icons">
            <span title="Minimize" className="win7-title-icon">&#8211;</span>
            <span title="Maximize" className="win7-title-icon">&#9633;</span>
            <span title="Close" className="win7-title-icon">&#10005;</span>
          </div>
          <span className="win7-title">User Account Setup - Exam Buddy</span>
        </div>
        <form className="win7-form" onSubmit={handleSubmit}>
          <div className="win7-form-section">
            <div className="win7-user-icon"><img src={userImg} alt="User" height={"100px"}/></div>
            <div className="win7-form-row">
              <label>Username:</label>
              <input type="text" name="username" value={form.username} onChange={handleChange} required autoFocus />
            </div>
            <div className="win7-form-row">
              <label>Password:</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required />
            </div>
            <div className="win7-form-row">
              <label>Confirm Password:</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
            </div>
            <div className="win7-form-row">
              <label>Email:</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required disabled={form.emailVerified}/>
              {!form.emailVerified && (
                <button type="button" className="win7-btn" onClick={handleSendOtp} disabled={!form.email}>
                  Verify Email
                </button>
              )}
            </div>
            {otpSent && !form.emailVerified && (
              <div className="win7-form-row">
                <label>OTP:</label>
                <input type="text" name="otp" value={form.otp} onChange={handleChange} required />
                <button type="button" className="win7-btn" onClick={handleVerifyOtp}>Verify OTP</button>
              </div>
            )}
            <div className="win7-form-row">
              <label>Age:</label>
              <input type="number" name="age" value={form.age} onChange={handleChange} min="12" max="99" required />
            </div>
            <div className="win7-form-row win7-radio-group">
              <label>Account type:</label>
              <label>
                <input type="radio" name="accountType" value="standard"
                  checked={form.accountType === 'standard'}
                  onChange={handleChange} />
                Standard user
              </label>
              <label>
                <input type="radio" name="accountType" value="admin"
                  checked={form.accountType === 'admin'}
                  onChange={handleChange} />
                Administrator
              </label>
            </div>
            <div className="win7-form-desc">
              {form.accountType === 'standard'
                ? (
                  <div>
                    Standard account users can use most features and change settings that do not affect the security of other users.<br />
                    <span style={{color:'#1976D2'}}>Recommended for most Exam Buddy users.</span>
                  </div>
                ) : (
                  <div>
                    Administrators have complete access and can manage other users and settings.<br />
                    <span style={{color:'#D32F2F'}}>Please protect with strong password.</span>
                  </div>
                )
              }
            </div>
            <div className="win7-form-row">
              <label>
                <input type="checkbox" name="directLogin" checked={form.directLogin} onChange={handleChange} />
                Enable direct login (skip login next time)
              </label>
            </div>
            <div className="win7-form-row">
              <label>
                <input type="checkbox" name="agreeTerms" checked={form.agreeTerms} onChange={handleChange} required />
                I agree to Exam Buddy terms & policies
              </label>
            </div>
            <div className="win7-form-btns">
              <button type="submit" className="win7-btn primary">Create Account</button>
              <button type="button" className="win7-btn secondary" style={{marginLeft:'14px'}} onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        </form>
      </div>
      {/* FINAL: Popup rendered after main window */}
      <ShowWin7Popup popupMsg={popupMsg} onClose={closePopup} />
    </div>
  );
}
