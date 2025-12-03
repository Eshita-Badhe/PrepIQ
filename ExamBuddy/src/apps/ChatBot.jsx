// src/ChatbotAssistant.jsx
import React, { useEffect, useState } from "react";

export default function ChatBot({ username }) {
  const [threads, setThreads] = useState([]); // [{id, title}]
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi, I am your assistant. How can I help you?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Load thread list on mount
  useEffect(() => {
    async function loadThreads() {
      try {
        const res = await fetch(
          `http://localhost:5000/api/chat-threads?username=${encodeURIComponent(
            username
          )}`
        );
        const data = await res.json();
        setThreads(data.threads || []);
      } catch (e) {
        console.error("Error loading threads", e);
      }
    }
    loadThreads();
  }, [username]);

  // Load messages when activeThreadId changes
  useEffect(() => {
    async function loadThreadMessages() {
      if (!activeThreadId) return;
      try {
        const res = await fetch(
          `http://localhost:5000/api/chat-threads/${activeThreadId}`
        );
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (e) {
        console.error("Error loading thread messages", e);
      }
    }
    loadThreadMessages();
  }, [activeThreadId]);

  function startNewThread() {
    setActiveThreadId(null);
    setMessages([
      { from: "bot", text: "Hi, I am your assistant. How can I help you?" },
    ]);
  }

  async function saveThread(updatedMessages) {
    // Use first user message as title fallback
    const firstUser = updatedMessages.find(m => m.from === "user");
    const title = firstUser ? firstUser.text.slice(0, 40) : "New chat";

    try {
      const res = await fetch("http://localhost:5000/api/chat-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          thread_id: activeThreadId, // null for new
          title,
          messages: updatedMessages,
        }),
      });
      const data = await res.json();
      if (data.thread) {
        setActiveThreadId(data.thread.id);
        // refresh thread list
        setThreads(prev => {
          const others = prev.filter(t => t.id !== data.thread.id);
          return [data.thread, ...others];
        });
      }
    } catch (e) {
      console.error("Error saving thread", e);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = { from: "user", text: trimmed };
    const newHistory = [...messages, userMsg];

    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          username,
          history: newHistory.map(m => ({
            role: m.from === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      const data = await res.json();
      const botText = data.reply ?? "Error: no reply from server";
      const updatedMessages = [...newHistory, { from: "bot", text: botText }];
      setMessages(updatedMessages);

      // Persist thread
      await saveThread(updatedMessages);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { from: "bot", text: "Error contacting server." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#050509",
        color: "#f5f5f5",
        borderRadius: "20px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Left: threads list */}
      <div
        style={{
          width: "30%",
          maxWidth: "200px",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(5,5,10,0.98)",
          padding: "10px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          borderTopLeftRadius: "20px",
          borderBottomLeftRadius: "20px",
        }}
      >
        <div
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "#9ca3af",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Chats
        </div>

        <button
          onClick={startNewThread}
          style={{
            padding: "6px 10px",
            borderRadius: "9999px",
            border: "1px solid #3b82f6",
            background: "#020617",
            color: "#f9fafb",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "6px",
          }}
        >
          + New chat
        </button>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
          }}
        >
          {threads.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveThreadId(t.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "none",
                marginBottom: "4px",
                cursor: "pointer",
                background:
                  t.id === activeThreadId ? "#111827" : "transparent",
                color:
                  t.id === activeThreadId ? "#f9fafb" : "#9ca3af",
                fontSize: "0.9rem",
              }}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* Right: existing chat UI */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "rgba(57, 57, 57, 0.71)",
          borderTopRightRadius: "20px",
          borderBottomRightRadius: "20px",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "linear-gradient(90deg, rgba(34,76,160,0.9), rgba(10,30,70,0.9))",
            fontWeight: 1000,
            fontSize: "1.1rem",
            borderTopRightRadius: "20px",
          }}
        >
          Chatbot Assistant
        </div>

        <div
          style={{
            flex: 1,
            padding: "10px",
            overflowY: "auto",
            fontSize: "1rem",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.from === "user" ? "flex-end" : "flex-start",
                marginBottom: "6px",
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "6px 10px",
                  borderRadius: "10px",
                  background:
                    m.from === "user"
                      ? "rgba(70,130,240,0.9)"
                      : "rgba(40,50,80,0.9)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Assistant is typing…
            </div>
          )}
        </div>

        <form
          onSubmit={handleSend}
          style={{
            display: "flex",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            padding: "8px",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(5,10,25,0.9)",
              color: "#f5f5f5",
              outline: "none",
              fontSize: "1rem",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              marginLeft: "6px",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "none",
              background: loading ? "#666" : "#2f6ab8",
              color: "#fff",
              cursor: loading ? "default" : "pointer",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
