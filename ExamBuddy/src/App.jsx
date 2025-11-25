import React, { useState, useEffect } from "react";
import { Rnd } from "react-rnd";

// Wallpaper and logo from public CDN (you can substitute your image/file path)
const WALLPAPER_URL = "https://wallpapercave.com/wp/wp4092580.jpg";
const WINDOWS_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/3/3b/Windows_7_Logo.svg";

const css = `
body,html,#root { padding:0;margin:0; height:100%; width:100%; font-family:'Segoe UI',Arial,Tahoma,sans-serif; }
.win7-bg { background:url('${WALLPAPER_URL}') center/cover no-repeat fixed; width:100vw; height:100vh; position:fixed; top:0;left:0;z-index:0; }
.win7-logo { position:fixed; left:50%; top:42%; transform:translate(-50%,-50%); width:320px; pointer-events:none; opacity:0.90; z-index:1;}
.desktop-bin { position:fixed; top:28px; left:24px; width:72px; text-align:center; color:#fff; z-index:2;}
.bin-thumb { width:72px; height:72px; border-radius:8px; background:rgba(255,255,255,0.05); display:flex;align-items:center;justify-content:center; font-size:36px;}
.bin-label { margin-top:6px; color:#fff; font-size:14px; text-shadow:1px 1px 2px #0008;}
.win7-taskbar { position:fixed; left:0; bottom:0; width:100vw; height:46px; background:linear-gradient(180deg,#e2eaf6 80%,#b5cde8 100%); box-shadow: 0 -2px 8px #0008; border-top: 1px solid #d5e5f5; display:flex;align-items:center;z-index:15;}
.win7-start-btn { width:44px;height:44px; margin-left:16px; border-radius:8px; background:#eaf6ff; display:flex;align-items:center;justify-content:center; box-shadow:0 2px 8px #467bc055; cursor:pointer;}
.win7-start-btn img { width:32px; height:32px;}
.win7-taskbar-icons { display:flex; align-items:center; margin-left:16px; }
.win7-taskbar-clock { margin-left:auto; margin-right:18px; color:#355; font-size:15px; font-weight:500; letter-spacing:0.5px;}
.win7-taskbar-tray { display:flex; align-items:center; gap:14px; margin-right:32px;}
.win7-taskbar-tray span { font-size:20px; }
.win7-start-menu { position:fixed; left:18px; bottom:54px; width:400px; height:420px; background:linear-gradient(180deg,#f6fcfe,#e9f1fb 75%,#c8daf2 100%); border:2.5px solid #a2c1e7; border-radius:12px; box-shadow:0 10px 60px #000b; display:flex; z-index:200;}
.win7-menu-left { width:53%; padding:12px 10px 0 16px; border-right:1px solid #bcd1e7;}
.win7-menu-left .menu-title {font-size:17px; font-weight:500; margin-bottom:18px; color:#2f6ab8;}
.win7-menu-apps { margin-bottom:22px;}
.win7-menu-apps button { display:block; width:100%; text-align:left; margin-bottom:7px; font-size:14px; background:rgba(255,255,255,0.9); border:none; border-radius:5px; padding:9px 16px; cursor:pointer; transition:background 0.23s, opacity 0.18s;}
.win7-menu-apps button:hover { opacity:0.68; background:#d3e8fc;}
.win7-menu-left .menu-footer { margin-top:16px; color:#757;}
.win7-menu-right {width:47%; padding:12px 10px 0 13px; display:flex; flex-direction:column; align-items:flex-start;}
.win7-menu-user {margin-bottom:14px; font-size:15px; color:#356; font-weight:500;}
.win7-menu-links { margin-bottom:16px;}
.win7-menu-links div { margin-bottom:8px; font-size:15px; cursor:pointer; }
.win7-menu-links div:hover { text-decoration:underline; color:#247;}
.win7-menu-actions { margin-top:auto; width:100%; display:flex; gap:8px; padding-bottom:14px;}
.win7-menu-actions button { padding:8px 16px; background:#e2eaf6; border-radius:6px; border:none; font-size:14px; cursor:pointer; }
.win7-menu-actions button:hover { background:#b5cde8;}
.win7-window {position:fixed; background:rgba(255,255,255,0.98); box-shadow:0 24px 60px #0007; border-radius:8px; overflow:hidden; transition:box-shadow .15s;}
.win7-win-header { height:34px; display:flex; align-items:center; padding:7px 14px; background:linear-gradient(#e1edfd 60%,#cadcf7 100%); border-bottom:1.5px solid #bcd1e7;}
.win7-win-title {font-weight:600; color:#245; font-size:15px;}
.win7-win-controls {margin-left:auto; display:flex;gap:5px;}
.win7-win-controls button { background:#eaf6ff; border:1px solid #c6e0fd; border-radius:3px; width:24px; height:24px; font-size:14px; cursor:pointer;}
.win7-win-controls button:hover { background:#fbe9d3;}
.win7-win-content {padding:16px; color:#222;}
`;

function injectCSS() {
  if (typeof document !== "undefined" && !document.getElementById("win7css")) {
    const s = document.createElement("style");
    s.id = "win7css";
    s.innerHTML = css;
    document.head.appendChild(s);
  }
}

// Window component with draggable and window controls
function Win7Window({ title, children, x = 180, y = 110, width = 340, height = 244, onClose, onMinimize, onMaximize }) {
  const [maximized, setMaximized] = useState(false);
  return (
    <Rnd
      default={{ x, y, width, height }}
      bounds="parent"
      enableResizing={!maximized}
      style={{
        zIndex: 400,
        ...(maximized
          ? { position: "fixed", left: 8, top: 8, width: "calc(100vw - 16px)", height: "calc(100vh - 58px)" }
          : {}),
      }}
      dragHandleClassName="win7-win-header"
    >
      <div className="win7-window" style={maximized ? { left: 8, top: 8, width: "calc(100vw - 16px)", height: "calc(100vh - 58px)" } : {}}>
        <div className="win7-win-header">
          <span className="win7-win-title">{title}</span>
          <div className="win7-win-controls">
            <button tabIndex={-1} title="Minimize" onClick={() => onMinimize && onMinimize()}>&#8211;</button>
            <button tabIndex={-1} title={maximized ? "Restore" : "Maximize"} onClick={() => setMaximized(!maximized)}>{maximized ? "❐" : "□"}</button>
            <button tabIndex={-1} title="Close" onClick={() => onClose && onClose()}>×</button>
          </div>
        </div>
        <div className="win7-win-content">
          {children}
        </div>
      </div>
    </Rnd>
  );
}

// Main App
export default function App() {
  injectCSS();

  // Start Menu state
  const [menu, setMenu] = useState(false);
  // Demo: open a Notepad window
  const [notepadOpen, setNotepadOpen] = useState(false);
  // Demo: Notepad text
  const [noteText, setNoteText] = useState("");

  // Show clock
  const [timeStr, setTimeStr] = useState("");
  useEffect(() => {
    setTimeStr(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    const t = setInterval(() => setTimeStr(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <div className="win7-bg" />
      <img src={WINDOWS_LOGO_URL} className="win7-logo" alt="Windows logo" />
      <div className="desktop-bin">
        <div className="bin-thumb">🗑️</div>
        <div className="bin-label">Recycle Bin</div>
      </div>

      {/* Taskbar */}
      <div className="win7-taskbar">
        <div className="win7-start-btn" onClick={() => setMenu(!menu)} title="Start">
          <img src={WINDOWS_LOGO_URL} alt="Start" />
        </div>
        <div className="win7-taskbar-icons">
          {/* demo icons with translucent hover */}
          <div style={{ marginLeft: 22, opacity: notepadOpen ? 0.7 : 1, transition: "opacity 0.25s" }}>
            <span
              style={{ cursor: "pointer", fontSize: 23 }}
              onDoubleClick={() => setNotepadOpen(true)}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.5")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              title="Open Notepad"
            >📝</span>
          </div>
        </div>
        <div className="win7-taskbar-tray">
          <span title="Network">📶</span>
          <span title="Volume">🔊</span>
          <span title="Battery">🔋</span>
        </div>
        <div className="win7-taskbar-clock">{timeStr}</div>
      </div>

      {/* Start menu */}
      {menu && (
        <div className="win7-start-menu" tabIndex={-1}>
          <div className="win7-menu-left">
            <div className="menu-title">Tiffany</div>
            <div className="win7-menu-apps">
              <button onDoubleClick={() => setNotepadOpen(true)}>Notepad</button>
              <button disabled>Calculator</button>
              <button disabled>Paint</button>
              <button disabled>Solitaire</button>
            </div>
            <div className="menu-footer">All Programs</div>
          </div>
          <div className="win7-menu-right">
            <div className="win7-menu-user">Tiffany</div>
            <div className="win7-menu-links">
              <div>Documents</div>
              <div>Pictures</div>
              <div>Music</div>
              <div>Computer</div>
              <div>Control Panel</div>
            </div>
            <div className="win7-menu-actions">
              <button onClick={() => window.location.reload()}>Log Off</button>
              <button onClick={() => setMenu(false)}>Shutdown</button>
            </div>
          </div>
        </div>
      )}

      {/* Notepad window */}
      {notepadOpen && (
        <Win7Window
          title="Notepad"
          onClose={() => setNotepadOpen(false)}
          onMinimize={() => setNotepadOpen(false)}
        >
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            style={{
              width: "100%",
              height: "110px",
              borderRadius: "5px",
              fontFamily: "inherit",
              fontSize: "15px",
              padding: "8px",
              resize: "none",
              marginBottom: "12px"
            }}
            placeholder="Type here..."
          />
          <button onClick={() => alert("Saved (demo)")}>Save</button>
        </Win7Window>
      )}
    </>
  );
}
