// VoiceBotApp.jsx - Single thread per session + Indian accent + original UI
import { useEffect, useRef, useState } from "react";
import "../styles/app.css";

export default function VoiceBotApp({ username = "voice_user" }) {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionMessages, setSessionMessages] = useState([]); // Single session conversation
  const [sessionId, setSessionId] = useState(null); // Track current session
  const [isFirstMessage, setIsFirstMessage] = useState(true);

  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);

  // Indian accent voice settings
  const getIndianVoice = (voices) => {
    return voices.find(voice => 
      voice.lang === 'en-IN' || 
      voice.name.toLowerCase().includes('india') ||
      voice.name.toLowerCase().includes('indian') ||
      voice.name.includes('Google') && voice.lang.startsWith('en-')
    );
  };

  // Save entire session as ONE thread
  const saveSessionThread = async () => {
    if (sessionMessages.length === 0) return;
    
    try {
      const res = await fetch("http://localhost:5000/api/chat-threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          title: `Voice Session ${new Date().toLocaleDateString('en-IN')}: ${sessionMessages[0]?.text?.slice(0, 40) || "Voice chat"}`,
          messages: sessionMessages,
        }),
      });
      const data = await res.json();
      if (data.thread) {
        setSessionId(data.thread.id); // Track this session
        console.log("Voice session saved as thread:", data.thread.id);
      }
    } catch (e) {
      console.error("Session save failed:", e);
    }
  };

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.onstart = () => {
        setIsListening(true);
        setText("Listening to your query...");
      };

      recognitionRef.current.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        const userMsg = { from: "user", text: transcript };
        
        // Add to SINGLE session conversation
        setSessionMessages(prev => {
          const updated = [...prev, userMsg];
          return updated;
        });
        
        setText(`You said: "${transcript}"`);
        setIsFirstMessage(false);
        setLoading(true);

        try {
          const res = await fetch("http://localhost:5000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: transcript + " (Respond in short as this is a voice chat)",
              username,
              history: sessionMessages.map(m => ({
                role: m.from === "user" ? "user" : "assistant",
                content: m.text,
              })),
              agentic: true,
              voice_mode: true,
            }),
          });

          const data = await res.json();
          const botText = data.reply ?? "Got it!";
          const botMsg = { from: "bot", text: botText };
          
          // Add bot response to session
          setSessionMessages(prev => [...prev, userMsg, botMsg]);
          
          speakResponse(botText);
          
        } catch (err) {
          const errorMsg = { from: "bot", text: "Sorry, connection issue." };
          setSessionMessages(prev => [...prev, userMsg, errorMsg]);
          setText("Connection issue. Try again?");
        } finally {
          setLoading(false);
        }
      };

      recognitionRef.current.onerror = () => {
        setText("Didn't catch that. Try again?");
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    synthesisRef.current = window.speechSynthesis;
  }, [username, sessionMessages]);

  const speakResponse = (text) => {
    setIsSpeaking(true);
    let voices = synthesisRef.current.getVoices();
    
    if (voices.length === 0) {
      synthesisRef.current.onvoiceschanged = () => speakWithIndianVoice(text);
      return;
    }
    speakWithIndianVoice(text);
  };

  const speakWithIndianVoice = (text) => {
    const voices = synthesisRef.current.getVoices();
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.lang = 'en-IN';
    utterance.rate = 0.92;
    utterance.pitch = 0.95;
    utterance.volume = 0.9;
    
    const indianVoice = getIndianVoice(voices);
    if (indianVoice) utterance.voice = indianVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthesisRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setText("Voice not supported");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      synthesisRef.current.cancel();
      setText("Listening to your query...");
      recognitionRef.current.start();
    }
  };

  // Save on unmount/close (single session thread)
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (sessionMessages.length > 0 && !sessionId) {
        await saveSessionThread();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (sessionMessages.length > 0 && !sessionId) {
        saveSessionThread();
      }
    };
  }, [sessionMessages, sessionId]);

  // Manual new session
  const startNewSession = async () => {
    if (sessionMessages.length > 0) {
      await saveSessionThread();
    }
    setSessionMessages([]);
    setSessionId(null);
    setIsFirstMessage(true);
    setText("");
  };

  return (
    <div className="voice-bot-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <h2 className="voice-title">Voice Assistant</h2>
        <button
          onClick={startNewSession}
          style={{
            padding: "4px 8px",
            fontSize: "0.7rem",
            borderRadius: "4px",
            border: "1px solid rgba(255,255,255,0.3)",
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            cursor: "pointer",
          }}
          title="New voice session"
        >
          New
        </button>
      </div>
      
      <p className="voice-subtitle">
        {isFirstMessage 
          ? "Press and speak naturally (Indian English)" 
          : `Session: ${sessionMessages.length/2} exchanges`
        }
        {isSpeaking && " 🇮🇳 Responding..."}
      </p>

      <div className="mic-wrapper">
        <button
          type="button"
          className={`mic-button ${isListening ? "listening" : ""}`}
          onClick={toggleListening}
          disabled={loading}
        >
          <span className="mic-icon" />
        </button>
        <div className="mic-ring mic-ring-1" />
        <div className="mic-ring mic-ring-2" />
      </div>

      <input
        className="voice-input"
        placeholder="Your voice text will appear here..."
        value={text}
        readOnly
      />
    </div>
  );
}
