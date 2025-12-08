// VoiceBotApp.jsx
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "../styles/app.css";

export default function VoiceBotApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };
    recognitionRef.current = rec;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (!listening) {
      recognitionRef.current.start();
      setListening(true);
    } else {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const sendMessage = async (e) => {
    e && e.preventDefault();
    const content = input.trim();
    if (!content) return;
    const newMessages = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    const res = await axios.post("/api/voicebot/message", { content, history: newMessages });
    const reply = res.data.reply;
    setMessages([...newMessages, { role: "assistant", content: reply }]);
    // Optionally speak the reply
    if ("speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(reply);
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <div className="voicebot-app">
      <h2>Companion Assistant</h2>
      <div className="conversation">
        {messages.map((m, idx) => (
          <div key={idx} className={`msg ${m.role}`}>
            <strong>{m.role === "user" ? "You" : "AI"}</strong>: {m.content}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <button type="button" onClick={toggleListening}>
          {listening ? "Stop Listening" : "Talk"}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say or type something..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
