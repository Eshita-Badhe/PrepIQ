// NetworkApp.jsx
import React, { useState } from "react";

const CONTACTS = [
  {
    id: "mentor",
    name: "Security Mentor",
    status: "Online · Helps with doubts",
  },
  {
    id: "lab-partner",
    name: "Lab Partner",
    status: "Last seen 10 min ago",
  },
  {
    id: "study-group",
    name: "Study Group (CyberSec)",
    status: "3 members · Exam tomorrow",
  },
];

const INITIAL_MESSAGES = {
  mentor: [
    { from: "them", text: "Hey, ready for the cyber security exam?" },
    { from: "you", text: "Almost! Revising mobile security and IT section." },
    { from: "them", text: "Nice. Ping me if you get stuck on any concept." },
  ],
  "lab-partner": [
    { from: "them", text: "Did you finish the mobile device hardening notes?" },
    { from: "you", text: "Yes, will share them after this session." },
  ],
  "study-group": [
    { from: "them", text: "Reminder: group call at 8 PM for quick revision." },
    { from: "you", text: "Got it, see you there!" },
  ],
};

export default function NetworkApp() {
  const [activeContactId, setActiveContactId] = useState("mentor");
  const [messagesByContact, setMessagesByContact] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");

  const activeMessages = messagesByContact[activeContactId] || [];
  const activeContact =
    CONTACTS.find((c) => c.id === activeContactId) || CONTACTS[0];

  function handleSend(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // append user message
    const newMsgs = [
      ...activeMessages,
      { from: "you", text: trimmed },
      {
        from: "them",
        text: "Okay",
      },
    ];

    setMessagesByContact((prev) => ({
      ...prev,
      [activeContactId]: newMsgs,
    }));
    setInput("");
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        borderRadius: 18,
        background:
          "radial-gradient(circle at top, #e0f2ff 0, #f3f4f6 45%, #e5e7eb 100%)",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#0f172a",
        boxShadow: "0 20px 40px rgba(15,23,42,0.14)",
        border: "1px solid rgba(148,163,184,0.45)",
        overflow: "hidden",
      }}
    >
      {/* Contacts list */}
      <div
        style={{
          width: 240,
          background: "#f9fafb",
          borderRight: "1px solid rgba(148,163,184,0.5)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "10px 12px",
            borderBottom: "1px solid rgba(148,163,184,0.4)",
            fontSize: "0.9rem",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          Network · Study Contacts
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {CONTACTS.map((c) => {
            const isActive = c.id === activeContactId;
            return (
              <button
                key={c.id}
                onClick={() => setActiveContactId(c.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 8px",
                  borderRadius: 10,
                  border: "none",
                  background: isActive ? "#eff6ff" : "#ffffff",
                  boxShadow: isActive
                    ? "0 4px 10px rgba(59,130,246,0.15)"
                    : "0 1px 3px rgba(15,23,42,0.06)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: "#111827",
                    marginBottom: 2,
                  }}
                >
                  {c.name}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                  }}
                >
                  {c.status}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
        }}
      >
        {/* Header bar */}
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid rgba(148,163,184,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {activeContact.name}
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "#6b7280",
            }}
          >
            {activeContact.status}
          </div>
        </div>

        {/* Messages list */}
        <div
          style={{
            flex: 1,
            padding: 10,
            overflowY: "auto",
            background:
              "radial-gradient(circle at top,#f9fafb 0,#ffffff 45%)",
          }}
        >
          {activeMessages.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent:
                  m.from === "you" ? "flex-end" : "flex-start",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "6px 9px",
                  borderRadius:
                    m.from === "you"
                      ? "14px 14px 2px 14px"
                      : "14px 14px 14px 2px",
                  background:
                    m.from === "you"
                      ? "linear-gradient(135deg,#3b82f6,#0ea5e9)"
                      : "#e5e7eb",
                  color: m.from === "you" ? "#f9fafb" : "#111827",
                  fontSize: "0.9rem",
                  boxShadow: "0 4px 10px rgba(15,23,42,0.08)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input bar */}
        <form
          onSubmit={handleSend}
          style={{
            padding: "8px 10px",
            borderTop: "1px solid rgba(148,163,184,0.4)",
            display: "flex",
            gap: 6,
            background: "#f9fafb",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message about cyber security prep..."
            style={{
              flex: 1,
              padding: "7px 10px",
              borderRadius: 9999,
              border: "1px solid rgba(148,163,184,0.8)",
              background: "#ffffff",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "7px 12px",
              borderRadius: 9999,
              border: "none",
              background:
                "linear-gradient(135deg,#3b82f6,#0ea5e9)",
              color: "#f9fafb",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
