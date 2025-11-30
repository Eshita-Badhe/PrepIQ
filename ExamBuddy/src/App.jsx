// src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import { useWindowManager } from "./hooks/useWindowManager";
import { Win } from "./components/Window";
import ProfileApp from "./apps/ProfileApp";
import UploadDocs from "./apps/Upload";
import ChatBot from "./apps/ChatBot";
import { Explorer } from "./apps/ExplorerApp";
import FileViewerApp from "./apps/FileViewerApp";
import { NotepadApp, CalculatorApp, BrowserApp, SystemInfoApp } from "./apps/SystemApps";
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
  { id: "sysinfo", title: "System Info", icon: "💻", app: "System Info" },
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
  Progress: () => (
    <div style={{ padding: 20 }}>
      <h3>Progress</h3>
    </div>
  ),
  History: () => (
    <div style={{ padding: 20 }}>
      <h3>History</h3>
    </div>
  ),
};

/* ---- Calendar helpers (full-year) ---- */

function renderYearCalendar(year = new Date().getFullYear()) {
  const months = [...Array(12)].map((_, i) => {
    const first = new Date(year, i, 1);
    const days = new Date(year, i + 1, 0).getDate();
    const startDay = first.getDay();
    const cells = [];
    for (let x = 0; x < startDay; x++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    return { i, name: first.toLocaleString(undefined, { month: "short" }), cells };
  });
  return (
    <div className="calendar-grid">
      {months.map((m) => (
        <div key={m.i} className="calendar-month">
          <h5>{m.name}</h5>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: 4,
              fontSize: 12,
            }}
          >
            {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
              <div key={d} style={{ textAlign: "center", fontWeight: 600 }}>
                {d}
              </div>
            ))}
            {m.cells.map((c, idx) => (
              <div
                key={idx}
                style={{
                  height: 18,
                  textAlign: "center",
                  opacity: c ? 1 : 0.2,
                }}
              >
                {c || ""}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DraggableCalendar({ children, onClose }) {
  const dragging = useRef(false);
  const rel = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState({
    x: window.innerWidth - 740,
    y: window.innerHeight - 480 - 60,
  });

  useEffect(() => {
    function onMove(e) {
      if (!dragging.current) return;
      setPos((p) => ({
        x: e.clientX - rel.current.x,
        y: e.clientY - rel.current.y,
      }));
    }
    function onUp() {
      dragging.current = false;
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function headerDown(e) {
    e.stopPropagation();
    dragging.current = true;
    rel.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    document.body.style.userSelect = "none";
  }

  useEffect(() => {
    const adjust = () =>
      setPos((p) => {
        const w = window.innerWidth,
          h = window.innerHeight;
        const nx = Math.max(8, Math.min(p.x, w - 720 - 8));
        const ny = Math.max(8, Math.min(p.y, h - 420 - 8));
        return { x: nx, y: ny };
      });
    window.addEventListener("resize", adjust);
    return () => window.removeEventListener("resize", adjust);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: 720,
        maxHeight: 420,
        zIndex: 910,
      }}
    >
      <div
        style={{
          background: "linear-gradient(180deg,#fff,#f2f2f2)",
          borderRadius: 8,
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 8px",
            background: "#e8e8e8",
            cursor: "grab",
          }}
          onMouseDown={headerDown}
        >
          <div style={{ fontWeight: 600 }}>Calendar</div>
          <div>
            <button
              onClick={onClose}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 16,
                cursor: "pointer",
              }}
              aria-label="Close calendar"
            >
              ✕
            </button>
          </div>
        </div>
        <div
          style={{
            padding: 8,
            background: "#fff",
            maxHeight: 380,
            overflow: "auto",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ====== Taskbar (Win7-style) ======= */

function Taskbar({
  wins,
  z,
  minimizeWindow,
  updateWindow,
  focusWindow,
  onStartMenu,
  isStartMenuOpen,
  darkMode,
  setDarkMode,
  time,
  date,
  onToggleCalendar,
}) {
  return (
    <div className={`taskbar${darkMode ? " dark" : ""}`}>
      {/* Start orb + task buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          className="start-orb"
          onClick={(e) => {
            e.stopPropagation();        // prevent root from closing it immediately
            onStartMenu();              // toggles startOpen
          }}
          aria-pressed={isStartMenuOpen}
        >
          <img src={START_ORB} alt="Start" />
        </div>

        <div
          className="taskbar-buttons"
          role="toolbar"
          aria-label="Open applications"
        >
          {wins.map((w) => (
            <div
              key={w.id}
              className={`taskbar-button${
                z[z.length - 1] === w.id ? " active" : ""
              }`}
              onClick={() => {
                if (w.state === "minimized") {
                  updateWindow(w.id, { state: "normal" });
                  focusWindow(w.id);
                } else {
                  minimizeWindow(w.id);
                }
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {w.name[0]}
              </div>
              <div
                style={{
                  fontSize: 13,
                  maxWidth: 96,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {w.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right side: tray + clock */}
      <div className="taskbar-right">
        <span title="Battery">🔋</span>
        <span title="Volume">🔊</span>
        <span title="Network">📶</span>
        <button
          className="tray-btn"
          title={darkMode ? "Light mode" : "Dark mode"}
          onClick={() => setDarkMode((d) => !d)}
        >
          {darkMode ? "🌞" : "🌙"}
        </button>

        <div
          style={{
            cursor: "pointer",
            padding: "6px 10px",
            borderRadius: 6,
          }}
          onClick={onToggleCalendar}
        >
          <div style={{ textAlign: "right" }}>{time}</div>
          <div style={{ fontSize: 11 }}>{date}</div>
        </div>
      </div>
    </div>
  );
}


/* ====== MAIN DESKTOP ======= */

export default function Win7Desktop() {
  const {
    wins,
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindow,
    z,
  } = useWindowManager();
  const [startOpen, setStartOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // clock + date for taskbar
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
      setDate(now.toLocaleDateString());
    };
    update();
    const int = setInterval(update, 1000);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("http://localhost:5000/api/me", {
          credentials: "include",
        });
        const data = await res.json();
        console.log("Fetched /api/me:", data);
        if (data.authenticated) {
          setCurrentUser(data);
        }
      } catch (e) {
        console.error("Failed to fetch /api/me:", e);
      }
    }
    fetchMe();
  }, []);

  function openAppByName(name, extraProps = {}) {
    const AppComponent =
      appRegistry[name] ||
      (() => (
        <div style={{ padding: 20 }}>
          <h3>App not found</h3>
        </div>
      ));

    openWindow({
      name,
      content: ({ openWindow: wmOpenWindow }) => {
        if (name === "UploadDocs") {
          return <UploadDocs username={currentUser?.username} />;
        }
        // FileViewerApp is opened from Explorer via wmOpenWindow; no change here
        return <AppComponent openWindow={wmOpenWindow} {...extraProps} />;
      },
    });

    setStartOpen(false);
  }

  const displayName = currentUser?.username || "User";

  const rightLinks = [
    "Profile",
    "Explorer",
    "Notepad",
    "Browser",
    "System Info",
    "Progress",
    "History",
  ];

  return (
    <div
    className={`win7-viewport${darkMode ? " dark" : ""}`}
    onClick={() => {
        setStartOpen(false)
      }}
  >
      <div
        className="wallpaper"
        style={{ backgroundImage: `url(${wallpaperImg})` }}
      />

      {/* Desktop Icons */}
      <div className="desktop-icons">
        {desktopIcons.map((ic) => (
          <div
            key={ic.id}
            className="icon"
            onDoubleClick={() => openAppByName(ic.app)}
          >
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
        onStartMenu={() => setStartOpen((s) => !s)}
        isStartMenuOpen={startOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        time={time}
        date={date}
        onToggleCalendar={() => setCalendarOpen((c) => !c)}
      />

      {/* Start Menu */}
      {startOpen && (
        <div className="start-overlay"
        onClick={() => setStartOpen(false)}
        >
          <div
            className="start-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="start-left">
              <div
                onClick={() => openAppByName("Profile")}
                style={{ cursor: "pointer", padding: 5 }}
                className="item"
              >
                👤 <b>User Profile</b>
              </div>
              <div
                onClick={() => openAppByName("Calculator")}
                style={{ cursor: "pointer", padding: 5 }}
                className="item"
              >
                🧮 <b>Calculator</b>
              </div>
              <div
                onClick={() => openAppByName("Explorer")}
                style={{ cursor: "pointer", padding: 5 }}
                className="item"
              >
                🗂️ <b>My Computer</b>
              </div>
              <div
                onClick={() => openAppByName("Notepad")}
                style={{ cursor: "pointer", padding: 5 }}
                className="item"
              >
                🗒️ <b>Notepad</b>
              </div>
              <div
                onClick={() => openAppByName("Browser")}
                style={{ cursor: "pointer", padding: 5 }}
                className="item"
              >
                🌐 <b>Browser</b>
              </div>
            </div>
            <div className="start-right">
              <div style={{ padding: 8, fontWeight: 600 }} className="welcome-line">
                Welcome, {displayName}!
              </div>
              <div
                style={{
                  color: "#666",
                  fontSize: "12px",
                  paddingLeft: 8,
                  marginBottom: 8,
                }}
              >
                ExamBuddy Win 7
              </div>
              <ul style={{ listStyle: "none", paddingLeft: 8 }}>
                {rightLinks.map((l) => (
                  <li key={l}>
                    <button
                      className="link"
                      onClick={() => openAppByName(l)}
                    >
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Calendar popup */}
      {calendarOpen && (
        <DraggableCalendar onClose={() => setCalendarOpen(false)}>
          <div style={{ padding: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 700 }}>
                {new Date().getFullYear()}
              </div>
              <button
                onClick={() => setCalendarOpen(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 18,
                  cursor: "pointer",
                }}
                aria-label="Close calendar"
              >
                ✕
              </button>
            </div>
            <div style={{ marginTop: 8 }}>
              {renderYearCalendar(new Date().getFullYear())}
            </div>
          </div>
        </DraggableCalendar>
      )}
    </div>
  );
}
