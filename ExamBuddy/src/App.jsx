// src/App.jsx
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";

/*
  Final Windows7-style App.jsx (single file)

  - Start orb image (uploaded) used as Start button:
    /mnt/data/A_digital_vector_graphic_features_the_Microsoft_Wi.png
  - Wallpaper path default: "./wallpaper.jpg"
  - Taskbar: greyish-black translucent (Aero-like)
  - Start menu: Windows 7 Standard two-column layout, search bar, pinned apps, recently used, right system list
  - Footer: Shutdown button (click shows dropdown: Shutdown / Restart / Log off / Sleep) aligned at bottom-right
  - Full-year calendar with Close (X) and draggable header
  - Draggable/resizable windows, desktop icons, context menu, keyboard shortcuts
*/

const START_ORB = "./start.jpg"; // developer-provided uploaded image
const DEFAULT_WALLPAPER = "./wallpaper.jpg";

/* ---------- Styles ---------- */
const css = `
:root{
  --taskbar-height:48px;
  --accent:#2f6ab8;
}
*{box-sizing:border-box}
html,body,#root{height:100%; margin:0; font-family: "Segoe UI", Tahoma, sans-serif; background:#071826;}
.win7-viewport{height:100vh; width:100vw; position:relative; overflow:hidden;}
.wallpaper{position:absolute; inset:0; background-size:cover; background-position:center; filter:brightness(1);}
.desktop-icons{position:absolute; left:20px; top:28px; color:#fff}
.icon{width:72px; text-align:center; margin-bottom:12px; cursor:pointer; user-select:none}
.icon .thumb{width:72px;height:72;border-radius:10px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;font-size:28px}

/* Taskbar - greyish black translucent with blur (Aero-like) */
.taskbar{
  position:fixed;
  left:0; right:0; bottom:0; height:var(--taskbar-height);
  display:flex; align-items:center; padding:6px 12px;
  background: rgba(22,22,22,0.70);
  backdrop-filter: blur(6px) saturate(120%);
  box-shadow: 0 -6px 24px rgba(0,0,0,0.6);
  border-top: 1px solid rgba(255,255,255,0.03);
  color: #fff;
  z-index: 800;
}

/* Start orb (48px) */
.start-orb {
  width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center;
  margin-left:6px; cursor:pointer; user-select:none;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  box-shadow: inset 0 -2px 4px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.35);
}
.start-orb img { width:32px; height:32px; display:block; pointer-events:none; }

/* Taskbar app buttons */
.taskbar-buttons{ display:flex; gap:8px; margin-left:12px; align-items:center; }
.taskbar-button{ display:flex; align-items:center; gap:8px; padding:6px 10px; border-radius:6px; background:rgba(255,255,255,0.02); cursor:pointer; min-width:110px; overflow:hidden; color:#fff }
.taskbar-button.active { border: 2px solid rgba(255,255,255,0.06); }

/* Right side of taskbar */
.taskbar-right{ margin-left:auto; display:flex; gap:10px; align-items:center; color:#fff; }

/* Start overlay and menu (Windows 7 standard two-column) */
.start-overlay{
  position:fixed; inset:0; background: rgba(0,0,0,0.45); backdrop-filter: blur(2px); z-index:900;
  display:flex; align-items:flex-end; justify-content:flex-start;
}
.start-menu {
  width:460px; height:480px; margin: 0 0 56px 12px; border-radius:8px; overflow:hidden;
  display:flex; box-shadow: 0 24px 60px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.04);
  background: linear-gradient(180deg,#2b2b2b,#1a1a1a);
}
.start-left { width:62%; padding:14px; background: linear-gradient(180deg,#fff,#f2f2f2); color:#111; display:flex; flex-direction:column; }
.start-right { width:38%; padding:14px; position:relative; color:#eee; display:flex; flex-direction:column; }

/* Search box bottom-left like Win7 */
.start-search {
  margin-top: auto; padding-top: 12px;
}
.start-search input {
  width:100%; padding:8px; border-radius:4px; border:1px solid #ccc;
}

/* Pinned / Programs grid */
.start-left .programs { margin-top:12px; display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.start-left .programs > div { padding:8px; background:#f2f4fb; border-radius:6px; cursor:pointer; }

/* Recently area inside left */
.recent-list{ margin-top:10px; display:flex; flex-direction:column; gap:6px; }

/* Right panel system links and user */
.start-right .user { display:flex; gap:8px; align-items:center; margin-bottom:12px; }
.start-right ul { padding-left:18px; margin:0; margin-bottom:12px; }

/* Footer (bottom-right) with shutdown dropdown */
.start-footer { position:absolute; left:0; right:0; bottom:0; height:72px; display:flex; align-items:center; padding:10px 12px; border-top:1px solid rgba(255,255,255,0.04); background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02)); }
.start-footer .left { flex:1; color:#bbb; }
.start-footer .right { display:flex; gap:8px; align-items:center; }
.shutdown-btn { padding:8px 12px; border-radius:6px; border:none; cursor:pointer; background:#eee; color:#111; position:relative; }
.shutdown-menu { position:absolute; right:12px; bottom:82px; background:#fff; border-radius:6px; box-shadow:0 12px 40px rgba(0,0,0,0.35); overflow:hidden; z-index:950; min-width:160px; }
.shutdown-menu button { width:100%; text-align:left; padding:10px 12px; border:none; background:transparent; cursor:pointer; }
.shutdown-menu button:hover { background:#f2f2f2; }

/* Windows and window header */
.window{ position:fixed; background:rgba(255,255,255,0.98); box-shadow:0 22px 60px rgba(0,0,0,0.45); border-radius:6px; overflow:hidden; }
.window-header{ height:36px; display:flex; align-items:center; padding:6px 10px; cursor:grab; background:linear-gradient(#e9f0ff,#cfe0f6); border-bottom:1px solid rgba(0,0,0,0.06); color:#111; }
.window-buttons{ margin-left:auto; display:flex; gap:6px; }
.window-content{ padding:12px; color:#222; }

/* Calendar */
.calendar-grid{ display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; padding:10px; }
.calendar-month{ background:#fff; color:#111; border-radius:6px; padding:8px; }
.calendar-month h5{ margin:0 0 6px 0; font-size:14px; }

/* Context menu */
.context-menu{ position:fixed; background:#fff; box-shadow:0 8px 28px rgba(0,0,0,0.35); border-radius:6px; overflow:hidden; z-index:9999; }
.small-muted{ font-size:12px; color:#555; }
`;

/* inject CSS */
function injectCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("win7-css")) return;
  const s = document.createElement("style");
  s.id = "win7-css";
  s.innerHTML = css;
  document.head.appendChild(s);
}

/* ---------- Utilities & window manager ---------- */
const uid = (p = "") => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}${p}`;

function useWindowManager() {
  const [wins, setWins] = useState([]);
  const [z, setZ] = useState([]);
  const next = useRef(1);
  function openWindow({ name, content, w=520, h=320, centered=true }) {
    const id = next.current++;
    const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
    const winH = typeof window !== "undefined" ? window.innerHeight : 800;
    const x = centered ? Math.max(20, (winW - w)/2 + (Math.random()-0.5)*40) : 120 + Math.random()*200;
    const y = centered ? Math.max(20, (winH - h)/2 + (Math.random()-0.5)*40) : 80 + Math.random()*120;
    const win = { id, name, content, x, y, w, h, state:'normal' };
    setWins(s => [...s, win]);
    setZ(s => [...s, id]);
    return id;
  }
  function closeWindow(id){ setWins(s=> s.filter(w=> w.id !== id)); setZ(s=> s.filter(x=> x !== id)); }
  function minimizeWindow(id){ setWins(s=> s.map(w=> w.id===id?{...w, state:'minimized'}:w)); setZ(s=> s.filter(x=> x!== id)); }
  function maximizeWindow(id){ setWins(s=> s.map(w=> w.id===id?{...w, state: w.state==='maximized'?'normal':'maximized'}:w)); setZ(s=> [...s.filter(x=> x!==id), id]); }
  function focusWindow(id){ setZ(s=> [...s.filter(x=> x!==id), id]); }
  function updateWindow(id, patch){ setWins(s=> s.map(w=> w.id===id?{...w, ...patch}: w)); }
  return { wins, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindow, z };
}

/* ---------- Window component (draggable/resizable) ---------- */
const Win = forwardRef(function Win({ win, focused, onFocus, onClose, onMinimize, onMaximize, onUpdate }, ref) {
  const nodeRef = useRef();
  const dragging = useRef(false);
  const resizing = useRef(null);
  const rel = useRef({ x:0,y:0 });
  useImperativeHandle(ref, ()=> ({ node: nodeRef.current }));

  useEffect(()=> {
    function onMove(e){
      if (dragging.current){
        const nx = e.clientX - rel.current.x;
        const ny = e.clientY - rel.current.y;
        onUpdate(win.id, { x: nx, y: ny });
      } else if (resizing.current) {
        const dir = resizing.current;
        const node = nodeRef.current;
        if (!node) return;
        let { x, y, w, h } = { x: node.offsetLeft, y: node.offsetTop, w: node.offsetWidth, h: node.offsetHeight };
        const minW = 220, minH = 140;
        if (dir.includes('r')) w = Math.max(minW, e.clientX - x);
        if (dir.includes('b')) h = Math.max(minH, e.clientY - y);
        if (dir.includes('l')) { const nx = Math.min(e.clientX, x + w - minW); w = w + (x - nx); x = nx; }
        if (dir.includes('t')) { const ny = Math.min(e.clientY, y + h - minH); h = h + (y - ny); y = ny; }
        onUpdate(win.id, { x, y, w, h });
      }
    }
    function onUp(){ dragging.current = false; resizing.current = null; document.body.style.userSelect = ''; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return ()=> { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [win, onUpdate]);

  function headerDown(e){ e.stopPropagation(); onFocus(win.id); if (win.state==='maximized') return; dragging.current = true; rel.current = { x: e.clientX - (win.x||0), y: e.clientY - (win.y||0) }; document.body.style.userSelect = 'none'; }
  function startResize(dir,e){ e.stopPropagation(); onFocus(win.id); resizing.current = dir; document.body.style.userSelect = 'none'; }

  const styles = {
    left: typeof win.x === 'number' ? win.x : 100,
    top: typeof win.y === 'number' ? win.y : 80,
    width: typeof win.w === 'number' ? win.w : 520,
    height: typeof win.h === 'number' ? win.h : 320,
    zIndex: focused ? 1000 : 200 + (win.id % 20),
    display: win.state === 'minimized' ? 'none' : 'block'
  };
  if (win.state === 'maximized'){
    const tb = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height') || 48);
    styles.left = 8; styles.top = 8; styles.width = (window.innerWidth || 1200) - 16; styles.height = (window.innerHeight || 800) - tb - 16;
  }

  return (
    <div ref={nodeRef} className="window" style={styles} onMouseDown={()=> onFocus(win.id)}>
      <div className="window-header" onMouseDown={headerDown}>
        <div style={{fontWeight:600}}>{win.name}</div>
        <div className="window-buttons">
          <button title="Minimize" onClick={(e)=>{ e.stopPropagation(); onMinimize(win.id); }}>—</button>
          <button title="Maximize" onClick={(e)=>{ e.stopPropagation(); onMaximize(win.id); }}>□</button>
          <button title="Close" onClick={(e)=>{ e.stopPropagation(); onClose(win.id); }}>✕</button>
        </div>
      </div>
      <div className="window-content" style={{height:'calc(100% - 36px)', overflow:'auto'}}>
        {typeof win.content === 'function' ? win.content({ id: win.id }) : win.content}
      </div>

      {/* resize handles */}
      <div onMouseDown={(e)=> startResize('r',e)} style={{position:'absolute', right:0, top:8, width:8, height:'calc(100% - 16px)', cursor:'e-resize'}} />
      <div onMouseDown={(e)=> startResize('b',e)} style={{position:'absolute', bottom:0, left:8, height:8, width:'calc(100% - 16px)', cursor:'s-resize'}} />
      <div onMouseDown={(e)=> startResize('rb',e)} style={{position:'absolute', right:0, bottom:0, width:12, height:12, cursor:'nwse-resize'}} />
      <div onMouseDown={(e)=> startResize('l',e)} style={{position:'absolute', left:0, top:8, width:8, height:'calc(100% - 16px)', cursor:'w-resize'}} />
      <div onMouseDown={(e)=> startResize('t',e)} style={{position:'absolute', left:8, top:0, width:'calc(100% - 16px)', height:8, cursor:'n-resize'}} />
    </div>
  );
});

/* ------- Demo app contents ------- */
function ExplorerApp(){ return (<div><h3>Explorer</h3><p>Demo folders:</p><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>{['Documents','Pictures','Music','Videos'].map(k=> <div key={k} className="aero" style={{padding:10}}><strong>{k}</strong><div className="small-muted">Folder</div></div>)}</div></div>); }
function NotepadApp(){ const [text,setText]=useState(''); return (<div style={{display:'flex',flexDirection:'column',height:'100%'}}><textarea value={text} onChange={e=>setText(e.target.value)} style={{flex:1,width:'100%',padding:8,borderRadius:4}} placeholder="Type..." /><div style={{marginTop:8}}><button onClick={()=>alert('Saved (demo)')}>Save</button></div></div>); }
function BrowserApp(){ return (<div><h3>Browser</h3><p>Demo browser window</p></div>); }
function CalculatorApp(){ const [expr,setExpr]=useState(''); const [res,setRes]=useState(''); function calc(){ try{ const v = eval(expr); setRes(String(v)); } catch { setRes('err'); } } return (<div><h3>Calculator</h3><input value={expr} onChange={e=>setExpr(e.target.value)} placeholder="2+2"/><button onClick={calc}>=</button><div>Result: {res}</div></div>); }
function SystemInfoApp(){ return (<div><h3>System Info</h3><ul><li>OS: Windows 7 (sim)</li><li>Memory: simulated</li></ul></div>); }

/* ---------- Full-year calendar renderer ---------- */
function renderYearCalendar(year = new Date().getFullYear()){
  const months = [...Array(12)].map((_,i)=>{
    const first = new Date(year,i,1);
    const days = new Date(year,i+1,0).getDate();
    const startDay = first.getDay();
    const cells = [];
    for(let x=0;x<startDay;x++) cells.push(null);
    for(let d=1; d<=days; d++) cells.push(d);
    return { i, name: first.toLocaleString(undefined,{ month:'short' }), cells };
  });
  return (
    <div className="calendar-grid">
      {months.map(m=>(
        <div key={m.i} className="calendar-month">
          <h5>{m.name}</h5>
          <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, fontSize:12}}>
            {['S','M','T','W','T','F','S'].map(d=> <div key={d} style={{textAlign:'center', fontWeight:600}}>{d}</div>)}
            {m.cells.map((c,idx)=>(<div key={idx} style={{height:18, textAlign:'center', opacity: c?1:0.2}}>{c||''}</div>))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Draggable Calendar wrapper ---------- */
function DraggableCalendar({ children, onClose }){
  const ref = useRef();
  const dragging = useRef(false);
  const rel = useRef({ x:0,y:0 });
  const [pos, setPos] = useState({ x: window.innerWidth - 740, y: window.innerHeight - 480 - 60 });

  useEffect(()=>{
    function onMove(e){ if(!dragging.current) return; setPos(p=> ({ x: e.clientX - rel.current.x, y: e.clientY - rel.current.y })); }
    function onUp(){ dragging.current = false; document.body.style.userSelect = ''; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return ()=> { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  },[]);

  function headerDown(e){ e.stopPropagation(); dragging.current = true; rel.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; document.body.style.userSelect = 'none'; }

  // keep inside viewport on resize
  useEffect(()=>{
    const adjust = ()=> setPos(p=> { const w = window.innerWidth; const h = window.innerHeight; const nx = Math.max(8, Math.min(p.x, w - 720 - 8)); const ny = Math.max(8, Math.min(p.y, h - 420 - 8)); return { x: nx, y: ny }; } );
    window.addEventListener('resize', adjust);
    return ()=> window.removeEventListener('resize', adjust);
  },[]);

  return (
    <div style={{ position:'fixed', left: pos.x, top: pos.y, width:720, maxHeight:420, zIndex:910 }}>
      <div ref={ref} style={{ background:'linear-gradient(180deg,#fff,#f2f2f2)', borderRadius:8, boxShadow:'0 12px 40px rgba(0,0,0,0.5)', overflow:'hidden' }}>
        <div style={{ height:32, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 8px', background:'#e8e8e8', cursor:'grab' }} onMouseDown={headerDown}>
          <div style={{ fontWeight:600 }}>Calendar</div>
          <div>
            <button onClick={onClose} style={{ border:'none', background:'transparent', fontSize:16, cursor:'pointer' }} aria-label="Close calendar">✕</button>
          </div>
        </div>
        <div style={{ padding:8, background:'#fff', maxHeight:380, overflow:'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------- MAIN APP ---------- */
export default function App(){
  injectCSS();

  const { wins, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindow, z } = useWindowManager();
  const [startOpen, setStartOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [wallpaper, setWallpaper] = useState(DEFAULT_WALLPAPER);
  const [context, setContext] = useState(null);
  const [shutdownOpen, setShutdownOpen] = useState(false);
  const shutdownRef = useRef();

  // clock
  useEffect(()=>{ const t = setInterval(()=> setTimeStr(new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })), 1000); setTimeStr(new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })); return ()=> clearInterval(t); }, []);

  // keyboard shortcuts
  useEffect(()=>{ function onKey(e){ if (e.key==='Escape') setStartOpen(false); if (e.key.toLowerCase()==='d' && (e.ctrlKey || e.metaKey)) wins.forEach(w=> minimizeWindow(w.id)); } window.addEventListener('keydown', onKey); return ()=> window.removeEventListener('keydown', onKey); }, [wins]);

  // initial welcome
  useEffect(()=>{ if (wins.length===0) openWindow({ name:'Welcome', content: ()=> (<div style={{ padding:12 }}><h2>Welcome</h2><div className="small-muted">Double-click My Computer to open Explorer</div></div>) }); }, []);

  function openAppByName(name){ let content; switch(name){ case 'Explorer': content = ()=> <ExplorerApp />; break; case 'Notepad': content = ()=> <NotepadApp />; break; case 'Browser': content = ()=> <BrowserApp />; break; case 'Calculator': content = ()=> <CalculatorApp />; break; case 'System Info': content = ()=> <SystemInfoApp />; break; default: content = ()=> <div style={{ padding:12 }}><h3>{name}</h3><p>Demo</p></div>; } openWindow({ name, content }); setStartOpen(false); }

  function onContext(e, type='desktop'){ e.preventDefault(); setContext({ x: e.clientX, y: e.clientY, type }); }
  function closeContext(){ setContext(null); }

  function onWallpaperUpload(e){ const f = e.target.files && e.target.files[0]; if(!f) return; setWallpaper(URL.createObjectURL(f)); }

  const desktopIcons = [ { id:'mycomp', title:'My Computer', icon:'🗂️', app:'Explorer' }, { id:'recycle', title:'Recycle Bin', icon:'🗑️', app:'Explorer' } ];

  // Start menu actions
  function handleRestart(){ alert('Restart (demo)'); }
  function handleShutdown(){ alert('Shutdown (demo)'); }
  function handleLogoff(){ alert('Log off (demo)'); }
  function handleSleep(){ alert('Sleep (demo)'); }
  function handleReset(){ if (confirm('Reset desktop (close all windows)?')) wins.forEach(w=> closeWindow(w.id)); }

  // close shutdown dropdown if clicked outside
  useEffect(()=> {
    function onDocClick(e){
      if (shutdownRef.current && !shutdownRef.current.contains(e.target)) setShutdownOpen(false);
    }
    window.addEventListener('mousedown', onDocClick);
    return ()=> window.removeEventListener('mousedown', onDocClick);
  },[]);

  // render
  return (
    <div className="win7-viewport" onContextMenu={(e)=> onContext(e,'desktop')}>
      <div className="wallpaper" style={{ backgroundImage: wallpaper ? `url('${wallpaper}')` : undefined, background: wallpaper ? undefined : 'linear-gradient(135deg,#07293a,#04202a)' }} />

      <div className="desktop-icons">
        {desktopIcons.map(ic => (
          <div key={ic.id} className="icon" onDoubleClick={()=> openAppByName(ic.app)} title={ic.title}>
            <div className="thumb">{ic.icon}</div>
            <div style={{ marginTop:8, color:'#fff', width:72, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ic.title}</div>
          </div>
        ))}
      </div>

      {/* windows */}
      {wins.map(w => (<Win key={w.id} win={w} ref={null} focused={z[z.length-1]===w.id} onFocus={(id)=> focusWindow(id)} onClose={(id)=> closeWindow(id)} onMinimize={(id)=> minimizeWindow(id)} onMaximize={(id)=> maximizeWindow(id)} onUpdate={(id,patch)=> updateWindow(id,patch)} />))}

      {/* Start overlay + menu */}
      {startOpen && (
        <div className="start-overlay" onClick={()=> { setStartOpen(false); setShutdownOpen(false); }}>
          <div className="start-menu" onClick={e=> e.stopPropagation()} role="dialog" aria-label="Start menu">
            <div className="start-left">
              <div style={{fontWeight:700}}>All Programs</div>
              <div className="programs">
                {['Internet Explorer','Notepad','Calculator','Paint','Control Panel','Command Prompt'].map(n=> <div key={n} onClick={()=> openAppByName(n)}>{n}</div>)}
              </div>

              <div className="recent-list" aria-label="Recently used">
                <div style={{ marginTop: 10, fontWeight:600 }}>Recently opened</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:6 }}>
                  <div style={{ padding:8, borderRadius:6, background:'#f4f6fb' }}>Welcome</div>
                  <div style={{ padding:8, borderRadius:6, background:'#f4f6fb' }}>Documents</div>
                </div>
              </div>

              <div className="start-search" style={{ marginTop:12 }}>
                <input placeholder="Search programs and files" aria-label="Search" />
              </div>
            </div>

            <div className="start-right">
              <div className="user">
                <div style={{ width:44, height:44, borderRadius:6, background:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center' }}>👤</div>
                <div>
                  <div style={{ fontWeight:700 }}>User</div>
                  <div style={{ fontSize:12, color:'#bbb' }}>Local Account</div>
                </div>
              </div>

              <ul>
                <li style={{ marginBottom:6 }}><button style={{ background:'transparent', border:'none', color:'#eee', cursor:'pointer' }} onClick={()=> openAppByName('Documents')}>Documents</button></li>
                <li style={{ marginBottom:6 }}><button style={{ background:'transparent', border:'none', color:'#eee', cursor:'pointer' }} onClick={()=> openAppByName('Pictures')}>Pictures</button></li>
                <li style={{ marginBottom:6 }}><button style={{ background:'transparent', border:'none', color:'#eee', cursor:'pointer' }} onClick={()=> openAppByName('Music')}>Music</button></li>
                <li style={{ marginBottom:6 }}><button style={{ background:'transparent', border:'none', color:'#eee', cursor:'pointer' }} onClick={()=> openAppByName('Control Panel')}>Control Panel</button></li>
                <li style={{ marginBottom:6 }}><button style={{ background:'transparent', border:'none', color:'#eee', cursor:'pointer' }} onClick={()=> openAppByName('Devices & Printers')}>Devices & Printers</button></li>
              </ul>

              {/* footer */}
              <div className="start-footer">
                <div className="left">Signed in as <strong>User</strong></div>
                <div className="right" ref={shutdownRef}>
                  <div style={{ position:'relative' }}>
                    <button className="shutdown-btn" onClick={(e)=> { e.stopPropagation(); setShutdownOpen(s => !s); }} aria-haspopup="true" aria-expanded={shutdownOpen}>Shutdown ▾</button>
                    {shutdownOpen && (
                      <div className="shutdown-menu" role="menu">
                        <button onClick={() => { handleShutdown(); setShutdownOpen(false); }}>Shutdown</button>
                        <button onClick={() => { handleRestart(); setShutdownOpen(false); }}>Restart</button>
                        <button onClick={() => { handleLogoff(); setShutdownOpen(false); }}>Log off</button>
                        <button onClick={() => { handleSleep(); setShutdownOpen(false); }}>Sleep</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="taskbar">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div className="start-orb" onClick={(e)=> { e.stopPropagation(); setStartOpen(s => !s); setShutdownOpen(false); }} title="Start" role="button" aria-label="Start">
            <img src={START_ORB} alt="Start" />
          </div>

          <div className="taskbar-buttons">
            {wins.map(w=> (
              <div key={w.id} className={`taskbar-button ${z[z.length-1]===w.id? 'active':''}`} onClick={()=> { if (w.state==='minimized'){ updateWindow(w.id,{state:'normal'}); focusWindow(w.id); } else minimizeWindow(w.id); }}>
                <div style={{ width:28, height:28, background:'rgba(255,255,255,0.04)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>{w.name[0]}</div>
                <div style={{ fontSize:13, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{w.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="taskbar-right">
          <input id="wallpaper-file" type="file" accept="image/*" onChange={onWallpaperUpload} style={{ display:'none' }} />
          <label htmlFor="wallpaper-file" style={{ cursor:'pointer', color:'#fff', opacity:0.95 }}>Change Wallpaper</label>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div title="Battery">🔋</div>
            <div title="Volume">🔊</div>
            <div title="Network">📶</div>
          </div>

          <div style={{ cursor:'pointer', padding:'6px 10px', borderRadius:6 }} onClick={()=> setCalendarOpen(c=> !c)}>
            <div style={{ textAlign:'right' }}>{timeStr}</div>
            <div style={{ fontSize:11 }}>{new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Calendar popup */}
      {calendarOpen && (
        <DraggableCalendar onClose={()=> setCalendarOpen(false)}>
          <div style={{ padding:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700 }}>{new Date().getFullYear()}</div>
              <button onClick={()=> setCalendarOpen(false)} style={{ border:'none', background:'transparent', fontSize:18, cursor:'pointer' }} aria-label="Close calendar">✕</button>
            </div>
            <div style={{ marginTop:8 }}>{ renderYearCalendar(new Date().getFullYear()) }</div>
          </div>
        </DraggableCalendar>
      )}

      {/* Context menu */}
      {context && (
        <div className="context-menu" style={{ left: context.x, top: context.y, zIndex:999 }}>
          {context.type === 'desktop' ? (
            <div>
              <div style={{ padding:10, minWidth:180, cursor:'pointer' }} onClick={()=>{ document.getElementById('wallpaper-file').click(); closeContext(); }}>Change desktop background</div>
              <div style={{ padding:10, cursor:'pointer' }} onClick={()=>{ wins.forEach(w=> minimizeWindow(w.id)); closeContext(); }}>Show desktop</div>
            </div>
          ) : <div style={{ padding:10 }}>No actions</div>}
        </div>
      )}
    </div>
  );
}
