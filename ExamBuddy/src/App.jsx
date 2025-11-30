import React, { useState, useEffect } from "react";
import { useWindowManager } from "./hooks/useWindowManager";
import { Win } from "./components/Window";
import ProfileApp from "./apps/ProfileApp";
import UploadDocs from "./apps/Upload";
import ChatBot from "./apps/ChatBot";
import { Explorer } from "./apps/ExplorerApp";
import FileViewerApp from "./apps/FileViewerApp";
import {NotepadApp, CalculatorApp, BrowserApp, SystemInfoApp } from "./apps/SystemApps";
import "./styles/win7.css";
import wallpaperImg from "./assets/wallpaper.jpg";
const START_ORB = "./start.jpg";

// Desktop Icons
const desktopIcons = [
  { id: "mycomp", title: "My Computer", icon: "🗂️", app: "Explorer" },
  { id: "recycle", title: "Recycle Bin", icon: "🗑️", app: "Explorer" },
  { id: "profile", title: "User Profile", icon: "👤", app: "Profile" },
  { id: "chatbot", title: "Chatbot Assistant", icon: "🤖", app: "ChatBot" },
  { id: "upload", title: "Upload Resources", icon: "📤", app: "UploadDocs" },
  { id: "note", title: "Notes", icon: "🗒️", app: "Notepad" },
  { id: "browser", title: "Browser", icon: "🌐", app: "Browser" },
  { id: "calculator", title: "Calculator", icon: "🧮", app: "Calculator" },
  { id: "sysinfo", title: "System Info", icon: "💻", app: "System Info" }
];

// App registry
const appRegistry = {
  Profile: ProfileApp,
  Explorer: Explorer,
  ChatBot: ChatBot,
  UploadDocs: UploadDocs,
  FileViewerApp: FileViewerApp,
  Notepad: NotepadApp,
  Calculator: CalculatorApp,
  Browser: BrowserApp,
  "System Info": SystemInfoApp,
  Progress: () => <div style={{padding:20}}><h3>Progress</h3></div>,
  History: () => <div style={{padding:20}}><h3>History</h3></div>,
};

// ====== Taskbar/Tray Components =======
function CalendarPopup({ show, onClose }) {
  // Simple calendar - improve/beautify or use ref code
  const now = new Date();
  return show ? (
    <div className="calendar-popup">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <b>Calendar — {now.getFullYear()}</b>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 17, cursor: "pointer" }}>✕</button>
      </div>
      <div>{now.toDateString()}</div>
    </div>
  ) : null;
}

function NewsTray({ show, onClose }) {
  const [news, setNews] = useState([]);
  useEffect(() => {
    if (!show) return;
    fetch("https://api.currentsapi.services/v1/latest-news?language=en&apiKey=demo")
      .then(r => r.json()).then(d => setNews(d.news ? d.news.slice(0, 4) : []))
      .catch(() => setNews([{ title: "Unable to fetch news." }]));
  }, [show]);
  return show ? (
    <div className="news-popup">
      <b>Top News</b> <button style={{ float: "right" }} onClick={onClose}>✕</button>
      <ul style={{ margin: "10px 0 0", padding: 0, listStyle: "none" }}>
        {news.map((item, i) =>
          <li key={i} style={{ marginBottom: 10 }}>
            {item.url
              ? <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>
              : item.title}
            {item.description && <div style={{ fontSize: 12, color: "#555" }}>{item.description}</div>}
          </li>)}
      </ul>
    </div>
  ) : null;
}

function Taskbar({ wins, z, minimizeWindow, updateWindow, focusWindow, onStartMenu, isStartMenuOpen, darkMode, setDarkMode }) {
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
        <img src={START_ORB} alt="Start" />
      </div>
      {/* Taskbar app buttons */}
      <div className="taskbar-buttons">
        {wins.map(w => (
          <div
            key={w.id}
            className={`taskbar-button${z[z.length - 1] === w.id ? " active" : ""}`}
            onClick={() => {
              if (w.state === "minimized") { updateWindow(w.id, { state: "normal" }); focusWindow(w.id); }
              else { minimizeWindow(w.id); }
            }}>
            <div style={{ width: 22, height: 22, background: "rgba(255,255,255,0.04)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>{w.name[0]}</div>
            <div style={{ fontSize: 13, maxWidth: 96, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</div>
          </div>
        ))}
      </div>
      {/* System Tray */}
      <div className="taskbar-right">
        <button title="News" className="tray-btn" onClick={() => setShowNews(v => !v)}>📰</button>
        <button title="Calendar" className="tray-btn" onClick={() => setShowCalendar(v => !v)}>{time}<br /><span style={{ fontSize: 11 }}>{date}</span></button>
        <span title="Battery">🔋</span>
        <span title="Volume">🔊</span>
        <span title="Network">📶</span>
        <button className="tray-btn" title={darkMode ? "Light mode" : "Dark mode"} onClick={() => setDarkMode(d => !d)}>
          {darkMode ? "🌞" : "🌙"}
        </button>
      </div>
      <CalendarPopup show={showCalendar} onClose={() => setShowCalendar(false)} />
      <NewsTray show={showNews} onClose={() => setShowNews(false)} />
    </div>
  );
}

// ====== MAIN DESKTOP =======
export default function Win7Desktop() {
  const { wins, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindow, z } = useWindowManager();
  const [startOpen, setStartOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("http://localhost:5000/api/me", {
          credentials: "include", // IMPORTANT: send Flask session cookie
        });
        const data = await res.json();
        console.log("Fetched /api/me:", data);
        if (data.authenticated) {
          setCurrentUser(data); // data.username, data.id, etc..
        }
      } catch (e) {
        console.error("Failed to fetch /api/me:", e);
      }
    }
    fetchMe();
  }, []);


function openAppByName(name, extraProps = {}) {
  const AppComponent =
    appRegistry[name] || (() => <div style={{ padding: 20 }}>App not found</div>);

  openWindow({
    name,
    // rename the parameter to avoid clashing with outer openWindow
    content: ({ openWindow: wmOpenWindow }) => {
      if (name === "UploadDocs") {
        return <UploadDocs username={currentUser?.username} />;
      }
      // pass the window-manager openWindow into the app
      return <AppComponent openWindow={wmOpenWindow} {...extraProps} />;
    },
  });

  setStartOpen(false);
}


  return (
    <div className={`win7-viewport${darkMode ? " dark" : ""}`} onClick={() => setStartOpen(false)}>
      <div className="wallpaper" style={{ backgroundImage: `url(${wallpaperImg})` }} />
      {/* Desktop Icons */}
      <div className="desktop-icons">
        {desktopIcons.map((ic) => (
          <div key={ic.id} className="icon" onDoubleClick={() => openAppByName(ic.app)}>
            <div className="thumb">{ic.icon}</div>
            <div>{ic.title}</div>
          </div>
        ))}
      </div>

      {/* Windows */}
      {wins.map((w) => (
        <Win 
          key={w.id}
          win={w}
          focused={z[z.length - 1] === w.id}
          onFocus={focusWindow}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMaximize={maximizeWindow}
          onUpdate={updateWindow}
          openWindow={openWindow}
        />
      ))}

      {/* Taskbar */}
      <Taskbar
        wins={wins}
        z={z}
        minimizeWindow={minimizeWindow}
        updateWindow={updateWindow}
        focusWindow={focusWindow}
        onStartMenu={() => setStartOpen(s => !s)}
        isStartMenuOpen={startOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Start Menu */}
      {startOpen && (
        <div className="start-overlay">
          <div className="start-menu" onClick={e => e.stopPropagation()}>
            <div className="start-left">
              <div onClick={() => openAppByName("Profile")} style={{cursor:'pointer', padding:5}}>👤 <b>User Profile</b></div>
              <div onClick={() => openAppByName("Calculator")} style={{cursor:'pointer', padding:5}}>🧮 <b>Calculator</b></div>
              <div onClick={() => openAppByName("Explorer")} style={{cursor:'pointer', padding:5}}>🗂️ <b>My Computer</b></div>
              <div onClick={() => openAppByName("Notepad")} style={{cursor:'pointer', padding:5}}>🗒️ <b>Notepad</b></div>
              <div onClick={() => openAppByName("Browser")} style={{cursor:'pointer', padding:5}}>🌐 <b>Browser</b></div>
              <div onClick={() => openAppByName("System Info")} style={{cursor:'pointer', padding:5}}>💻 <b>System Info</b></div>
              <div onClick={() => openAppByName("Progress")} style={{cursor:'pointer', padding:5}}>📈 <b>Progress</b></div>
              <div onClick={() => openAppByName("History")} style={{cursor:'pointer', padding:5}}>🕒 <b>History</b></div>
            </div>
            <div className="start-right">
              <div style={{ padding:8, fontWeight:600 }}>Welcome, User</div>
              <div style={{ color: "#666", fontSize: "12px", paddingLeft: 8 }}>Windows 7 Replica Menu</div>
              {/* Add more system links/information here if needed */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
