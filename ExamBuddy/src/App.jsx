import React, { useState, useEffect, useRef } from "react";

// Windows 7 style web desktop (React single-file component)
// Uses the uploaded local image as wallpaper. Path provided (will be transformed to URL by environment):
const WALLPAPER_URL = "/wallpaper.jpg";

function DraggableWindow({ id, title, children, zIndex, onFocus, focused }) {
  const ref = useRef();
  const pos = useRef({ x: 120 + Math.random() * 200, y: 80 + Math.random() * 120 });
  const [state, setState] = useState({ x: pos.current.x, y: pos.current.y, isDragging: false, relX: 0, relY: 0 });

  useEffect(() => {
    function onMouseMove(e) {
      if (!state.isDragging) return;
      setState(s => ({ ...s, x: e.clientX - s.relX, y: e.clientY - s.relY }));
    }
    function onUp() {
      if (state.isDragging) setState(s => ({ ...s, isDragging: false }));
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [state.isDragging, state.relX, state.relY]);

  function onHeaderDown(e) {
    const rect = ref.current.getBoundingClientRect();
    onFocus(id);
    setState(s => ({ ...s, isDragging: true, relX: e.clientX - s.x, relY: e.clientY - s.y }));
    e.preventDefault();
  }

  return (
    <div
      ref={ref}
      onMouseDown={() => onFocus(id)}
      style={{
        position: "fixed",
        left: state.x,
        top: state.y,
        width: 520,
        minHeight: 300,
        background: "rgba(255,255,255,0.95)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
        borderRadius: 6,
        overflow: "hidden",
        zIndex: focused ? 900 + zIndex : 100 + zIndex,
        userSelect: state.isDragging ? "none" : "auto",
      }}
    >
      <div
        onMouseDown={onHeaderDown}
        style={{
          height: 36,
          background: "linear-gradient(#dfe7f6,#bcd0f0)",
          padding: "6px 10px",
          display: "flex",
          alignItems: "center",
          cursor: "grab",
          borderBottom: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <strong style={{ fontSize: 13 }}>{title}</strong>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={(e) => { e.stopPropagation(); }} style={{ width: 20, height: 20, borderRadius: 3 }}>—</button>
          <button onClick={(e) => { e.stopPropagation(); }} style={{ width: 20, height: 20, borderRadius: 3 }}>□</button>
          <button onClick={(e) => { e.stopPropagation(); }} style={{ width: 20, height: 20, borderRadius: 3 }}>✕</button>
        </div>
      </div>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  );
}

export default function Win7Desktop() {
  const [startOpen, setStartOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeStr, setTimeStr] = useState("");
  const [windows, setWindows] = useState([]);
  const [zOrder, setZOrder] = useState([]);
  const nextId = useRef(1);

  useEffect(() => {
    const t = setInterval(() => setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 1000);
    setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    return () => clearInterval(t);
  }, []);

  function openApp(name) {
    const id = nextId.current++;
    setWindows(w => [...w, { id, name }]);
    setZOrder(z => [...z, id]);
    setStartOpen(false);
  }

  function focusWindow(id) {
    setZOrder(z => [...z.filter(x => x !== id), id]);
  }

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: 'Segoe UI, Tahoma, sans-serif' }}>
      {/* Wallpaper */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url('${WALLPAPER_URL}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(1)'
      }} />

      {/* Desktop icons area (placeholder) */}
      <div style={{ position: 'absolute', top: 20, left: 20, color: 'white' }}>
        <div style={{ marginBottom: 12, cursor: 'pointer' }} onDoubleClick={() => openApp('My Computer')}>
          <div style={{ width: 60, height: 60, borderRadius: 6, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗂️</div>
          <div style={{ marginTop: 6 }}>My Computer</div>
        </div>
      </div>

      {/* Open windows */}
      {windows.map((w, idx) => (
        <DraggableWindow
          key={w.id}
          id={w.id}
          title={w.name}
          zIndex={idx}
          onFocus={focusWindow}
          focused={zOrder[zOrder.length - 1] === w.id}
        >
          <div>
            <p>{w.name} app content goes here. This is a demo window — drag its header to move it.</p>
          </div>
        </DraggableWindow>
      ))}

      {/* Start Menu */}
      <div
        style={{
          position: 'fixed',
          bottom: 54,
          left: 12,
          width: 340,
          height: 480,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(240,240,240,0.98))',
          borderRadius: 8,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          display: startOpen ? 'block' : 'none',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ width: '58%', padding: 14, borderRight: '1px solid rgba(0,0,0,0.06)' }}>
            <input placeholder="Search programs and files" style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['Internet Explorer', 'Notepad', 'Calculator', 'Paint', 'Control Panel', 'Command Prompt'].map(name => (
                <div key={name} onClick={() => openApp(name)} style={{ padding: 8, background: '#f2f4fb', borderRadius: 4, cursor: 'pointer' }}>{name}</div>
              ))}
            </div>
          </div>
          <div style={{ width: '42%', padding: 14 }}>
            <h4>Libraries</h4>
            <ul style={{ paddingLeft: 18 }}>
              <li>Documents</li>
              <li>Pictures</li>
              <li>Music</li>
            </ul>

            <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <button onClick={() => { /* pretend search */ }} style={{ padding: '8px 12px', borderRadius: 4 }}>All Programs</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => alert('Restart (demo)')} style={{ padding: '8px 12px', borderRadius: 4 }}>Restart</button>
                <button onClick={() => alert('Shut Down (demo)')} style={{ padding: '8px 12px', borderRadius: 4 }}>Shut Down</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Taskbar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(180deg, rgba(60,60,60,0.95), rgba(30,30,30,0.95))', display: 'flex', alignItems: 'center', padding: '4px 10px', boxShadow: '0 -2px 12px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            onClick={() => setStartOpen(s => !s)}
            style={{ width: 40, height: 40, borderRadius: 6, background: 'linear-gradient(180deg,#2f6ab8,#1b4f9a)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.2)' }}
            title="Start"
          >
            {/* Start orb simplified */}
            <div style={{ width: 22, height: 22, background: 'radial-gradient(circle at 30% 30%, #fff, #f0f0f0 10%, transparent 40%), linear-gradient(#ffde00,#ff7a00)', borderRadius: '50%' }} />
          </div>

          {/* Quick launch / open apps list (icons) */}
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.08)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => openApp('Explorer')}>📁</div>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.08)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => openApp('Browser')}>🌐</div>
          </div>
        </div>

        {/* Taskbar right - system tray */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div title="Battery">🔋</div>
            <div title="Volume">🔊</div>
            <div title="Network">📶</div>
          </div>

          <div style={{ cursor: 'pointer', padding: '6px 10px', borderRadius: 4 }} onClick={() => setCalendarOpen(c => !c)}>
            <div style={{ textAlign: 'right' }}>{timeStr}</div>
            <div style={{ fontSize: 11 }}>{new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Calendar popup */}
      <div style={{ position: 'fixed', right: 12, bottom: 60, width: 260, background: 'white', borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', padding: 12, display: calendarOpen ? 'block' : 'none' }}>
        <div style={{ fontWeight: '600', marginBottom: 8 }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {['S','M','T','W','T','F','S'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontWeight: '600' }}>{d}</div>
          ))}
          {Array.from({ length: 30 }).map((_,i) => (
            <div key={i} style={{ height: 28, textAlign: 'center', paddingTop: 4 }}>{i+1}</div>
          ))}
        </div>
      </div>

    </div>
  );
}
