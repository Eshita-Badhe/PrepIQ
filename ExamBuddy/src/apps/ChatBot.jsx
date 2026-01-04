// src/ChatbotAssistant.jsx - COMPLETE UPDATED CODE WITH PER-MESSAGE SPEAK BUTTONS
import React, { useEffect, useRef, useState, useCallback } from "react";

export default function ChatBot({ username }) {
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);

  const [threads, setThreads] = useState([]); // [{id, title}]
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi, I am your assistant. How can I help you?" },
  ]);
  const [input, setInput] = useState("");
  const [inputRows, setInputRows] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);

  useEffect(() => {
  const textarea = document.querySelector('.chat-input');
  if (textarea) {
    textarea.style.height = 'auto';
    const maxRows = 4;
    const scrollHeight = textarea.scrollHeight;
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const newRows = Math.min(Math.ceil(scrollHeight / lineHeight), maxRows);
    setInputRows(newRows);
  }
}, [input]);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        recognitionRef.current.stop();
      };
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        recognitionRef.current.stop();
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }

    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }
  }, []);

  // Speak specific message by index
  const speakMessage = useCallback((messageIndex) => {
    if (!synthesisRef.current) {
      alert('Speech synthesis not supported in this browser');
      return;
    }

    // Stop current speech if clicking same or different button
    if (speakingMessageIndex !== null) {
      synthesisRef.current.cancel();
      setSpeakingMessageIndex(null);
      return;
    }

    const msg = messages[messageIndex];
    if (!msg || msg.from !== "bot") return;

    const utterance = new SpeechSynthesisUtterance(msg.text);
    
    utterance.onstart = () => setSpeakingMessageIndex(messageIndex);
    utterance.onend = () => setSpeakingMessageIndex(null);
    utterance.onerror = () => setSpeakingMessageIndex(null);

    // Prefer natural voices
    const voices = synthesisRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('google') || 
      voice.name.toLowerCase().includes('microsoft') || 
      voice.lang.startsWith('en-')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    synthesisRef.current.speak(utterance);
  }, [messages, speakingMessageIndex]);

  // Voice input toggle
  const toggleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  }, [isListening]);

  // Load thread list on mount
  useEffect(() => {
    async function loadThreads() {
      try {
        const res = await fetch(
          `http://localhost:5000/api/chat-threads?username=${encodeURIComponent(username)}`
        );
        const data = await res.json();
        setThreads(data.threads || []);
      } catch (e) {
        console.error("Error loading threads", e);
      }
    }
    if (username) {
      loadThreads();
    }
  }, [username]);

  // Load messages when activeThreadId changes
  useEffect(() => {
    async function loadThreadMessages() {
      if (!activeThreadId) return;
      try {
        const res = await fetch(`http://localhost:5000/api/chat-threads/${activeThreadId}`);
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (e) {
        console.error("Error loading thread messages", e);
      }
    }
    loadThreadMessages();
  }, [activeThreadId]);

  // Auto-save current thread when tab/window closes
  useEffect(() => {
    function handleBeforeUnload(event) {
      if (!username) return;

      const userMessages = messages.filter(m => m.from === "user");
      if (userMessages.length === 0) return;

      const firstUser = userMessages[0];
      const title = firstUser.text.slice(0, 40);

      const payload = {
        username,
        thread_id: activeThreadId,
        title,
        messages,
      };

      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });

      navigator.sendBeacon("http://localhost:5000/api/chat-threads", blob);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [messages, activeThreadId, username]);

  async function saveThread(updatedMessages) {
    const userMessages = updatedMessages.filter(m => m.from === "user");
    if (userMessages.length === 0) return;

    const firstUser = userMessages[0];
    const title = firstUser.text.slice(0, 40);
    try {
      const res = await fetch("http://localhost:5000/api/chat-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          thread_id: activeThreadId,
          title,
          messages: updatedMessages,
        }),
      });
      const data = await res.json();
      if (data.thread) {
        setActiveThreadId(data.thread.id);
        setThreads(prev => {
          const others = prev.filter(t => t.id !== data.thread.id);
          return [data.thread, ...others];
        });
      }
    } catch (e) {
      console.error("Error saving thread", e);
    }
  }

  async function startNewThread() {
    if (messages.length > 1) {
      await saveThread(messages);
    }
    setActiveThreadId(null);
    setMessages([
      { from: "bot", text: "Hi, I am your assistant. How can I help you?" },
    ]);
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
          agentic: true,
        }),
      });

      const data = await res.json();
      const botText = data.reply ?? "Error: no reply from server";
      const updatedMessages = [...newHistory, { from: "bot", text: botText }];
      setMessages(updatedMessages);

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

        <div style={{ flex: 1, overflowY: "auto" }}>
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
                background: t.id === activeThreadId ? "#111827" : "transparent",
                color: t.id === activeThreadId ? "#f9fafb" : "#9ca3af",
                fontSize: "0.9rem",
              }}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* Right: chat UI */}
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
            fontSize: "1.2rem",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.from === "user" ? "flex-end" : "flex-start",
                marginBottom: "12px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: m.from === "user" ? "row-reverse" : "row",
                  gap: "8px",
                  maxWidth: "85%",
                }}
              >
                {/* 🔊 SPEAK BUTTON - ONLY FOR BOT MESSAGES */}
                {m.from === "bot" && (
                  <button
                    onClick={() => speakMessage(i)}
                    title={speakingMessageIndex === i ? "Stop speaking" : "Read this message aloud"}
                    style={{
                      padding: "6px",
                      borderRadius: "50%",
                      border: "none",
                      background: speakingMessageIndex === i 
                        ? "rgba(59,130,246,0.7)" 
                        : "#666",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "1rem",
                      minWidth: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                      opacity: speakingMessageIndex !== null && speakingMessageIndex !== i ? 0.4 : 1,
                    }}
                  >
                   🔊
                  </button>
                )}

                {/* MESSAGE BUBBLE */}
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "12px",
                    background: m.from === "user"
                      ? "rgba(70,130,240,0.9)"
                      : "rgba(40,50,80,0.9)",
                    whiteSpace: "pre-wrap",
                    minHeight: "32px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {m.text}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Assistant is typing…
            </div>
          )}
        </div>

        {/* INPUT FORM */}
        <form
          onSubmit={handleSend}
          style={{
            display: "flex",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            padding: "8px",
            gap: "8px",
            alignItems: "center",
          }}
        >
        <div style={{ 
          flex: 1, 
          position: "relative",
          width: "100%",
          padding: "2px 10px",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(5,10,25,0.9)",
        }}>
          <textarea
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message... or use voice input"
            style={{
              width: "100%",
              border: "none",
              background: "rgba(5,10,25,0.9)",
              color: "#f5f5f5",
              outline: "none",
              fontSize: "1rem",
              lineHeight: "1.4",
              resize: "none", 
              fontFamily: "inherit",
              height: "48px",
              minHeight: "48px",
              maxHeight: "160px",  // 4 lines max
              scrollbarWidth: "thin",
              scrollbarColor: "#1f2937 #111827",
            }}
            rows={inputRows}
          />
        </div>

          {/* 🎤 VOICE INPUT BUTTON */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            disabled={loading}
            title={isListening ? "Stop listening" : "Voice input"}
            style={{
              padding: "8px",
              borderRadius: "50%",
              border: "none",
              background: isListening ? "rgba(70,130,240,0.9)": "#666",
              color: "#fff",
              cursor: loading ? "default" : "pointer",
              fontSize: "1.1rem",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: loading ? 0.5 : 1,
              transition: "all 0.2s ease",
            }}
          >
            🎤
          </button>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: "none",
              background: (loading || !input.trim()) ? "#666" : "#2f6ab8",
              color: "#fff",
              cursor: (loading || !input.trim()) ? "default" : "pointer",
              fontWeight: 600,
              fontSize: "1rem",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
