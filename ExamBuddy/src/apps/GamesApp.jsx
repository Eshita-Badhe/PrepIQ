// GamesApp.jsx
import { useState, useEffect } from "react";
import ChatBot from "./ChatBot"; // adjust path if needed

async function fetchGame({ username, topic, gameType }) {
  if (!username) throw new Error("Username missing");

  const res = await fetch("http://localhost:5000/api/games/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      topic,
      game_type: gameType,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load game");
  return data.content;
}

const GAME_TYPES = [
  { id: "quiz", label: "Quiz", icon: "❓" },
  { id: "riddles", label: "Riddles", icon: "🧠" },
  { id: "mystery", label: "Mystery", icon: "🕵️" },
  { id: "flashcards", label: "Flash Cards", icon: "📇" },
  { id: "recall", label: "Active Recall", icon: "🔁" },
  { id: "teacher", label: "Act as Teacher", icon: "👩‍🏫" },
  { id: "chatbot", label: "Chatbot QnA", icon: "💬" }, // open Chatbot app inline
  { id: "cards", label: "Card Game", icon: "🃏" },      // more games like card
];

const GAME_HISTORY = [
  {
    id: "h1",
    type: "quiz",
    title: "Quiz – Basics warm‑up",
    date: "Today · 6:30 PM",
    summary: "3/3 correct",
  },
  {
    id: "h2",
    type: "flashcards",
    title: "Flash Cards – CIA & Firewall",
    date: "Today · 5:45 PM",
    summary: "Reviewed 4 cards",
  },
  {
    id: "h3",
    type: "recall",
    title: "Active Recall – Phishing signs",
    date: "Yesterday",
    summary: "2 prompts recalled",
  },
];

async function submitGame({ username, gameType, topic, title, score }) {
  await fetch("http://localhost:5000/api/games/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      game_type: gameType,
      topic,
      title,
      score,
    }),
  });
}

export default function GamesApp({ openWindow, username }) {
  const [activeGame, setActiveGame] = useState(null);
  const [gameTitle, setGameTitle] = useState("");
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [history, setHistory] = useState([]);

useEffect(() => {
  if (!username) return;

  fetch(`http://localhost:5000/api/games/history?username=${username}`)
    .then((r) => r.json())
    .then(setHistory)
    .catch(console.error);
}, [username]);

  function handleSelectGame(id) {
    setActiveGame(id);
    setSelectedHistoryId(null);
    if (!gameTitle) {
      const g = GAME_TYPES.find((x) => x.id === id);
      setGameTitle(g ? `${g.label} – Cyber Security` : "");
    }
  }

  function handleLoadHistory(h) {
    setSelectedHistoryId(h.id);
    setActiveGame(h.type);
    setGameTitle(h.title);
  }

  function handleSubmitFeedback(e) {
    e.preventDefault();
    if (!feedback.trim()) return;
    setFeedback("");
    setFeedbackStatus("Thanks for your feedback!");
    setTimeout(() => setFeedbackStatus(""), 2000);
  }

function renderGame() {
  if (!activeGame) {
    return (
      <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
        This area shows the selected game. Pick a mode on the left or load
        one from history.
      </div>
    );
  }

  const topic = gameTitle || "Cyber Security";

  switch (activeGame) {
    case "quiz":
      return <QuizGame username={username} topic={topic} />;
    case "riddles":
      return <RiddlesGame username={username} topic={topic} />;
    case "flashcards":
      return <FlashCardsGame username={username} topic={topic} />;
    case "recall":
      return <ActiveRecallGame username={username} topic={topic} />;
    case "mystery":
      return <MysteryGame username={username} topic={topic} />;
    case "chatbot":
      return (
        <div style={{ height: "360px" }}>
          <ChatBot username={username} />
        </div>
      );
    default:
      return (
        <div style={{ padding: 10, fontSize: "0.9rem" }}>
          Simple card-matching prototype coming soon…
        </div>
      );
  }
}

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 18,
        background:
          "radial-gradient(circle at top, #e0f2ff 0, #f3f4f6 45%, #e5e7eb 100%)",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#0f172a",
        boxShadow: "0 20px 40px rgba(15,23,42,0.14)",
        border: "1px solid rgba(148,163,184,0.45)",
        overflow: "hidden",
        padding: 14,
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 10,
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          Games Hub 
        </div>
        <div
          style={{
            marginLeft: "auto",
            fontSize: "0.8rem",
            color: "#6b7280",
          }}
        >
          Practice: Basics · Mobile Devices · IT
        </div>
      </div>

      {/* Main layout: left = game cards, middle = history, right = game page */}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: 12,
          minHeight: 0,
        }}
      >
        {/* Left: game type cards */}
        <div
          style={{
            width: 260,
            background: "#f9fafb",
            borderRadius: 14,
            border: "1px solid rgba(148,163,184,0.5)",
            padding: 10,
            boxSizing: "border-box",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))",
            gap: 8,
            alignContent: "flex-start",
            overflowX: "auto",
          }}
        >
          {GAME_TYPES.map((g) => {
            const isActive = activeGame === g.id;
            return (
              <button
                key={g.id}
                onClick={() => handleSelectGame(g.id)}
                style={{
                  borderRadius: 12,
                  border: isActive
                    ? "1px solid #3b82f6"
                    : "1px solid rgba(148,163,184,0.6)",
                  background: isActive ? "#eff6ff" : "#ffffff",
                  padding: "10px 8px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  fontSize: "0.8rem",
                  boxShadow: "0 6px 14px rgba(15,23,42,0.06)",
                }}
              >
                <div style={{ fontSize: "1.2rem" }}>{g.icon}</div>
                <div
                  style={{
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {g.label}
                </div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#6b7280",
                  }}
                >
                  {g.id === "quiz" && "MCQs on basics & mobile"}
                  {g.id === "riddles" && "Short security puzzles"}
                  {g.id === "mystery" && "Scenario‑based cases"}
                  {g.id === "flashcards" && "Key terms & concepts"}
                  {g.id === "recall" && "Prompt yourself actively"}
                  {g.id === "teacher" && "Explain topics aloud"}
                  {g.id === "chatbot" && "Chatbot QnA (full app)"}
                  {g.id === "cards" && "Future card‑style games"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Middle: game history panel */}
        <div
          style={{
            width: 220,
            background: "#ffffff",
            borderRadius: 14,
            border: "1px solid rgba(148,163,184,0.5)",
            padding: 10,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 8,
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
              fontSize: "0.75rem",
              color: "#9ca3af",
              marginBottom: 2,
            }}
          >
            Load a previous game session (prototype).
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {history.map((h) => (
              <button
                key={h.id}
                onClick={() => handleLoadHistory(h)}
                style={{
                  textAlign: "left",
                  padding: "8px 9px",
                  borderRadius: 10,
                  border:
                    selectedHistoryId === h.id
                      ? "1px solid #3b82f6"
                      : "1px solid rgba(148,163,184,0.6)",
                  background:
                    selectedHistoryId === h.id ? "#eff6ff" : "#f9fafb",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 2,
                    color: "#111827",
                  }}
                >
                  {h.title || `${h.game_type} – ${h.topic}`}
                </div>
                <div
                  style={{
                    color: "#6b7280",
                    marginBottom: 2,
                  }}
                >
                  📅 {new Date(h.created_at).toLocaleString()}
                </div>
                <div style={{ color: "#15803d" }}>{h.score != null ? `✅ Score: ${h.score}` : "Completed"}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: game page (second page + title + feedback) */}
        <div
          style={{
            flex: 1,
            background: "#ffffff",
            borderRadius: 14,
            border: "1px solid rgba(148,163,184,0.5)",
            boxShadow: "0 10px 20px rgba(15,23,42,0.08)",
            padding: 12,
            boxSizing: "border-box",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Top row: title input + mini back */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <input
              type="text"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              placeholder="Enter a title for this game session..."
              style={{
                flex: 1,
                padding: "7px 10px",
                borderRadius: 9999,
                border: "1px solid rgba(148,163,184,0.8)",
                background: "#f9fafb",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
            {activeGame && (
              <button
                onClick={() => setActiveGame(null)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 9999,
                  border: "1px solid rgba(148,163,184,0.8)",
                  background: "#ffffff",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                ⬅ Back
              </button>
            )}
          </div>

          {/* Actual game content */}
          <div style={{ flex: 1, minHeight: 0 }}>{renderGame()}</div>

          {/* Feedback bar */}
          <form
            onSubmit={handleSubmitFeedback}
            style={{
              marginTop: 6,
              paddingTop: 6,
              borderTop: "1px solid rgba(148,163,184,0.4)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.8rem",
            }}
          >
            <span style={{ color: "#6b7280" }}>Feedback on this game:</span>
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share quick feedback (prototype)..."
              style={{
                flex: 1,
                padding: "5px 8px",
                borderRadius: 9999,
                border: "1px solid rgba(148,163,184,0.7)",
                background: "#f9fafb",
                fontSize: "0.8rem",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "5px 10px",
                borderRadius: 9999,
                border: "none",
                background:
                  "linear-gradient(135deg,#3b82f6,#0ea5e9)",
                color: "#f9fafb",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Send
            </button>
            {feedbackStatus && (
              <span
                style={{
                  marginLeft: 4,
                  color: "#16a34a",
                }}
              >
                {feedbackStatus}
              </span>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function QuizGame({ username, topic }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username || !topic) return;

    setLoading(true);
    setError("");
    setQuestions([]);
    setCurrentIndex(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);

    fetchGame({ username, topic, gameType: "quiz" })
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No quiz questions generated");
        }
        setQuestions(data);
      })
      .catch((err) => {
        console.error("Quiz error:", err);
        setError(err.message || "Failed to load quiz");
      })
      .finally(() => setLoading(false));
  }, [username, topic]);

  if (loading) {
    return <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Loading quiz…</div>;
  }

  if (error) {
    return (
      <div
        style={{
          padding: 10,
          borderRadius: 12,
          background: "#fee2e2",
          border: "1px solid #ef4444",
          color: "#991b1b",
          fontSize: "0.85rem",
        }}
      >
        ❌ {error}
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
        No questions available.
      </div>
    );
  }

  const q = questions[currentIndex];

  function handleOptionClick(idx) {
    if (showResult) return;
    setSelected(idx);
  }

  function handleSubmit() {
    if (selected == null) return;
    if (selected === q.correctIndex) {
      setScore((s) => s + 1);
    }
    setShowResult(true);
  }

  function handleNext() {
    setSelected(null);
    setShowResult(false);
    setCurrentIndex((i) => i + 1);
  }

function QuizGame({ username, topic }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username || !topic) return;

    setLoading(true);
    setError("");
    setQuestions([]);
    setCurrentIndex(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);

    fetchGame({ username, topic, gameType: "quiz" })
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No quiz questions generated");
        }
        setQuestions(data);
      })
      .catch((err) => {
        console.error("Quiz error:", err);
        setError(err.message || "Failed to load quiz");
      })
      .finally(() => setLoading(false));
  }, [username, topic]);

  if (loading) {
    return <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Loading quiz…</div>;
  }

  if (error) {
    return (
      <div
        style={{
          padding: 10,
          borderRadius: 12,
          background: "#fee2e2",
          border: "1px solid #ef4444",
          color: "#991b1b",
          fontSize: "0.85rem",
        }}
      >
        ❌ {error}
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
        No questions available.
      </div>
    );
  }

  const q = questions[currentIndex];

  function handleOptionClick(idx) {
    if (showResult) return;
    setSelected(idx);
  }

  function handleSubmit() {
    if (selected == null) return;
    if (selected === q.correctIndex) {
      setScore((s) => s + 1);
    }
    setShowResult(true);
  }

  function handleNext() {
    setSelected(null);
    setShowResult(false);
    setCurrentIndex((i) => i + 1);
  }

  useEffect(() => {
    if (showResult && currentIndex === questions.length - 1) {
      submitGame({
        username,
        gameType: "quiz",
        topic,
        title: "Quiz – " + topic,
        score,
      });
    }
  }, [showResult]);

  return (
    <div>
      {/* Header */}
      <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 4 }}>
        Quiz · Question {currentIndex + 1} of {questions.length} · Score:{" "}
        <strong>{score}</strong>
      </div>

      {/* Question */}
      <div
        style={{
          padding: 10,
          borderRadius: 12,
          border: "1px solid rgba(148,163,184,0.7)",
          background: "#f9fafb",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            marginBottom: 8,
            fontSize: "0.9rem",
          }}
        >
          {q.question}
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Array.isArray(q.options) &&
            q.options.map((opt, idx) => {
              const isSelected = selected === idx;
              const showCorrect = showResult && idx === q.correctIndex;
              const showIncorrect =
                showResult && isSelected && idx !== q.correctIndex;

              let bg = "#ffffff";
              let border = "1px solid rgba(148,163,184,0.7)";

              if (isSelected && !showResult) {
                bg = "#eff6ff";
                border = "1px solid #3b82f6";
              }
              if (showCorrect) {
                bg = "#dcfce7";
                border = "1px solid #22c55e";
              }
              if (showIncorrect) {
                bg = "#fee2e2";
                border = "1px solid #ef4444";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx)}
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    borderRadius: 10,
                    border,
                    background: bg,
                    cursor: showResult ? "default" : "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  {opt}
                </button>
              );
            })}
        </div>

        {/* Controls */}
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          {!showResult && (
            <button
              onClick={handleSubmit}
              style={{
                padding: "6px 12px",
                borderRadius: 9999,
                border: "none",
                background: "linear-gradient(135deg,#3b82f6,#0ea5e9)",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Check answer
            </button>
          )}

          {showResult && currentIndex < questions.length - 1 && (
            <button
              onClick={handleNext}
              style={{
                padding: "6px 12px",
                borderRadius: 9999,
                border: "none",
                background: "#e5e7eb",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Next question
            </button>
          )}

          {showResult && currentIndex === questions.length - 1 && (
            <span style={{ fontSize: "0.8rem", color: "#15803d" }}>
              Quiz complete! Final score: {score}/{questions.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

  return (
    <div>
      {/* Header */}
      <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 4 }}>
        Quiz · Question {currentIndex + 1} of {questions.length} · Score:{" "}
        <strong>{score}</strong>
      </div>

      {/* Question */}
      <div
        style={{
          padding: 10,
          borderRadius: 12,
          border: "1px solid rgba(148,163,184,0.7)",
          background: "#f9fafb",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            marginBottom: 8,
            fontSize: "0.9rem",
          }}
        >
          {q.question}
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Array.isArray(q.options) &&
            q.options.map((opt, idx) => {
              const isSelected = selected === idx;
              const showCorrect = showResult && idx === q.correctIndex;
              const showIncorrect =
                showResult && isSelected && idx !== q.correctIndex;

              let bg = "#ffffff";
              let border = "1px solid rgba(148,163,184,0.7)";

              if (isSelected && !showResult) {
                bg = "#eff6ff";
                border = "1px solid #3b82f6";
              }
              if (showCorrect) {
                bg = "#dcfce7";
                border = "1px solid #22c55e";
              }
              if (showIncorrect) {
                bg = "#fee2e2";
                border = "1px solid #ef4444";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx)}
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    borderRadius: 10,
                    border,
                    background: bg,
                    cursor: showResult ? "default" : "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  {opt}
                </button>
              );
            })}
        </div>

        {/* Controls */}
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          {!showResult && (
            <button
              onClick={handleSubmit}
              style={{
                padding: "6px 12px",
                borderRadius: 9999,
                border: "none",
                background: selected == null ? "#cbd5e1" : "linear-gradient(135deg,#3b82f6,#0ea5e9)",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: selected == null ? "not-allowed" : "pointer",
              }}
            >
              Check answer
            </button>
          )}

          {showResult && currentIndex < questions.length - 1 && (
            <button
              onClick={handleNext}
              style={{
                padding: "6px 12px",
                borderRadius: 9999,
                border: "none",
                background: "#e5e7eb",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Next question
            </button>
          )}

          {showResult && currentIndex === questions.length - 1 && (
            <span style={{ fontSize: "0.8rem", color: "#15803d" }}>
              Quiz complete! Final score: {score}/{questions.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RiddlesGame({ username, topic }) {
  const [riddles, setRiddles] = useState([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    fetchGame({ username, topic, gameType: "riddles" }).then(setRiddles);
  }, [username, topic]);

  if (!riddles.length) return <p>Loading riddles…</p>;

  const r = riddles[index];

  function nextRiddle() {
    setShowAnswer(false);
    setIndex((i) => (i + 1) % riddles.length);
  }

  return (
    <div>
      <div
        style={{
          fontSize: "0.85rem",
          color: "#6b7280",
          marginBottom: 4,
        }}
      >
        Riddles · Cyber security concepts in puzzle form.
      </div>
      <div
        style={{
          padding: 10,
          borderRadius: 12,
          border: "1px solid rgba(148,163,184,0.7)",
          background: "#f9fafb",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            marginBottom: 8,
            fontSize: "0.9rem",
          }}
        >
          {r.prompt}
        </div>
        {showAnswer && (
          <div
            style={{
              marginTop: 6,
              padding: "6px 8px",
              borderRadius: 10,
              background: "#ecfdf3",
              color: "#166534",
              fontSize: "0.85rem",
            }}
          >
            💡 Answer: {r.answer}
          </div>
        )}

        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 6,
          }}
        >
          {!showAnswer && (
            <button
              onClick={() => setShowAnswer(true)}
              style={{
                padding: "6px 12px",
                borderRadius: 9999,
                border: "none",
                background: "#3b82f6",
                color: "#f9fafb",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Reveal answer
            </button>
          )}
          <button
            onClick={nextRiddle}
            style={{
              padding: "6px 10px",
              borderRadius: 9999,
              border: "none",
              background: "#e5e7eb",
              color: "#111827",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Next riddle
          </button>
        </div>
      </div>
    </div>
  );
}

function FlashCardsGame({ username, topic }) {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    fetchGame({ username, topic, gameType: "flashcards" }).then(setCards);
  }, [username, topic]);

  if (!cards.length) return <p>Loading cards…</p>;

  const c = cards[index];

  function nextCard() {
    setFlipped(false);
    setIndex((i) => (i + 1) % cards.length);
  }

  function prevCard() {
    setFlipped(false);
    setIndex((i) => (i - 1 + cards.length) % cards.length);
  }

  return (
    <div>
      <div
        style={{
          fontSize: "0.85rem",
          color: "#6b7280",
          marginBottom: 4,
        }}
      >
        Flash Cards · Tap to flip and revise key ideas.
      </div>

      <div
        onClick={() => setFlipped((f) => !f)}
        style={{
          marginBottom: 8,
          padding: "18px 16px",
          borderRadius: 16,
          border: "1px solid rgba(148,163,184,0.8)",
          background:
            "linear-gradient(135deg,#eff6ff,#e0f2fe)",
          boxShadow: "0 10px 20px rgba(37,99,235,0.12)",
          cursor: "pointer",
          minHeight: 90,
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            color: "#1d4ed8",
            marginBottom: 4,
          }}
        >
          Card {index + 1} of {cards.length}
        </div>
        <div
          style={{
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          {flipped ? "Answer" : "Prompt"}
        </div>
        <div
          style={{
            fontSize: "0.95rem",
          }}
        >
          {flipped ? c.back : c.front}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        <button
          onClick={prevCard}
          style={{
            padding: "6px 10px",
            borderRadius: 9999,
            border: "none",
            background: "#e5e7eb",
            color: "#111827",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          ◀ Prev
        </button>
        <button
          onClick={nextCard}
          style={{
            padding: "6px 10px",
            borderRadius: 9999,
            border: "none",
            background: "#e5e7eb",
            color: "#111827",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          Next ▶
        </button>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.75rem",
            color: "#6b7280",
          }}
        >
          Tip: Click the card to flip.
        </span>
      </div>
    </div>
  );
}

function ActiveRecallGame({ username, topic }) {
  const [prompts, setPrompts] = useState([]);
  const [index, setIndex] = useState(0);
  const [notes, setNotes] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState({});

  useEffect(() => {
    fetchGame({ username, topic, gameType: "recall" }).then(setPrompts);
  }, [username, topic]);

  if (!prompts.length) return <p>Loading prompts…</p>;

  const p = prompts[index];

  const isDone = completed[p.id];

  function markDone() {
    setCompleted((c) => ({ ...c, [p.id]: true }));
  }

  function nextPrompt() {
    setShowHint(false);
    setNotes("");
    setIndex((i) => (i + 1) % prompts.length);
  }

  return (
    <div>
      <div
        style={{
          fontSize: "0.85rem",
          color: "#6b7280",
          marginBottom: 4,
        }}
      >
        Active Recall · Type or speak your answer before checking notes.
      </div>

      <div
        style={{
          padding: 10,
          borderRadius: 12,
          border: "1px solid rgba(148,163,184,0.7)",
          background: "#f9fafb",
          marginBottom: 8,
          opacity: isDone ? 0.7 : 1,
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            color: "#3b82f6",
            marginBottom: 4,
          }}
        >
          Prompt {index + 1} of {prompts.length}
        </div>
        <div
          style={{
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          {p.question}
        </div>
        {showHint && (
          <div
            style={{
              marginBottom: 6,
              padding: "4px 6px",
              borderRadius: 9999,
              background: "#eff6ff",
              color: "#1d4ed8",
              fontSize: "0.8rem",
            }}
          >
            💡 Hint: {p.hint}
          </div>
        )}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your explanation here ..."
          rows={4}
          style={{
            width: "100%",
            marginTop: 4,
            padding: "6px 8px",
            borderRadius: 10,
            border: "1px solid rgba(148,163,184,0.8)",
            background: "#ffffff",
            fontSize: "0.85rem",
            resize: "vertical",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setShowHint((h) => !h)}
          style={{
            padding: "6px 10px",
            borderRadius: 9999,
            border: "none",
            background: "#e5e7eb",
            color: "#111827",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          {showHint ? "Hide hint" : "Show hint"}
        </button>
        <button
          onClick={markDone}
          style={{
            padding: "6px 10px",
            borderRadius: 9999,
            border: "none",
            background: isDone ? "#22c55e" : "#bbf7d0",
            color: "#166534",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {isDone ? "✅ Marked as recalled" : "Mark as recalled"}
        </button>
        <button
          onClick={nextPrompt}
          style={{
            padding: "6px 10px",
            borderRadius: 9999,
            border: "none",
            background: "#eff6ff",
            color: "#1d4ed8",
            fontSize: "0.8rem",
            cursor: "pointer",
            marginLeft: "auto",
          }}
        >
          Next prompt ▶
        </button>
      </div>
    </div>
  );
}

function MysteryGame({ username, topic }) {
  const [cases, setCases] = useState([]);
  const [index, setIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username || !topic) return;

    setLoading(true);
    setError("");
    setCases([]);
    setIndex(0);
    setShowSolution(false);

    fetchGame({
      username,
      topic,
      gameType: "mystery",
    })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("Invalid mystery game data");
        }
        setCases(data);
      })
      .catch((err) => {
        console.error("Mystery game error:", err);
        setError(err.message || "Failed to load mystery cases");
      })
      .finally(() => setLoading(false));
  }, [username, topic]);

  if (loading) {
    return (
      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
        Loading mystery cases…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 10,
          borderRadius: 12,
          background: "#fee2e2",
          border: "1px solid #ef4444",
          color: "#991b1b",
          fontSize: "0.85rem",
        }}
      >
        ❌ {error}
      </div>
    );
  }

  if (!cases.length) {
    return (
      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
        No mystery cases found for this topic.
      </div>
    );
  }

  const c = cases[index];

  function nextCase() {
    setShowSolution(false);
    setIndex((i) => (i + 1) % cases.length);
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          fontSize: "0.85rem",
          color: "#6b7280",
          marginBottom: 4,
        }}
      >
        Mystery · Scenario-based investigation
        <span style={{ marginLeft: 6 }}>
          · Case {index + 1} of {cases.length}
        </span>
      </div>

      {/* Case card */}
      <div
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid rgba(148,163,184,0.7)",
          background: "#f9fafb",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            color: "#7c3aed",
            marginBottom: 4,
          }}
        >
          🕵️ Scenario
        </div>

        <div
          style={{
            fontWeight: 600,
            marginBottom: 8,
            fontSize: "0.9rem",
          }}
        >
          {c.scenario}
        </div>

        <div
          style={{
            fontSize: "0.8rem",
            color: "#1f2937",
            marginBottom: 6,
          }}
        >
          <strong>Question:</strong> {c.question}
        </div>

        {showSolution && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 10px",
              borderRadius: 10,
              background: "#ecfeff",
              border: "1px solid #67e8f9",
              color: "#155e75",
              fontSize: "0.85rem",
            }}
          >
            <strong>Solution:</strong> {c.solution}
          </div>
        )}

        {/* Controls */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          {!showSolution && (
            <button
              onClick={() => setShowSolution(true)}
              style={{
                padding: "6px 12px",
                borderRadius: 9999,
                border: "none",
                background: "#7c3aed",
                color: "#ffffff",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Reveal solution
            </button>
          )}

          <button
            onClick={nextCase}
            style={{
              padding: "6px 10px",
              borderRadius: 9999,
              border: "none",
              background: "#e5e7eb",
              color: "#111827",
              fontSize: "0.8rem",
              cursor: "pointer",
              marginLeft: showSolution ? 0 : "auto",
            }}
          >
            Next case ▶
          </button>
        </div>
      </div>
    </div>
  );
}