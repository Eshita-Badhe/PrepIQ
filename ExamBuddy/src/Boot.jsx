import React, { useState } from 'react';
import './Boot.css';
import { useNavigate } from 'react-router-dom';

const options = [
  { label: 'Start Setup Wizard', value: 'setup' },
  { label: 'Go to Login Screen', value: 'login' }
];

export default function Boot() {
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();

  const handleOptionClick = (value) => {
    if (value === 'setup') {
      navigate('/register'); // Redirect to Registration page
    } else if (value === 'login') {
      navigate('/login'); // Redirect to Login page
    }
  };


  return (
    <div className="bios-bg">
      <div className="bios-title">
        Exam Buddy Setup Utility - Copyright (C) 2025 Exam Buddy Team
      </div>
      <div className="bios-menu-row">
        <span className="bios-menu-btn active">Project</span>
        <span className="bios-menu-btn">Account</span>
        <span className="bios-menu-btn">Info</span>
        <span className="bios-menu-btn">Exit</span>
      </div>
      <div className="bios-main">
        <div className="bios-section-left">
          <div className="bios-section-title">Exam Buddy Boot Mode</div>
          <div className="bios-section-entry">
            Mode: <span className="bios-section-value">Student</span>
          </div>
          <div className="bios-section-entry">Smart Study Planner: <span className="bios-section-value">Enabled</span></div>
          <div className="bios-section-entry">Notes Import: <span className="bios-section-value">Supported</span></div>
          <div className="bios-section-entry">Productivity Suite: <span className="bios-section-value">Active</span></div>
        </div>
        <div className="bios-section-center">
          <div className="bios-selector-box">
            <div className="bios-select-title">Select Action</div>
            <div className="bios-option-list">
              {options.map((opt, i) => (
                <div
                  key={opt.value}
                  className={`bios-option${selected === i ? ' selected' : ''}`}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => handleOptionClick(opt.value)} // Click event
                  tabIndex={0}
                  style={{cursor: "pointer"}}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bios-section-right">
          <div className="bios-help-title">About Exam Buddy</div>
          <div className="bios-help-text">
            All-in-one platform for exam preparation.<br />
            Features: <br />
            &bull; Personalized planning<br />
            &bull; Customization according to syllabus and exam pattern<br />
            &bull; Notes import<br />
            &bull; Sample papers<br />
            &bull; Progress tracking<br />
            &bull; Focus games & streaks
          </div>
        </div>
      </div>
      <div className="bios-footer">
        <span>Select: [Enter]</span>
        <span>Change Option: [↑/↓]</span>
        <span>Help: [F1]</span>
        <span>Full Screen: [F11]</span>
        <span>Exit: [Esc]</span>
        <span className="bios-version">Version 1.0.0. Copyright (C) 2025 Exam Buddy Team.</span>
      </div>
    </div>
  );
}
