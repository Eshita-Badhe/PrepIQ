// PlannerApp.jsx
import { useState } from "react";

const PREDEFINED_SESSIONS = [
  {
    id: 1,
    title: "Cyber Security Basics – Fundamentals",
    time: "08:00 AM – 09:30 AM",
    duration: "1 hr 30 min",
    resource: "Notes: 'Intro to Cyber Security' + NIST overview PDF",
  },
  {
    id: 2,
    title: "Mobile Devices – Threats & Hardening",
    time: "10:00 AM – 11:30 AM",
    duration: "1 hr 30 min",
    resource: "Slides: 'Mobile Security' + OWASP Mobile Top 10",
  },
  {
    id: 3,
    title: "IT Section – Network & Access Control",
    time: "12:00 PM – 01:30 PM",
    duration: "1 hr 30 min",
    resource: "Network diagrams + Firewall/ACL cheat sheet",
  },
  {
    id: 4,
    title: "Revision – MCQs & Past Papers",
    time: "03:00 PM – 04:30 PM",
    duration: "1 hr 30 min",
    resource: "Practice set: 100 MCQs (Cyber + Mobile + IT)",
  },
];

const PREDEFINED_HISTORY = [
  {
    id: "prev-1",
    title: "Network Security – Midterm Planner",
    date: "20 Nov 2025",
    completed: "3/4 sessions done",
  },
  {
    id: "prev-2",
    title: "System Security – Lab Viva Prep",
    date: "05 Oct 2025",
    completed: "5/5 sessions done",
  },
];

export default function PlannerApp() {
  const [plannerTitle, setPlannerTitle] = useState(
    "Cyber Security Exam – 1 Day Plan"
  );
  const [sessions, setSessions] = useState(
    PREDEFINED_SESSIONS.map((s) => ({
      ...s,
      status: "idle", // idle | running | paused | done
    }))
  );
  const [history] = useState(PREDEFINED_HISTORY);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  function handleStart(id) {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id && s.status !== "done" ? { ...s, status: "running" } : s
      )
    );
  }

  function handlePause(id) {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id && s.status === "running" ? { ...s, status: "paused" } : s
      )
    );
  }

  function handleDone(id) {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "done" } : s
      )
    );
  }

  function handleLoadHistory(hId) {
    setSelectedHistoryId(hId);
    const h = history.find((h) => h.id === hId);
    if (!h) return;
    // Prototype: just change title + mark all sessions done
    setPlannerTitle(h.title);
    setSessions((prev) => prev.map((s) => ({ ...s, status: "done" })));
  }

  function handleGenerateNewPlanner() {
    if (!plannerTitle.trim()) return;
    // Prototype: reset same predefined sessions with fresh state
    setSessions(
      PREDEFINED_SESSIONS.map((s) => ({
        ...s,
        status: "idle",
      }))
    );
    setSelectedHistoryId(null);
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background:
          "radial-gradient(circle at top, #e0f2ff 0, #f3f4f6 45%, #e5e7eb 100%)",
        borderRadius: "18px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#0f172a",
        boxShadow: "0 20px 40px rgba(15,23,42,0.14)",
        border: "1px solid rgba(148,163,184,0.45)",
        overflow: "hidden",
      }}
    >
      {/* Left: Planner + sessions */}
      <div
        style={{
          flex: 1,
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          background: "#f9fafb",
        }}
      >
        {/* Header / title + controls */}
        <div
          style={{
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <input
            type="text"
            value={plannerTitle}
            onChange={(e) => setPlannerTitle(e.target.value)}
            placeholder="Enter planner title..."
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: "999px",
              border: "1px solid rgba(148,163,184,0.7)",
              background: "#ffffff",
              fontSize: "0.95rem",
              outline: "none",
              boxShadow:
                "0 0 0 1px rgba(148,163,184,0.1), 0 6px 14px rgba(15,23,42,0.04)",
            }}
          />
          <button
            onClick={handleGenerateNewPlanner}
            style={{
              padding: "8px 12px",
              borderRadius: "999px",
              border: "none",
              background:
                "linear-gradient(135deg,#3b82f6,#0ea5e9)",
              color: "#f9fafb",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 6px 14px rgba(37,99,235,0.35)",
            }}
          >
            Generate
          </button>
        </div>

        <div
          style={{
            fontSize: "0.8rem",
            color: "#6b7280",
            marginBottom: "4px",
          }}
        >
          One‑day exam planner (Cyber Security – Basics, Mobile Devices, IT)
        </div>

        {/* Sessions list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {sessions.map((s) => {
            const isDone = s.status === "done";
            const isRunning = s.status === "running";
            const isPaused = s.status === "paused";

            return (
              <div
                key={s.id}
                style={{
                  position: "relative",
                  padding: "10px 12px",
                  borderRadius: "14px",
                  background: "#ffffff",
                  border: "1px solid rgba(148,163,184,0.6)",
                  boxShadow:
                    "0 8px 18px rgba(15,23,42,0.06)",
                  opacity: isDone ? 0.55 : 1,
                  filter: isDone ? "grayscale(0.3) blur(0.5px)" : "none",
                  pointerEvents: isDone ? "none" : "auto",
                  transition:
                    "opacity 0.15s ease, filter 0.15s ease, transform 0.1s ease",
                }}
              >
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    marginBottom: "4px",
                    color: "#0f172a",
                  }}
                >
                  {s.title}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.8rem",
                    marginBottom: "4px",
                    color: "#4b5563",
                  }}
                >
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: "999px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      fontWeight: 500,
                    }}
                  >
                    🕒 {s.time}
                  </span>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: "999px",
                      background: "#ecfdf3",
                      color: "#15803d",
                      fontWeight: 500,
                    }}
                  >
                    ⏳ {s.duration}
                  </span>
                  {isRunning && (
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "999px",
                        background: "#dcfce7",
                        color: "#15803d",
                        fontWeight: 500,
                      }}
                    >
                      • Running (prototype timer)
                    </span>
                  )}
                  {isPaused && (
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: "999px",
                        background: "#fef3c7",
                        color: "#92400e",
                        fontWeight: 500,
                      }}
                    >
                      • Paused
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    marginBottom: "8px",
                  }}
                >
                  📚 Resource: {s.resource}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.8rem",
                  }}
                >
                  <button
                    onClick={() => handleStart(s.id)}
                    style={{
                      padding: "5px 9px",
                      borderRadius: "999px",
                      border: "none",
                      background: "#dbeafe",
                      color: "#1d4ed8",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ▶ Start
                  </button>
                  <button
                    onClick={() => handlePause(s.id)}
                    style={{
                      padding: "5px 9px",
                      borderRadius: "999px",
                      border: "none",
                      background: "#e5e7eb",
                      color: "#374151",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ⏸ Pause
                  </button>
                  <button
                    onClick={() => handleDone(s.id)}
                    style={{
                      padding: "5px 9px",
                      borderRadius: "999px",
                      border: "none",
                      background: "#22c55e",
                      color: "#f9fafb",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ✅ Done
                  </button>
                  <button
                    onClick={() =>
                      alert("Prototype edit: you can wire this to open an edit form")
                    }
                    style={{
                      marginLeft: "auto",
                      padding: "4px 8px",
                      borderRadius: "999px",
                      border: "none",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      fontWeight: 500,
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                  >
                    ✏ Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: history side panel */}
      <div
        style={{
          width: "260px",
          borderLeft: "1px solid rgba(148,163,184,0.45)",
          background: "#ffffff",
          padding: "14px 12px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div
          style={{
            fontSize: "0.8rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#6b7280",
          }}
        >
          History
        </div>

        <div
          style={{
            fontSize: "0.8rem",
            color: "#6b7280",
            marginBottom: "2px",
          }}
        >
          Load a previous planner snapshot (prototype).
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {history.map((h) => (
            <button
              key={h.id}
              onClick={() => handleLoadHistory(h.id)}
              style={{
                textAlign: "left",
                padding: "8px 9px",
                borderRadius: "12px",
                border:
                  selectedHistoryId === h.id
                    ? "1px solid #3b82f6"
                    : "1px solid rgba(148,163,184,0.5)",
                background:
                  selectedHistoryId === h.id ? "#eff6ff" : "#f9fafb",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: "2px",
                  color: "#111827",
                }}
              >
                {h.title}
              </div>
              <div style={{ color: "#6b7280", marginBottom: "2px" }}>
                📅 {h.date}
              </div>
              <div style={{ color: "#15803d" }}>✅ {h.completed}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
