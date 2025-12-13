import React, { useState, useEffect, useCallback } from 'react';
import './Boot.css';
import { useNavigate } from 'react-router-dom';

const options = [
  { label: 'Setup Account', value: 'setup' },
  { label: 'Login to Dashboard', value: 'login' }
];

export default function Boot() {
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();

  const handleOptionClick = useCallback(
    (value) => {
      if (value === 'setup') navigate('/register');
      if (value === 'login') navigate('/login');
    },
    [navigate]
  );

  // Keyboard handler on window so it works immediately
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((prev) => (prev === 0 ? options.length - 1 : prev - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((prev) => (prev === options.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleOptionClick(options[selected].value);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleOptionClick, selected]);

  return (
    <div className="bios-bg">
      <div className="bios-title">
        PrepIQ Setup Utility – Exam Prep Workspace
      </div>

      <div className="bios-menu-row">
        <span className="bios-menu-btn active">#workspace</span>
        <span className="bios-menu-btn">#planner</span>
        <span className="bios-menu-btn">#wellbeing</span>
        <span className="bios-menu-btn">#privacy</span>
      </div>

      <div className="bios-main">
        <div className="bios-section-left">
          <div className="bios-section-title">PrepIQ Profile</div>

          <div className="bios-section-entry">
            Mode: <span className="bios-section-value">Student</span>
          </div>
          <div className="bios-section-entry">
            Chatbot: <span className="bios-section-value">Uses Your Notes</span>
          </div>
          <div className="bios-section-entry">
            Planner: <span className="bios-section-value">Exam‑Aware</span>
          </div>
          <div className="bios-section-entry">
            Result: <span className="bios-section-value">Your Progress</span>
          </div>
          <div className="bios-section-entry">
            Engine: <span className="bios-section-value">Offline‑Friendly</span>
          </div>
        </div>

        <div className="bios-section-center">
          <div className="bios-selector-box">
            <div className="bios-select-title">Startup Action</div>
            <div className="bios-option-list">
              {options.map((opt, i) => (
                <div
                  key={opt.value}
                  className={`bios-option${selected === i ? ' selected' : ''}`}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => handleOptionClick(opt.value)}
                  style={{ cursor: 'pointer' }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bios-section-right">
          <div className="bios-help-title">Key features</div>
          <div className="bios-help-text">
            • Chatbot answers from your notes and books.<br />
            • Study plan built from syllabus and exam dates.<br />
            • Personlised games to enjoy studying.<br />
            • Streaks and badges to keep you consistent.<br />
            • Note your progress.<br />
            • Voice - Support.<br />
            • Offline - Support
          </div>
        </div>
      </div>

      <div className="bios-footer">
        <span>Select: [Enter]</span>
        <span>Change: [↑/↓]</span>
        <span>Full screen: [F11]</span>
        <span className="bios-version">
          PrepIQ · The AI-Powered Study Workspace · v1.0.0
        </span>
      </div>
    </div>
  );
}
