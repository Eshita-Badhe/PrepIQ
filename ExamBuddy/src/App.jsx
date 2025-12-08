// src/App.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWindowManager } from "./hooks/useWindowManager";
import { Win } from "./components/Window";
import ProfileApp from "./apps/ProfileApp";
import UploadDocs from "./apps/Upload";
import ChatBot from "./apps/ChatBot";
import { Explorer } from "./apps/ExplorerApp";
import FileViewerApp from "./apps/FileViewerApp";
import "./styles/win7.css";
import wallpaperImg from "./assets/wallpaper.jpg";
import { DraggableCalendar, renderYearCalendar } from "./components/Calendar";
import GenerateNotes from "./apps/GenerateNotes";
import GenerateMindMap from "./apps/GenerateMindMaps";
import SettingsApp from "./apps/SettingsApp";
import FeedbackApp from "./apps/FeedbackApp";
import GamesApp from "./apps/GamesApp";
import VoiceBotApp from "./apps/VoiceBot";
import PlannerApp from "./apps/PlannerApp";
import NewsApp from "./apps/NewsApp";
import BrowserApp from "./apps/BrowserApp";
import NotepadApp from "./apps/Notepad";


import START_ORB from "./assets/icons/start.png";

// Icons from Flaticon
import myComputerIcon from "./assets/icons/folder.png";
import recycleBinIcon from "./assets/icons/recycle-bin.png";
import userProfileIcon from "./assets/icons/profile.png";
import settingsIcon from "./assets/icons/settings.png";
import uploadDocsIcon from "./assets/icons/upload.png";
import notesIcon from "./assets/icons/notepad.png";
import generateNotesIcon from "./assets/icons/generate-notes.png";
import chatBotIcon from "./assets/icons/chatbot.png";
import voiceBotIcon from "./assets/icons/voicebot.png";
import plannerIcon from "./assets/icons/planner.png";
import scheduleIcon from "./assets/icons/calendar.png";
import gamesIcon from "./assets/icons/puzzle.png";
import todoIcon from "./assets/icons/checklist.png";
import studyDiaryIcon from "./assets/icons/diary.png";
import newsIcon from "./assets/icons/news.png";
import feedbackIcon from "./assets/icons/feedback.png";

// Desktop Icons
const desktopIcons = [
  { id: "mycomp",      title: "My Computer",      icon: myComputerIcon,   app: "Explorer" },
  { id: "recycle",     title: "Recycle Bin",      icon: recycleBinIcon,   app: "RecycleBin" },
  { id: "profile",     title: "My Profile",       icon: userProfileIcon,  app: "Profile" },
  { id: "settings",    title: "Settings",         icon: settingsIcon,     app: "Settings" },
  { id: "upload",      title: "Upload Documents", icon: uploadDocsIcon,   app: "UploadDocs" },
  { id: "notes",       title: "Take Notes",       icon: notesIcon,        app: "Notepad" },
  { id: "genNotes",    title: "Generate Notes",   icon: generateNotesIcon,app: "GenerateNotes" },
  { id: "chatbot",     title: "ChatBot",          icon: chatBotIcon,      app: "ChatBot" },
  { id: "voicebot",    title: "VoiceBot",         icon: voiceBotIcon,     app: "VoiceBot" },
  { id: "planner",     title: "Planner",          icon: plannerIcon,      app: "Planner" },
  { id: "schedule",    title: "Schedule",         icon: scheduleIcon,     app: "Schedule" },
  { id: "games",       title: "Games",            icon: gamesIcon,        app: "Games" },
  { id: "todo",        title: "To Do",            icon: todoIcon,         app: "Todo" },
  { id: "studyDiary",  title: "Study Diary",      icon: studyDiaryIcon,   app: "StudyDiary" },
  { id: "news",        title: "News",             icon: newsIcon,         app: "News" },
  { id: "feedback",    title: "Feedback",         icon: feedbackIcon,     app: "Feedback" },
];

// App registry
const appRegistry = {
  Profile: ProfileApp,
  Explorer: Explorer,
  ChatBot: ChatBot,
  UploadDocs: UploadDocs,
  GenerateNotes: GenerateNotes,
  GenerateMindMap: GenerateMindMap,
  FileViewerApp: FileViewerApp,
  Notepad: NotepadApp,
  Browser: BrowserApp,
  Settings: SettingsApp,
  Feedback: FeedbackApp,
  Games: GamesApp,
  VoiceBot: VoiceBotApp,
  Planner: PlannerApp,
  News: NewsApp,
};

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
            e.stopPropagation();
            onStartMenu();
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
                {w.icon || "🗔"}
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
          )
        )}
        </div>
      </div>

      {/* Right side: tray + clock */}
      <div className="taskbar-right">
        <span title="Battery"></span>
        <span title="Volume"></span>
        <span title="Network"></span>
        <button
          className="tray-btn"
          title={darkMode ? "Light mode" : "Dark mode"}
          onClick={() => setDarkMode((d) => !d)}
        >
          {/* {darkMode ? "🌞" : "🌙"} */}
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
  const navigate = useNavigate();
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

  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [screensaverOpen, setScreensaverOpen] = useState(false);

  // power handlers
  function handleSignOut() {
    fetch("http://localhost:5000/api/logout", {
      method: "POST",
      credentials: "include",
    }).finally(() => {
      navigate("/boot");         
    });
  }

  function handleShutdown() {
    window.location.href = "about:blank";
  }

  function handleSleep() {
    setScreensaverOpen(true);
    setStartOpen(false);
  }
  
  useEffect(() => {
  const handleOpenChatbot = (e) => {
    const username = e?.detail?.username || "User";

    openWindow({
      id: `chatbot-${Date.now()}`,
      name: "ChatBot",
      title: "💬 Chatbot",
      content: () => <ChatBot username={username} />,
    });
  };

  window.addEventListener("openChatbot", handleOpenChatbot);
  return () => window.removeEventListener("openChatbot", handleOpenChatbot);
}, [openWindow]);


  // clock
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

  // current user
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
        if (name === "ChatBot") {
          return <ChatBot username={currentUser?.username} />;
        }
        if (name === "Profile") {
          return <ProfileApp user={currentUser} />;
        }
        if (name === "GenerateNotes") {
          return <GenerateNotes username={currentUser?.username} />;
        }
        if (name === "GenerateMindMap") {
          return <GenerateMindMap username={currentUser?.username} />;
        }
        return <AppComponent openWindow={wmOpenWindow} {...extraProps} />;
      },
    });

    setStartOpen(false);
  }

  const displayName = currentUser?.username || "User";

const allPrograms = [
  { name: "Profile", icon: "👤" },
  { name: "Explorer", icon: "🗂️" },
  { name: "UploadDocs", icon: "📤", label: "Upload Resources" },
  { name: "ChatBot", icon: "🤖", label: "Chatbot Assistant" },
  { name: "Notepad", icon: "🗒️", label: "Notepad" },
  { name: "Browser", icon: "🌐", label: "Resource Browser" },
  { name: "Calculator", icon: "🧮" },
  { name: "System Info", icon: "💻" },
  { name: "Settings", icon: "⚙️", label: "Settings" },
  { name: "Feedback", icon: "✉️", label: "Feedback" },
  { name: "Games", icon: "🎮", label: "Study Games" },
  { name: "VoiceBot", icon: "🎙️", label: "Voice Companion" },
  { name: "Planner", icon: "📅", label: "Study Planner" },
  { name: "News", icon: "📰", label: "Domain News" },
];


  const recent = [
    { id: 1, name: "Profile" },
    { id: 2, name: "Explorer" },
  ];
  const rightLinks = [
    "Profile",
    "Explorer",
    "Notepad",
    "Browser",
    "System Info",
    "Progress",
    "History",
  ];

  const filteredPrograms = allPrograms.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`win7-viewport${darkMode ? " dark" : ""}`}
      onClick={() => {
        setStartOpen(false);
      }}
    >
      <div
        className="wallpaper"
        style={{ backgroundImage: `url(${wallpaperImg})` }}
      />

      {/* Desktop Icons */}
      <div className="desktop-icons">
        {desktopIcons.map((item) => (
          <div key={item.id} className="icon" onDoubleClick={() => openAppByName(item.app)}>
            <img src={item.icon} alt={item.title} className="thumb" />
            <div className="title">{item.title}</div>
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
        <div
          className="start-overlay"
          onClick={() => setStartOpen(false)}
        >
          <div
            className="start-menu"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Start menu"
          >
            {/* LEFT PANEL */}
            <div className="start-left">
              <div className="start-left-header">
                <div className="start-left-header-title">Programs</div>
                <div className="start-left-header-date">
                  {new Date().toLocaleDateString()}
                </div>
              </div>

              <div className="programs" aria-label="Pinned programs">
                {filteredPrograms.map((p) => (
                  <div
                    key={p.name}
                    className="program-tile"
                    onClick={() => openAppByName(p.name)}
                  >
                    <div className="program-icon">{p.icon}</div>
                    <div style={{ fontSize: 13 }}>{p.name}</div>
                  </div>
                ))}
                {filteredPrograms.length === 0 && (
                  <div className="programs-empty">
                    No programs match "{searchQuery}"
                  </div>
                )}
              </div>

              <div className="recent-section">
                <div className="recent-title">Recently opened</div>
                <div className="recent-list">
                  {recent.map((r) => (
                    <div
                      key={r.id}
                      className="recent-item"
                      onClick={() => openAppByName(r.name)}
                    >
                      {r.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="start-search">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search programs and files"
                  aria-label="Start search"
                />
              </div>
            </div>


            {/* RIGHT PANEL */}
            <div className="start-right">
              <div className="user">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.14)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  👤
                </div>
                <div>
                  <div className="user-name">Welcome, {displayName}</div>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.9,
                      color: "rgba(0, 0, 0, 1)",
                    }}
                  >
                     PrepIQ Win 7
                  </div>
                </div>
              </div>

              <ul>
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

              <div className="start-footer">
                <div>
                  Signed in as <strong>{displayName}</strong>
                </div>
                <div className="power-buttons">
                  <button
                    className="power-btn"
                    onClick={handleSignOut}
                    title="Sign out"
                  >
                    ⎋ <span>Sign out</span>
                  </button>
                  <button
                    className="power-btn"
                    onClick={handleSleep}
                    title="Sleep"
                  >
                    🌙 <span>Sleep</span>
                  </button>
                  <button
                    className="power-btn"
                    onClick={handleShutdown}
                    title="Shut down"
                  >
                    ⏻ <span>Shut down</span>
                  </button>
                </div>
              </div>
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

      {/* Screensaver (Sleep) */}
      {screensaverOpen && (
        <div
          className="screensaver"
          onClick={() => setScreensaverOpen(false)}
          onKeyDown={() => setScreensaverOpen(false)}
          tabIndex={0}
        >
          <div className="screensaver-inner">
            <p className="quote">
              “Stay consistent. Small steps lead to big results.”
            </p>
            <p className="quote">
              “Debug your doubts like you debug your code.”
            </p>
          </div>
        </div>
      )}
    </div>
);
}