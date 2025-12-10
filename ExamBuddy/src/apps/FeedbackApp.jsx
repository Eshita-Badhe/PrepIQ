// FeedbackApp.jsx
import { useState } from "react";
import "../styles/app.css";

export default function FeedbackApp() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");setText("");
    setStatus("Thanks for your feedback!");
  };

  return (
    <div className="feedback-app">
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share anything freely..."
          rows={5}
        />
        <button type="submit" disabled={!text.trim()}>
          Submit
        </button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
}
