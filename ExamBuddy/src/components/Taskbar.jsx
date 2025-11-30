import React, { useState, useEffect } from "react";

// Dummy system icons (replace with SVG for production)
const SYSTEM_ICONS = {
  battery: "🔋",
  volume: "🔊",
  network: "📶",
  sun: "🌞",
  moon: "🌙",
  news: "📰"
};

function CalendarPopup({ show, onClose }) {
  // See renderYearCalendar from your example for a real calendar
  const year = new Date().getFullYear();
  // ...use your own calendar renderer, see ref code for full implementation
  return show ? (
    <div className="calendar-popup">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 600 }}>Calendar - {year}</div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
      </div>
      {/* Replace below with your full-year calendar JSX */}
      <div style={{ marginTop: 10, color: "#333" }}>Full-year calendar here</div>
    </div>
  ) : null;
}

function NewsTray({ show, onClose }) {
  const [news, setNews] = useState([]);
  useEffect(() => {
    if (!show) return;
    // Basic public endpoint for demo (replace with legit API for production)
    fetch("https://api.currentsapi.services/v1/latest-news?language=en&apiKey=demo")
      .then(r => r.json()).then(d => setNews(d.news ? d.news.slice(0,5) : []))
      .catch(() => setNews([{ title: "Unable to fetch news.", description: "" }]));
  }, [show]);
  return show ? (
    <div className="news-popup">
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Top News <button onClick={onClose} style={{ float: "right" }}>✕</button></div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {news.map((item, idx) =>
          <li key={idx} style={{ marginBottom: 8 }}>
            {item.url ? 
              <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "#246" }}>{item.title}</a> : item.title}
            <div style={{ fontSize: 12, color: "#444" }}>{item.description}</div>
          </li>
        )}
      </ul>
    </div>
  ) : null;
}

export default function Taskbar({
  wins, z, minimizeWindow, updateWindow, focusWindow,
  onStartMenu, isStartMenuOpen,
  darkMode, setDarkMode
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNews, setShowNews] = useState(false);
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setDate(now.toLocaleDateString());
    };
    update();
    const int = setInterval(update, 1000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className={`taskbar${darkMode ? " dark" : ""}`}>
      {/* Start orb */}
      <div className="start-orb" onClick={onStartMenu} aria-pressed={isStartMenuOpen}>
        <img src="./start.jpg" alt="Start" />
      </div>

      {/* Taskbar app buttons */}
      <div className="taskbar-buttons">
        {wins.map(w => (
          <div
            key={w.id}
            className={`taskbar-button${z[z.length - 1] === w.id ? " active" : ""}`}
            onClick={() => {
              if (w.state === "minimized") {
                updateWindow(w.id, { state: "normal" }); focusWindow(w.id);
              } else { minimizeWindow(w.id); }
            }}>
            <div style={{ width: 22, height: 22, background: "rgba(255,255,255,0.04)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>{w.name[0]}</div>
            <div style={{ fontSize: 13, maxWidth: 96, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</div>
          </div>
        ))}
      </div>

      {/* System Tray / Right side */}
      <div className="taskbar-right">
        <button title="News" className="tray-btn" onClick={() => setShowNews(v => !v)}>{SYSTEM_ICONS.news}</button>
        <button title="Calendar" className="tray-btn" onClick={() => setShowCalendar(v => !v)}>{time}<br /><span style={{ fontSize: 11 }}>{date}</span></button>
        <span title="Battery">{SYSTEM_ICONS.battery}</span>
        <span title="Volume">{SYSTEM_ICONS.volume}</span>
        <span title="Network">{SYSTEM_ICONS.network}</span>
        <button className="tray-btn" title={darkMode ? "Light mode" : "Dark mode"} onClick={() => setDarkMode(d => !d)}>
          {darkMode ? SYSTEM_ICONS.sun : SYSTEM_ICONS.moon}
        </button>
      </div>

      {/* Popups */}
      <CalendarPopup show={showCalendar} onClose={() => setShowCalendar(false)} />
      <NewsTray show={showNews} onClose={() => setShowNews(false)} />
    </div>
  );
}
