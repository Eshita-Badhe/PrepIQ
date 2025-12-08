import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

const DEFAULT_W = 720;
const DEFAULT_H = 480;
const MIN_W = 420;
const MIN_H = 260;

export const Win = forwardRef(function Win(
  {
    win,
    focused,
    onFocus,
    onClose,
    onMinimize,
    onMaximize,
    onUpdate,
    openWindow,
  },
  ref
) {
  const nodeRef = useRef();
  const dragging = useRef(false);
  const resizing = useRef(null); // "br" etc.
  const rel = useRef({ x: 0, y: 0 });
  const sizeRel = useRef({ w: DEFAULT_W, h: DEFAULT_H, x: 0, y: 0 });

  useImperativeHandle(ref, () => ({ node: nodeRef.current }));

  // Center window on first mount if x/y are not set
  useEffect(() => {
    if (win.x == null || win.y == null) {
      const w = win.w || DEFAULT_W;
      const h = win.h || DEFAULT_H;
      const x = 100;
      const y = 100;
      onUpdate(win.id, { x, y, w, h });
    }
  }, [win.id, win.x, win.y, win.w, win.h, onUpdate]);

  useEffect(() => {
    function onMove(e) {
      if (dragging.current) {
        const nx = e.clientX - rel.current.x;
        const ny = e.clientY - rel.current.y;
        onUpdate(win.id, { x: nx, y: ny });
      } else if (resizing.current) {
        const dx = e.clientX - sizeRel.current.x;
        const dy = e.clientY - sizeRel.current.y;

        let newW = sizeRel.current.w;
        let newH = sizeRel.current.h;

        if (resizing.current === "br") {
          newW = Math.max(MIN_W, sizeRel.current.w + dx);
          newH = Math.max(MIN_H, sizeRel.current.h + dy);
        }

        onUpdate(win.id, { w: newW, h: newH });
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
  }, [win.id, onUpdate]);

  function headerDown(e) {
    e.stopPropagation();
    onFocus(win.id);
    if (win.state === "maximized") return;
    dragging.current = true;
    rel.current = {
      x: e.clientX - (win.x || 0),
      y: e.clientY - (win.y || 0),
    };
    document.body.style.userSelect = "none";
  }

  function resizeDown(e, direction) {
    e.stopPropagation();
    onFocus(win.id);
    if (win.state === "maximized") return;
    resizing.current = direction;
    sizeRel.current = {
      w: win.w || DEFAULT_W,
      h: win.h || DEFAULT_H,
      x: e.clientX,
      y: e.clientY,
    };
    document.body.style.userSelect = "none";
  }

  const styles = {
    position: "absolute",
    left: win.x ?? 0,
    top: win.y ?? 0,
    width: win.w || DEFAULT_W,
    height: win.h || DEFAULT_H,
    zIndex: focused ? 1000 : 200 + (win.id % 20),
    display: win.state === "minimized" ? "none" : "flex",
    flexDirection: "column",
  };

  if (win.state === "maximized") {
    styles.left = 0;
    styles.top = 0;
    styles.width = "100vw";
    styles.height = "calc(100vh - 48px)";
  }

  const renderedContent =
    typeof win.content === "function"
      ? win.content({ id: win.id, openWindow })
      : win.content;

  return (
    <div
      ref={nodeRef}
      className="window"
      style={styles}
      onMouseDown={() => onFocus(win.id)}
    >
      <div className="window-header" onMouseDown={headerDown}>
        <div style={{ fontWeight: 600 }}>{win.name}</div>
        <div className="window-buttons">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize(win.id);
            }}
          >
            —
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMaximize(win.id);
            }}
          >
            □
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(win.id);
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="window-content">{renderedContent}</div>

      {/* bottom-right resize handle */}
      {win.state !== "maximized" && (
        <div
          className="window-resize-br"
          onMouseDown={(e) => resizeDown(e, "br")}
        />
      )}
    </div>
  );
});
