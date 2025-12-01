// src/ChatbotAssistant.jsx
import React, { useState } from "react";

export default function ChatBot() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi, I am your assistant. How can I help you?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // Add user message locally
    const userMsg = { from: "user", text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5001/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: trimmed })
      });

      const data = await res.json();
      const botText = data.reply ?? "Error: no reply from server";

      setMessages(prev => [...prev, { from: "bot", text: botText }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { from: "bot", text: "Error contacting server." }
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
        alignItems: "center",
        justifyContent: "center",
        display: "flex",}}>
     <div
        style={{
          width: "100%",
          maxWidth: "1500px",
          height: "100%",
          background: "rgba(10,20,40,0.9)",
          color: "#f5f5f5",
          borderRadius: "10px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          alignSelf: "center"
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background:
              "linear-gradient(90deg, rgba(34,76,160,0.9), rgba(10,30,70,0.9))",
            fontWeight: 1000,
            fontSize: "1.2rem"
          }}
        >
          Chatbot Assistant
        </div>

        <div
          style={{
            flex: 1,
            padding: "10px",
            overflowY: "auto",
            fontSize: "1.2rem"
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.from === "user" ? "flex-end" : "flex-start",
                marginBottom: "6px"
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
                  whiteSpace: "pre-wrap"
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ fontSize: 12, opacity: 0.7 }}>Assistant is typing…</div>
          )}
        </div>

        <form
          onSubmit={handleSend}
          style={{
            display: "flex",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            padding: "8px"
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
            fontSize: "1.2rem"
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
              fontSize: "1.2rem"
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
