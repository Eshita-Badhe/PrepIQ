import React from 'react';
import './Reg.css';

export default function ShowWin7Popup({ popupMsg, onClose }) {
  return (
    popupMsg && (
      <div className="win7-dialog-bg">
        <div className="win7-dialog">
          <span>{popupMsg}</span>
          <button className="win7-btn primary" onClick={onClose}>OK</button>
        </div>
      </div>
    )
  );
}
