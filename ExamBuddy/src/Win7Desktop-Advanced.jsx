import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

// Win7Desktop-Advanced.jsx
// Single-file modularized React component that recreates an advanced Windows 7 style desktop.
// Usage: drop this file into a React app (Vite / CRA). Import default export and render in App.
// Notes: This file uses inline styles and basic CSS variables so it works without Tailwind.

// -------------------------
// Small utility helpers
// -------------------------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const uid = (p = '') => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}${p}`;

// -------------------------
// Basic styles injected once
// -------------------------
const globalStyles = `
:root{
  --taskbar-height:48px;
  --accent:#2f6ab8;
  --glass-bg: rgba(255,255,255,0.12);
}
.win7-viewport{font-family: 'Segoe UI', Tahoma, sans-serif; height:100vh; width:100vw; overflow:hidden; position:relative; background:#0a2240;}
.wallpaper{position:absolute; inset:0; background-size:cover; background-position:center; filter:brightness(1);}
.desktop-icons{position:absolute; top:40px; left:20px; color:white}
.icon{width:64px; text-align:center; cursor:pointer; user-select:none}
.icon .icon-thumb{width:64px;height:64;border-radius:6px; background:rgba(255,255,255,0.08); display:flex;align-items:center;justify-content:center;font-size:28px}
.taskbar{position:fixed; left:0; right:0; bottom:0; height:var(--taskbar-height); display:flex; align-items:center; padding:6px 10px; box-shadow:0 -4px 18px rgba(0,0,0,0.6); background: linear-gradient(180deg, rgba(40,40,40,0.95), rgba(18,18,18,0.98));}
.start-orb{width:40px;height:40px;border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer}
.taskbar-buttons{display:flex; gap:6px; margin-left:8px}
.taskbar-button{min-width:110px; height:36px; display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:6px; background:rgba(255,255,255,0.03); color:#fff; cursor:pointer}
.taskbar-right{margin-left:auto; display:flex; gap:10px; align-items:center; color:#fff}
.start-menu{position:fixed; bottom:54px; left:12px; width:360px; height:480px; border-radius:8px; box-shadow:0 18px 60px rgba(0,0,0,0.6); overflow:hidden; display:flex; background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(240,240,240,0.98));}
.window{position:fixed; width:520px; min-height:240px; background:rgba(255,255,255,0.96); box-shadow: 0 12px 40px rgba(0,0,0,0.5); border-radius:6px; overflow:hidden}
.window-header{height:36px; display:flex; align-items:center; padding:6px 10px; cursor:grab; background:linear-gradient(#dfe7f6,#bcd0f0); border-bottom:1px solid rgba(0,0,0,0.08)}
.window-buttons{margin-left:auto; display:flex; gap:6px}
.window-content{padding:12px}
.aero-glass{backdrop-filter: blur(8px); background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03)); border-radius:8px; padding:8px}
.context-menu{position:fixed; background:white; box-shadow:0 6px 20px rgba(0,0,0,0.35); border-radius:6px; overflow:hidden;}
`;

function injectStyles(){
  if (document.getElementById('win7-advanced-styles')) return;
  const s = document.createElement('style');
  s.id = 'win7-advanced-styles';
  s.innerHTML = globalStyles;
  document.head.appendChild(s);
}

// -------------------------
// Window manager hook
// -------------------------
function useWindowsManager() {
  const [windows, setWindows] = useState([]); // {id,name,state:'normal'|'minimized'|'maximized', x,y,w,h,content}
  const [zOrder, setZOrder] = useState([]);
  const nextId = useRef(1);

  function openWindow({name, content, w=520, h=320, centered=true}){
    const id = nextId.current++;
    const x = centered ? Math.max(40, (window.innerWidth - w)/2 + (Math.random()-0.5)*30) : 120 + Math.random()*200;
    const y = centered ? Math.max(40, (window.innerHeight - h)/2 + (Math.random()-0.5)*40) : 80 + Math.random()*120;
    const win = { id, name, state: 'normal', x, y, w, h, content };
    setWindows(ws => [...ws, win]);
    setZOrder(z => [...z, id]);
    return id;
  }

  function closeWindow(id){
    setWindows(ws => ws.filter(w => w.id !== id));
    setZOrder(z => z.filter(x => x !== id));
  }
  function minimizeWindow(id){
    setWindows(ws => ws.map(w => w.id===id?{...w,state:'minimized'}:w));
    setZOrder(z => z.filter(x => x !== id));
  }
  function maximizeWindow(id){
    setWindows(ws => ws.map(w => w.id===id?{...w,state:w.state==='maximized'?'normal':'maximized'}:w));
    setZOrder(z => [...z.filter(x=>x!==id), id]);
  }
  function focusWindow(id){
    setZOrder(z => [...z.filter(x => x !== id), id]);
  }
  function updateWindow(id, patch){
    setWindows(ws => ws.map(w => w.id===id?{...w,...patch}:w));
  }

  return { windows, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindow, zOrder };
}

// -------------------------
// Resizable + draggable window component
// -------------------------
const Win = forwardRef(function Win({win, focused, onFocus, onClose, onMinimize, onMaximize, onUpdate}, ref){
  const containerRef = useRef();
  const dragging = useRef(false);
  const resizing = useRef(null);
  const rel = useRef({x:0,y:0});

  useImperativeHandle(ref, ()=>({getNode: ()=>containerRef.current}));

  useEffect(()=>{
    function onMove(e){
      if (dragging.current){
        const nx = e.clientX - rel.current.x;
        const ny = e.clientY - rel.current.y;
        onUpdate(win.id, { x: nx, y: ny });
      } else if (resizing.current){
        const dir = resizing.current;
        const node = containerRef.current;
        if(!node) return;
        let {x,y,w,h} = { x: node.offsetLeft, y: node.offsetTop, w: node.offsetWidth, h: node.offsetHeight };
        const minW = 220, minH = 140;
        if (dir.includes('r')) w = Math.max(minW, e.clientX - x);
        if (dir.includes('b')) h = Math.max(minH, e.clientY - y);
        if (dir.includes('l')){ const nx = Math.min(e.clientX, x + w - minW); w = w + (x - nx); x = nx; }
        if (dir.includes('t')){ const ny = Math.min(e.clientY, y + h - minH); h = h + (y - ny); y = ny; }
        onUpdate(win.id, { x, y, w, h });
      }
    }
    function onUp(){ dragging.current = false; resizing.current = null; document.body.style.userSelect = ''; }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return ()=>{ window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); }
  }, [win, onUpdate]);

  function headerDown(e){
    e.stopPropagation();
    onFocus(win.id);
    if (win.state==='maximized') return; // don't allow drag when maximized
    dragging.current = true;
    rel.current = { x: e.clientX - (win.x||0), y: e.clientY - (win.y||0) };
    document.body.style.userSelect = 'none';
  }
  function startResize(dir, e){
    e.stopPropagation();
    onFocus(win.id);
    resizing.current = dir;
    document.body.style.userSelect = 'none';
  }

  const styles = {
    left: win.x,
    top: win.y,
    width: win.w,
    height: win.h,
    zIndex: focused ? 1000 : 200 + (win.id % 20),
    display: win.state === 'minimized' ? 'none' : 'block'
  };
  if (win.state === 'maximized'){
    styles.left = 8; styles.top = 8; styles.width = window.innerWidth - 16; styles.height = window.innerHeight - parseInt(getComputedStyle(document.documentElement).getPropertyValue('--taskbar-height')||48) - 16;
  }

  return (
    <div ref={containerRef} className="window" style={styles} onMouseDown={() => onFocus(win.id)}>
      <div className="window-header" onMouseDown={headerDown}>
        <div style={{fontWeight:600}}>{win.name}</div>
        <div className="window-buttons">
          <button title="Minimize" onClick={(e)=>{e.stopPropagation(); onMinimize(win.id);}}>—</button>
          <button title="Maximize" onClick={(e)=>{e.stopPropagation(); onMaximize(win.id);}}>□</button>
          <button title="Close" onClick={(e)=>{e.stopPropagation(); onClose(win.id);}}>✕</button>
        </div>
      </div>
      <div className="window-content" style={{height:'calc(100% - 36px)', overflow:'auto'}}>
        {typeof win.content === 'function' ? win.content({ id: win.id }) : win.content}
      </div>

      {/* Resize handles */}
      <div onMouseDown={(e)=>startResize('r',e)} style={{position:'absolute', right:0, top:8, width:8, height:'calc(100% - 16px)', cursor:'e-resize'}} />
      <div onMouseDown={(e)=>startResize('b',e)} style={{position:'absolute', bottom:0, left:8, height:8, width:'calc(100% - 16px)', cursor:'s-resize'}} />
      <div onMouseDown={(e)=>startResize('rb',e)} style={{position:'absolute', right:0, bottom:0, width:12, height:12, cursor:'nwse-resize'}} />
      <div onMouseDown={(e)=>startResize('l',e)} style={{position:'absolute', left:0, top:8, width:8, height:'calc(100% - 16px)', cursor:'w-resize'}} />
      <div onMouseDown={(e)=>startResize('t',e)} style={{position:'absolute', left:8, top:0, width:'calc(100% - 16px)', height:8, cursor:'n-resize'}} />
    </div>
  );
});

// -------------------------
// StartMenu component
// -------------------------
function StartMenu({visible, onOpenApp}){
  if(!visible) return null;
  return (
    <div className="start-menu">
      <div style={{display:'flex', height:'100%'}}>
        <div style={{width:'58%', padding:14, borderRight:'1px solid rgba(0,0,0,0.06)'}}>
          <input placeholder="Search programs and files" style={{width:'100%', padding:8, borderRadius:4, border:'1px solid #ccc'}} />
          <div style={{marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            {['Internet Explorer','Notepad','Calculator','Paint','Control Panel','Command Prompt'].map(n => (
              <div key={n} onClick={() => onOpenApp(n)} style={{padding:8, background:'#f2f4fb', borderRadius:4, cursor:'pointer'}}>{n}</div>
            ))}
          </div>
        </div>
        <div style={{width:'42%', padding:14, position:'relative'}}>
          <h4>Libraries</h4>
          <ul style={{paddingLeft:18}}>
            <li>Documents</li>
            <li>Pictures</li>
            <li>Music</li>
          </ul>
          <div style={{position:'absolute', bottom:14, left:14, right:14, display:'flex', justifyContent:'space-between'}}>
            <div><button style={{padding:'8px 12px', borderRadius:4}}>All Programs</button></div>
            <div style={{display:'flex', gap:8}}>
              <button onClick={()=>alert('Restart (demo)')} style={{padding:'8px 12px', borderRadius:4}}>Restart</button>
              <button onClick={()=>alert('Shutdown (demo)')} style={{padding:'8px 12px', borderRadius:4}}>Shutdown</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------
// Simple app content factories
// -------------------------
function ExplorerApp(){
  return (
    <div>
      <h3>Explorer</h3>
      <p>This is a small file explorer demo.</p>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8}}>
        {['Documents','Pictures','Music','Videos','Downloads'].map(k=> (
          <div key={k} className="aero-glass" style={{padding:10}}>
            <strong>{k}</strong>
            <div style={{fontSize:12, opacity:0.9}}>Folder</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function NotepadApp(){
  const [text,setText] = useState('');
  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Type here..." style={{flex:1, width:'100%', padding:8, borderRadius:4}} />
      <div style={{marginTop:8}}><button onClick={()=>alert('Saved (demo)')}>Save</button></div>
    </div>
  );
}
function BrowserApp(){
  return (
    <div>
      <h3>Browser (Demo)</h3>
      <p>Type a URL or pick a favorite.</p>
    </div>
  );
}
function SystemInfoApp(){
  return (
    <div>
      <h3>System Information</h3>
      <ul>
        <li>OS: Windows 7 style (demo)</li>
        <li>Memory: simulated</li>
      </ul>
    </div>
  );
}

// -------------------------
// Main exported component
// -------------------------
export default function Win7DesktopAdvanced(){
  injectStyles();
  const { windows, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindow, zOrder } = useWindowsManager();
  const [startOpen, setStartOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [wallpaper, setWallpaper] = useState('/wallpaper.jpg');
  const [context, setContext] = useState(null); // {x,y,type}

  useEffect(()=>{
    const t = setInterval(()=> setTimeStr(new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})), 1000);
    setTimeStr(new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));
    return ()=>clearInterval(t);
  },[]);

  // keyboard shortcuts
  useEffect(()=>{
    function onKey(e){
      if (e.key === 'Escape') setStartOpen(false);
      if (e.key.toLowerCase() === 'd' && (e.metaKey || e.ctrlKey)){
        // Ctrl/Cmd+D toggle show desktop (minimize all)
        windows.forEach(w=> minimizeWindow(w.id));
      }
    }
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  }, [windows]);

  function openAppByName(name){
    let content;
    switch(name){
      case 'Explorer': content = () => <ExplorerApp />; break;
      case 'Notepad': content = () => <NotepadApp />; break;
      case 'Browser': content = () => <BrowserApp />; break;
      case 'System Info': content = () => <SystemInfoApp />; break;
      default: content = () => <div><h3>{name}</h3><p>Demo application window.</p></div>;
    }
    openWindow({ name, content });
    setStartOpen(false);
  }

  function onTaskbarClick(id){
    const w = windows.find(x=>x.id===id);
    if(!w) return;
    if(w.state === 'minimized'){
      updateWindow(id, { state: 'normal' });
      focusWindow(id);
    } else {
      // toggle minimize
      minimizeWindow(id);
    }
  }

  function onDesktopIconDoubleClick(name){
    openAppByName(name);
  }

  function onContext(e, type='desktop'){
    e.preventDefault();
    setContext({ x: e.clientX, y: e.clientY, type });
  }

  function closeContext(){ setContext(null); }

  // drag wallpaper (upload) - simple file input
  function onWallpaperUpload(e){
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setWallpaper(url);
  }

  return (
    <div className="win7-viewport" onContextMenu={(e)=>onContext(e,'desktop')} style={{outline:'none'}}>
      <div className="wallpaper" style={{backgroundImage:`url('${wallpaper}')`}} />

      <div className="desktop-icons">
        <div className="icon" onDoubleClick={()=>onDesktopIconDoubleClick('Explorer')} title="My Computer">
          <div className="icon-thumb">🗂️</div>
          <div style={{marginTop:8}}>My Computer</div>
        </div>
        <div style={{height:20}} />
        <div className="icon" onDoubleClick={()=>onDesktopIconDoubleClick('Recycle Bin')} title="Recycle Bin">
          <div className="icon-thumb">🗑️</div>
          <div style={{marginTop:8}}>Recycle Bin</div>
        </div>
      </div>

      {/* Windows rendering */}
      {windows.map((w)=> (
        <Win
          key={w.id}
          win={w}
          focused={zOrder[zOrder.length-1]===w.id}
          onFocus={(id)=> focusWindow(id)}
          onClose={(id)=> closeWindow(id)}
          onMinimize={(id)=> minimizeWindow(id)}
          onMaximize={(id)=> maximizeWindow(id)}
          onUpdate={(id,patch)=> updateWindow(id,patch)}
        />
      ))}

      {/* Start Menu */}
      <StartMenu visible={startOpen} onOpenApp={openAppByName} />

      {/* Taskbar */}
      <div className="taskbar">
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <div className="start-orb" onClick={()=> setStartOpen(s=>!s)} title="Start">
            <div style={{width:22,height:22, borderRadius:'50%', background:'radial-gradient(circle at 30% 30%, #fff, #f0f0f0 10%, transparent 40%), linear-gradient(var(--accent), #ff7a00)'}} />
          </div>
          <div className="taskbar-buttons">
            {windows.map(w=> (
              <div key={w.id} className="taskbar-button" onClick={()=> onTaskbarClick(w.id)} style={{opacity: w.state==='minimized'?0.8:1, border: zOrder[zOrder.length-1]===w.id ? '2px solid rgba(255,255,255,0.06)' : 'none'}}>
                <div style={{width:28, height:28, background:'rgba(255,255,255,0.06)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center'}}>{w.name[0]}</div>
                <div style={{fontSize:13, whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden', maxWidth:120}}>{w.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="taskbar-right">
          <input type="file" accept="image/*" onChange={onWallpaperUpload} title="Change wallpaper" style={{display:'none'}} id="wallpaper-file" />
          <label htmlFor="wallpaper-file" style={{cursor:'pointer', color:'#fff', opacity:0.9}}>Change Wallpaper</label>

          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <div title="Battery">🔋</div>
            <div title="Volume">🔊</div>
            <div title="Network">📶</div>
          </div>

          <div style={{cursor:'pointer', padding:'6px 10px', borderRadius:4}} onClick={()=> setCalendarOpen(c=>!c)}>
            <div style={{textAlign:'right'}}>{timeStr}</div>
            <div style={{fontSize:11}}>{new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Calendar popup */}
      <div style={{position:'fixed', right:12, bottom:60, width:260, background:'white', borderRadius:8, boxShadow:'0 12px 40px rgba(0,0,0,0.5)', padding:12, display: calendarOpen ? 'block':'none'}}>
        <div style={{fontWeight:600, marginBottom:8}}>{new Date().toLocaleDateString(undefined,{weekday:'long', month:'long', day:'numeric'})}</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6}}>
          {['S','M','T','W','T','F','S'].map(d=> <div key={d} style={{textAlign:'center', fontWeight:600}}>{d}</div>)}
          {Array.from({length:30}).map((_,i)=> <div key={i} style={{height:28, textAlign:'center', paddingTop:4}}>{i+1}</div>)}
        </div>
      </div>

      {/* Context menu */}
      {context && (
        <div className="context-menu" style={{left:context.x, top:context.y}} onMouseLeave={closeContext}>
          {context.type === 'desktop' ? (
            <div>
              <div style={{padding:10, minWidth:180, cursor:'pointer'}} onClick={()=>{ document.getElementById('wallpaper-file').click(); closeContext(); }}>Change desktop background</div>
              <div style={{padding:10, cursor:'pointer'}} onClick={()=>{ windows.forEach(w=> minimizeWindow(w.id)); closeContext(); }}>Show desktop</div>
            </div>
          ) : (
            <div style={{padding:10}}>No actions</div>
          )}
        </div>
      )}

    </div>
  );
}

// End of file
