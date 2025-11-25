// src/App.jsx
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";

/*
 Single-file advanced Windows-7-style desktop with improved Start menu footer alignment.
 Default wallpaper path (your uploaded file):
 /mnt/data/f8dab4ce-4d3b-4338-a3d8-a61e2a0fea2e.png
*/

const DEFAULT_WALLPAPER = "/mnt/data/f8dab4ce-4d3b-4338-a3d8-a61e2a0fea2e.png";

// ----------------- CSS injected once -----------------
const css = `
:root{
  --taskbar-height:48px;
  --accent: #2f6ab8;
  --glass: rgba(255,255,255,0.08);
}
*{box-sizing:border-box}
html,body,#root{height:100%; margin:0; font-family: "Segoe UI", Tahoma, sans-serif;}
.win7-viewport{height:100vh; width:100vw; position:relative; overflow:hidden; background:#071826;}
.wallpaper{position:absolute; inset:0; background-size:cover; background-position:center; filter:brightness(1);}
.desktop-icons{position:absolute; left:20px; top:28px; color:#fff}
.icon{width:72px; text-align:center; margin-bottom:12px; cursor:pointer; user-select:none}
.icon .thumb{width:72px;height:72;border-radius:10px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;font-size:28px}
.taskbar{position:fixed; left:0; right:0; bottom:0; height:var(--taskbar-height); display:flex; align-items:center; padding:6px 12px; background:linear-gradient(180deg,#2b2b2b,#111); box-shadow:0 -6px 24px rgba(0,0,0,0.6); color:#fff}
.start-orb{width:44px;height:44; border-radius:10px; display:flex;align-items:center;justify-content:center;cursor:pointer; margin-left:6px}
.start-orb-inner{width:24px;height:24px;border-radius:999px;background:linear-gradient(180deg,var(--accent),#ff8b3d)}
.taskbar-buttons{display:flex; gap:8px; margin-left:12px; align-items:center}
.taskbar-button{display:flex; align-items:center; gap:8px; padding:6px 10px; border-radius:6px; background:rgba(255,255,255,0.02); cursor:pointer; min-width:110px; overflow:hidden}
.taskbar-right{margin-left:auto; display:flex; gap:10px; align-items:center}
.start-menu{position:fixed; bottom:54px; left:12px; width:420px; height:460px; border-radius:8px; overflow:hidden; box-shadow:0 18px 60px rgba(0,0,0,0.5); display:flex; background:linear-gradient(180deg,#fff,#f2f2f2); color:#111}
.start-left{width:62%; padding:14px; border-right:1px solid rgba(0,0,0,0.06)}
.start-right{width:38%; padding:14px; position:relative}
.start-footer{position:absolute; left:0; right:0; bottom:0; height:72px; display:flex; align-items:center; padding:10px 12px; border-top:1px solid rgba(0,0,0,0.06); background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02));}
.start-footer .left{flex:1}
.start-footer .right{display:flex; gap:8px; align-items:center}
.start-footer button{padding:8px 12px; border-radius:6px; border:none; cursor:pointer; background:#eee}
.start-footer button:hover{transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,0.12)}
.window{position:fixed; background:rgba(255,255,255,0.98); box-shadow:0 22px 60px rgba(0,0,0,0.45); border-radius:6px; overflow:hidden; transition:box-shadow .15s, transform .12s}
.window-header{height:36px; display:flex; align-items:center; padding:6px 10px; cursor:grab; background:linear-gradient(#e9f0ff,#cfe0f6); border-bottom:1px solid rgba(0,0,0,0.06)}
.window-buttons{margin-left:auto; display:flex; gap:6px}
.window-content{padding:12px; color:#222}
.aero{backdrop-filter: blur(8px); background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)); padding:8px; border-radius:8px}
.context-menu{position:fixed; background:#fff; box-shadow:0 8px 28px rgba(0,0,0,0.35); border-radius:6px; overflow:hidden; z-index:9999}
.small-muted{font-size:12px; color:#555}
`;

// inject CSS
function injectCSS() {
  try {
    if (typeof document === "undefined") return;
    if (document.getElementById("win7-css")) return;
    const s = document.createElement("style");
    s.id = "win7-css";
    s.innerHTML = css;
    document.head.appendChild(s);
  } catch (e) {}
}

// helpers
const uid = (p = "") => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${p}`;

// window manager hook
function useWindowManager() {
  const [wins, setWins] = useState([]);
  const [z, setZ] = useState([]);
  const next = useRef(1);

  function openWindow({ name, content, w = 520, h = 320, centered = true }) {
    const id = next.current++;
    const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
    const winH = typeof window !== "undefined" ? window.innerHeight : 800;
    const x = centered ? Math.max(20, (winW - w) / 2 + (Math.random() - 0.5) * 40) : 120 + Math.random() * 200;
    const y = centered ? Math.max(20, (winH - h) / 2 + (Math.random() - 0.5) * 40) : 80 + Math.random() * 120;
    const win = { id, name, content, x, y, w, h, state: "normal" };
    setWins((s) => [...s, win]);
    setZ((s) => [...s, id]);
    return id;
  }
  function closeWindow(id) {
    setWins((s) => s.filter((w) => w.id !== id));
    setZ((s) => s.filter((x) => x !== id));
  }
  function minimizeWindow(id) {
    setWins((s) => s.map((w) => (w.id === id ? { ...w, state: "minimized" } : w)));
    setZ((s) => s.filter((x) => x !== id));
  }
  function maximizeWindow(id) {
    setWins((s) => s.map((w) => (w.id === id ? { ...w, state: w.state === "maximized" ? "normal" : "maximized" } : w)));
    setZ((s) => [...s.filter((x) => x !== id), id]);
  }
  function focusWindow(id) {
    setZ((s) => [...s.filter((x) => x !== id), id]);
  }
  function updateWindow(id, patch) {
    setWins((s) => s.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }

  return { wins, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindow, z };
}

// draggable/resizable window component
const Win = forwardRef(function Win({ win, focused, onFocus, onClose, onMinimize, onMaximize, onUpdate }, ref) {
  const nodeRef = useRef();
  const dragging = useRef(false);
  const resizing = useRef(null);
  const rel = useRef({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({ node: nodeRef.current }));

  useEffect(() => {
    function onMove(e) {
      if (dragging.current) {
        const nx = e.clientX - rel.current.x;
        const ny = e.clientY - rel.current.y;
        onUpdate(win.id, { x: nx, y: ny });
      } else if (resizing.current) {
        const dir = resizing.current;
        const node = nodeRef.current;
        if (!node) return;
        let { x, y, w, h } = { x: node.offsetLeft, y: node.offsetTop, w: node.offsetWidth, h: node.offsetHeight };
        const minW = 220,
          minH = 140;
        if (dir.includes("r")) w = Math.max(minW, e.clientX - x);
        if (dir.includes("b")) h = Math.max(minH, e.clientY - y);
        if (dir.includes("l")) {
          const nx = Math.min(e.clientX, x + w - minW);
          w = w + (x - nx);
          x = nx;
        }
        if (dir.includes("t")) {
          const ny = Math.min(e.clientY, y + h - minH);
          h = h + (y - ny);
          y = ny;
        }
        onUpdate(win.id, { x, y, w, h });
      }
    }
    function onUp() {
      dragging.current = false;
      resizing.current = null;
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [win, onUpdate]);

  function headerDown(e) {
    e.stopPropagation();
    onFocus(win.id);
    if (win.state === "maximized") return;
    dragging.current = true;
    rel.current = { x: e.clientX - (win.x || 0), y: e.clientY - (win.y || 0) };
    document.body.style.userSelect = "none";
  }
  function startResize(dir, e) {
    e.stopPropagation();
    onFocus(win.id);
    resizing.current = dir;
    document.body.style.userSelect = "none";
  }

  const styles = {
    left: typeof win.x === "number" ? win.x : 100,
    top: typeof win.y === "number" ? win.y : 80,
    width: typeof win.w === "number" ? win.w : 520,
    height: typeof win.h === "number" ? win.h : 320,
    zIndex: focused ? 1000 : 200 + (win.id % 20),
    display: win.state === "minimized" ? "none" : "block",
    transform: focused ? "scale(1)" : "scale(0.999)",
  };
  if (win.state === "maximized") {
    const tb = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--taskbar-height") || 48);
    styles.left = 8;
    styles.top = 8;
    styles.width = (window.innerWidth || 1200) - 16;
    styles.height = (window.innerHeight || 800) - tb - 16;
  }

  return (
    <div ref={nodeRef} className="window" style={styles} onMouseDown={() => onFocus(win.id)}>
      <div className="window-header" onMouseDown={headerDown}>
        <div style={{ fontWeight: 600 }}>{win.name}</div>
        <div className="window-buttons">
          <button title="Minimize" onClick={(e) => { e.stopPropagation(); onMinimize(win.id); }}>—</button>
          <button title="Maximize" onClick={(e) => { e.stopPropagation(); onMaximize(win.id); }}>□</button>
          <button title="Close" onClick={(e) => { e.stopPropagation(); onClose(win.id); }}>✕</button>
        </div>
      </div>
      <div className="window-content" style={{ height: "calc(100% - 36px)", overflow: "auto" }}>
        {typeof win.content === "function" ? win.content({ id: win.id }) : win.content}
      </div>

      {/* Resize handles */}
      <div onMouseDown={(e) => startResize("r", e)} style={{ position: "absolute", right: 0, top: 8, width: 8, height: "calc(100% - 16px)", cursor: "e-resize" }} />
      <div onMouseDown={(e) => startResize("b", e)} style={{ position: "absolute", bottom: 0, left: 8, height: 8, width: "calc(100% - 16px)", cursor: "s-resize" }} />
      <div onMouseDown={(e) => startResize("rb", e)} style{{ position: "absolute", right: 0, bottom: 0, width: 12, height: 12, cursor: "nwse-resize" }} />
      <div onMouseDown={(e) => startResize("l", e)} style={{ position: "absolute", left: 0, top: 8, width: 8, height: "calc(100% - 16px)", cursor: "w-resize" }} />
      <div onMouseDown={(e) => startResize("t", e)} style={{ position: "absolute", left: 8, top: 0, width: "calc(100% - 16px)", height: 8, cursor: "n-resize" }} />
    </div>
  );
});

// ----------------- Demo app components -----------------
function ExplorerApp() {
  return (
    <div style={{ color: "#222" }}>
      <h3>Explorer</h3>
      <p>Folder preview</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        {["Documents", "Pictures", "Music", "Videos"].map((k) => (
          <div key={k} className="aero" style={{ padding: 10 }}>
            <strong>{k}</strong>
            <div className="small-muted">Folder</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function NotepadApp() {
  const [text, setText] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type here..." style={{ flex: 1, width: "100%", padding: 8, borderRadius: 4 }} />
      <div style={{ marginTop: 8 }}>
        <button onClick={() => alert("Saved (demo)")}>Save</button>
      </div>
    </div>
  );
}
function BrowserApp() { return <div><h3>Browser</h3><p>Demo browser window</p></div>; }
function CalculatorApp() {
  const [expr, setExpr] = useState("");
  const [res, setRes] = useState("");
  function calc() {
    try { const v = eval(expr); setRes(String(v)); } catch { setRes("err"); }
  }
  return (
    <div>
      <h3>Calculator</h3>
      <input value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="2+2" />
      <button onClick={calc}>=</button>
      <div>Result: {res}</div>
    </div>
  );
}
function SystemInfoApp() {
  return (
    <div>
      <h3>System Info</h3>
      <ul><li>OS: Windows 7 (sim)</li><li>Memory: simulated</li></ul>
    </div>
  );
}

// ----------------- Main App -----------------
export default function App() {
  injectCSS();
  useEffect(() => { console.log("App mounted - Start menu footer aligned"); }, []);

  const { wins, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindow, z } = useWindowManager();
  const [startOpen, setStartOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeStr, setTimeStr] = useState("");
  const [wallpaper, setWallpaper] = useState(DEFAULT_WALLPAPER);
  const [context, setContext] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTimeStr(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })), 1000);
    setTimeStr(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setStartOpen(false);
      if (e.key.toLowerCase() === "d" && (e.ctrlKey || e.metaKey)) wins.forEach((w) => minimizeWindow(w.id));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wins]);

  useEffect(() => {
    if (wins.length === 0) {
      openWindow({ name: "Welcome", content: () => (<div style={{ padding: 12 }}><h2>Welcome</h2><div className="small-muted">Double-click My Computer to open Explorer</div></div>) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAppByName(name) {
    let content;
    switch (name) {
      case "Explorer": content = () => <ExplorerApp />; break;
      case "Notepad": content = () => <NotepadApp />; break;
      case "Browser": content = () => <BrowserApp />; break;
      case "Calculator": content = () => <CalculatorApp />; break;
      case "System Info": content = () => <SystemInfoApp />; break;
      default: content = () => <div style={{ padding: 12 }}><h3>{name}</h3><p>Demo</p></div>;
    }
    openWindow({ name, content });
    setStartOpen(false);
  }

  function onContext(e, type = "desktop") {
    e.preventDefault();
    setContext({ x: e.clientX, y: e.clientY, type });
  }
  function closeContext() { setContext(null); }

  function onWallpaperUpload(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setWallpaper(URL.createObjectURL(f));
  }

  const desktopIcons = [
    { id: "mycomp", title: "My Computer", icon: "🗂️", app: "Explorer" },
    { id: "recycle", title: "Recycle Bin", icon: "🗑️", app: "Explorer" },
  ];

  // Start menu actions
  function handleRestart() {
    alert("Restart (demo)");
  }
  function handleShutdown() {
    alert("Shutdown (demo)");
  }
  function handleReset() {
    // Example reset: close all windows
    if (confirm("Reset desktop (close all windows)?")) {
      wins.forEach((w) => closeWindow(w.id));
    }
  }

  return (
    <div className="win7-viewport" onContextMenu={(e) => onContext(e, "desktop")}>
      <div className="wallpaper" style={{
        backgroundImage: wallpaper ? `url('${wallpaper}')` : undefined,
        background: wallpaper ? undefined : "linear-gradient(135deg,#07293a,#04202a)"
      }} />

      <div className="desktop-icons">
        {desktopIcons.map((ic) => (
          <div key={ic.id} className="icon" onDoubleClick={() => openAppByName(ic.app)} title={ic.title}>
            <div className="thumb">{ic.icon}</div>
            <div style={{ marginTop: 8, color: "#fff", width: 72, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ic.title}</div>
          </div>
        ))}
      </div>

      {/* Windows */}
      {wins.map((w) => (
        <Win
          key={w.id}
          win={w}
          ref={null}
          focused={z[z.length - 1] === w.id}
          onFocus={(id) => focusWindow(id)}
          onClose={(id) => closeWindow(id)}
          onMinimize={(id) => minimizeWindow(id)}
          onMaximize={(id) => maximizeWindow(id)}
          onUpdate={(id, patch) => updateWindow(id, patch)}
        />
      ))}

      {/* Start menu (aligned footer with Restart/Shutdown/Reset on bottom-right) */}
      {startOpen && (
        <div className="start-menu" style={{ zIndex: 900 }}>
          <div className="start-left">
            <input placeholder="Search programs and files" style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }} />
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {["Explorer", "Notepad", "Calculator", "Browser", "System Info"].map((n) => (
                <div key={n} onClick={() => openAppByName(n)} style={{ padding: 8, background: "#f2f4fb", borderRadius: 4, cursor: "pointer" }}>{n}</div>
              ))}
            </div>
          </div>
          <div className="start-right">
            <h4 style={{ marginTop: 0 }}>Libraries</h4>
            <ul style={{ paddingLeft: 18 }}>
              <li>Documents</li>
              <li>Pictures</li>
              <li>Music</li>
            </ul>

            {/* footer sits at bottom of start-right container but spans full width via absolute positioning */}
            <div className="start-footer" style={{ position: "absolute", left: 0, right: 0 }}>
              <div className="left">
                <div style={{ fontSize: 12, color: "#666" }}>Signed in as <strong>User</strong></div>
              </div>
              <div className="right">
                <button onClick={handleRestart} title="Restart">Restart</button>
                <button onClick={handleShutdown} title="Shutdown">Shutdown</button>
                <button onClick={handleReset} title="Reset">Reset</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="taskbar" style={{ zIndex: 800 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="start-orb" onClick={() => setStartOpen((s) => !s)} title="Start">
            <div className="start-orb-inner" />
          </div>

          <div className="taskbar-buttons">
            {wins.map((w) => (
              <div key={w.id} className="taskbar-button" onClick={() => {
                if (w.state === "minimized") updateWindow(w.id, { state: "normal" }), focusWindow(w.id);
                else minimizeWindow(w.id);
              }} style={{ border: z[z.length - 1] === w.id ? "2px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ width: 28, height: 28, background: "rgba(255,255,255,0.04)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>{w.name[0]}</div>
                <div style={{ fontSize: 13, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="taskbar-right">
          <input id="wallpaper-file" type="file" accept="image/*" onChange={onWallpaperUpload} style={{ display: "none" }} />
          <label htmlFor="wallpaper-file" style={{ cursor: "pointer", color: "#fff", opacity: 0.95 }}>Change Wallpaper</label>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div title="Battery">🔋</div>
            <div title="Volume">🔊</div>
            <div title="Network">📶</div>
          </div>

          <div style={{ cursor: "pointer", padding: "6px 10px", borderRadius: 6 }} onClick={() => setCalendarOpen((c) => !c)}>
            <div style={{ textAlign: "right" }}>{timeStr}</div>
            <div style={{ fontSize: 11 }}>{new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Calendar popup */}
      {calendarOpen && (
        <div style={{ position: "fixed", right: 12, bottom: 60, width: 260, background: "white", borderRadius: 8, boxShadow: "0 12px 40px rgba(0,0,0,0.5)", padding: 12, zIndex: 910 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d) => <div key={d} style={{ textAlign: "center", fontWeight: 600 }}>{d}</div>)}
            {Array.from({ length: 30 }).map((_, i) => <div key={i} style={{ height: 28, textAlign: "center", paddingTop: 4 }}>{i + 1}</div>)}
          </div>
        </div>
      )}

      {/* Context menu */}
      {context && (
        <div className="context-menu" style={{ left: context.x, top: context.y, zIndex: 999 }}>
          {context.type === "desktop" ? (
            <div>
              <div style={{ padding: 10, minWidth: 180, cursor: "pointer" }} onClick={() => { document.getElementById("wallpaper-file").click(); closeContext(); }}>Change desktop background</div>
              <div style={{ padding: 10, cursor: "pointer" }} onClick={() => { wins.forEach((w) => minimizeWindow(w.id)); closeContext(); }}>Show desktop</div>
            </div>
          ) : <div style={{ padding: 10 }}>No actions</div>}
        </div>
      )}
    </div>
  );
}
