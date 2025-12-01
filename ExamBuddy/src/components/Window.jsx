import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

export const Win = forwardRef(function Win({ win, focused, onFocus, onClose, onMinimize, onMaximize, onUpdate, openWindow }, ref) {
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
      }
      // ... (Resizing logic omitted for brevity, copy from original if needed)
    }
    function onUp() { dragging.current = false; resizing.current = null; document.body.style.userSelect = ""; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [win, onUpdate]);

  function headerDown(e) {
    e.stopPropagation();
    onFocus(win.id);
    if (win.state === "maximized") return;
    dragging.current = true;
    rel.current = { x: e.clientX - (win.x || 0), y: e.clientY - (win.y || 0) };
    document.body.style.userSelect = "none";
  }

  const styles = {
    left: win.x, top: win.y, width: win.w, height: win.h,
    zIndex: focused ? 1000 : 200 + (win.id % 20),
    display: win.state === "minimized" ? "none" : "flex",
  };

  if (win.state === "maximized") {
    styles.left = 0; styles.top = 0; 
    styles.width = "100vw"; styles.height = "calc(100vh - 48px)";
  }

  // Render content, passing the openWindow function so apps can open other apps
  const renderedContent = typeof win.content === "function" 
    ? win.content({ id: win.id, openWindow }) 
    : win.content;

  return (
    <div ref={nodeRef} className="window" style={styles} onMouseDown={() => onFocus(win.id)}>
      <div className="window-header" onMouseDown={headerDown}>
        <div style={{ fontWeight: 600 }}>{win.name}</div>
        <div className="window-buttons">
          <button onClick={(e) => { e.stopPropagation(); onMinimize(win.id); }}>—</button>
          <button onClick={(e) => { e.stopPropagation(); onMaximize(win.id); }}>□</button>
          <button onClick={(e) => { e.stopPropagation(); onClose(win.id); }}>✕</button>
        </div>
      </div>
      <div className="window-content">{renderedContent}</div>
    </div>
  );
});
