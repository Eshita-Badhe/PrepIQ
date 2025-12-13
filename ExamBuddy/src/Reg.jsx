import React, { useState, useMemo } from 'react';
import './Reg.css';
import ShowWin7Popup from './ShowWin7Popup';
import userImg from './assets/user.png';
import { useNavigate } from 'react-router-dom';

export default function Reg() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    age: '',
    accountType: 'student',     // default: student
    directLogin: false,
    agreeTerms: false,
    otp: '',
    emailVerified: false,
  });

  const [otpSent, setOtpSent] = useState(false);
  const [popupMsg, setPopupMsg] = useState('');
  const showWin7Popup = (msg) => setPopupMsg(msg);
  const closePopup = () => setPopupMsg('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  // --- Password strength rules (real-time) ---
const passwordInfo = useMemo(() => {
  const pwd = form.password || '';

  const minLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /\d/.test(pwd);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>_\-~`[\]\\;/+=]/.test(pwd);
  const noCommon =
    !/(password|qwerty|1234|prep|prepiq|admin|user)/i.test(pwd);
  const noSpaces = !/\s/.test(pwd);

  const allOk =
    minLength && hasUpper && hasLower && hasNumber && hasSymbol && noCommon && noSpaces;

  return {
    isStrong: allOk,
  };
}, [form.password]);



  const handleSendOtp = async () => {
    try {
      const resp = await fetch('http://localhost:5000/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: form.email }),
      });
      const result = await resp.json();
      if (result.success) {
        setOtpSent(true);
        showWin7Popup('OTP sent to your email.');
      } else {
        showWin7Popup(result.msg || 'Error sending OTP.');
      }
    } catch {
      showWin7Popup('Network error sending OTP.');
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const resp = await fetch('http://localhost:5000/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: form.email, otp: form.otp }),
      });
      const result = await resp.json();
      if (result.success) {
        setForm((f) => ({ ...f, emailVerified: true }));
        showWin7Popup('Email verified!');
      } else {
        showWin7Popup(result.msg || 'Invalid OTP!');
      }
    } catch {
      showWin7Popup('Error verifying OTP.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.emailVerified)
      return showWin7Popup('Email must be verified.');
    if (!form.username || !form.password || !form.age || !form.agreeTerms)
      return showWin7Popup('Fill all required fields & agree terms.');
    if (form.password !== form.confirmPassword)
      return showWin7Popup('Passwords do not match!');
    if (!passwordInfo.isStrong)
      return showWin7Popup('Password is not strong enough. Please follow the password rules.');

    const payload = {
      username: form.username,
      password: form.password,
      confirmPassword: form.confirmPassword,
      email: form.email,
      age: form.age,
      accountType: form.accountType === 'guide' ? 'Guide' : 'Student',
      directLogin: !!form.directLogin,
      termsAgreed: !!form.agreeTerms,
    };

    try {
      const resp = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const result = await resp.json();
      if (result.success || result.message) {
        showWin7Popup(result.message || 'Registration successful!');
        setTimeout(() => {
          navigate('/login');
        }, 800);
      } else {
        showWin7Popup(result.error || result.msg || 'Registration failed.');
      }
    } catch {
      showWin7Popup('Error during registration.');
    }
  };

  const handleCancel = () => {
    navigate('/boot');
  };

  return (
    <div className="win7-window-bg">
      <div className="win7-window">
        <div className="win7-title-bar">
          <span className="win7-title">User Account Setup - PrepIQ</span>
        </div>

        <form className="win7-form" onSubmit={handleSubmit}>
          <div className="win7-form-section">
            <div className="win7-user-icon">
              <img src={userImg} alt="User" height="100px" />
            </div>

            <div className="win7-form-row">
              <label>Username:</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>
                        
            <div style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="win7-form-row">
                <label>Password:</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {form.password && (
                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '0.9rem',
                    color: passwordInfo.isStrong ? '#2e7d32' : '#d32f2f',
                    fontFamily: 'Segoe UI, Arial, sans-serif',
                  }}
                >
                  {passwordInfo.isStrong
                    ? 'Password looks strong.'
                    : 'Password looks weak.'}
                </div>
              )}
            </div>

            <div className="win7-form-row">
              <label>Confirm Password:</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="win7-form-row">
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                disabled={form.emailVerified}
              />
              {!form.emailVerified && (
                <button
                  type="button"
                  className="win7-btn"
                  onClick={handleSendOtp}
                  disabled={!form.email}
                >
                  Verify Email
                </button>
              )}
            </div>

            {otpSent && !form.emailVerified && (
              <div className="win7-form-row">
                <label>OTP:</label>
                <input
                  type="text"
                  name="otp"
                  value={form.otp}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="win7-btn"
                  onClick={handleVerifyOtp}
                >
                  Verify OTP
                </button>
              </div>
            )}

            <div className="win7-form-row">
              <label>Age:</label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                min="12"
                max="99"
                required
              />
            </div>

            {/* Updated account type: Student / Guide */}
            <div className="win7-form-row win7-radio-group">
              <label>Account type:</label>
              <label>
                <input
                  type="radio"
                  name="accountType"
                  value="student"
                  checked={form.accountType === 'student'}
                  onChange={handleChange}
                />
                Student
              </label>
              <label>
                <input
                  type="radio"
                  name="accountType"
                  value="guide"
                  checked={form.accountType === 'guide'}
                  onChange={handleChange}
                />
                Guide
              </label>
            </div>

            {/* Updated description note */}
            <div className="win7-form-desc">
              {form.accountType === 'student' ? (
                <div>
                  Student accounts are for learners using PrepIQ to plan, study and track their own exams.<br />
                  <span style={{ color: '#1976D2' }}>
                    Recommended if you are preparing for exams yourself.
                  </span>
                </div>
              ) : (
                <div>
                  Guide accounts are for teachers, mentors or parents who help students and review their progress.<br />
                  <span style={{ color: '#D32F2F' }}>
                    Use a strong password and keep this account private.
                  </span>
                </div>
              )}
            </div>

            <div className="win7-form-row">
              <label>
                <input
                  type="checkbox"
                  name="directLogin"
                  checked={form.directLogin}
                  onChange={handleChange}
                />
                Enable direct login (skip login next time)
              </label>
            </div>

            <div className="win7-form-row">
              <label>
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={form.agreeTerms}
                  onChange={handleChange}
                  required
                />
                I agree to PrepIQ terms & policies
              </label>
            </div>

            <div className="win7-form-btns">
              <button
                type="submit"
                className="win7-btn primary"
                disabled={!passwordInfo.isStrong}
              >
                Create Account
              </button>
              <button
                type="button"
                className="win7-btn secondary"
                style={{ marginLeft: '14px' }}
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>

      <ShowWin7Popup popupMsg={popupMsg} onClose={closePopup} />
    </div>
  );
}
