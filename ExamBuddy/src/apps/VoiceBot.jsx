// VoiceBotApp.jsx
import { useEffect, useRef, useState } from "react";
import "../styles/app.css";

export default function VoiceBotApp() {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState("");

  const toggleListening = () => {
    // prototype: just toggle state and fill some mock text
    if (!isListening) {
      setText("Listening to your query...");
    } else {
      setText("You said: \"Show my exam schedule\"");
    }
    setIsListening((v) => !v);
  };

  return (
      <div className="voice-bot-card">
        <h2 className="voice-title">Voice Assistant</h2>
        <p className="voice-subtitle">Press and speak your question</p>

        <div className="mic-wrapper">
          <button
            type="button"
            className={`mic-button ${isListening ? "listening" : ""}`}
            onClick={toggleListening}
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
          onChange={(e) => setText(e.target.value)}
        />
      </div>
  );
}
