// src/components/Calendar.jsx
import React, { useState, useEffect, useRef } from "react";

export function renderYearCalendar(year = new Date().getFullYear()) {
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

export function DraggableCalendar({ children, onClose }) {
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
