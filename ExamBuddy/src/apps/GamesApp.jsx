// GamesApp.jsx
import { useState } from "react";
import ChatBot from "./ChatBot"; // adjust path if needed

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

export default function GamesApp({ openWindow, username }) {
  const [activeGame, setActiveGame] = useState(null);
  const [gameTitle, setGameTitle] = useState("");
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");

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

    switch (activeGame) {
      case "quiz":
        return <QuizGame />;
      case "riddles":
        return <RiddlesGame />;
      case "flashcards":
        return <FlashCardsGame />;
      case "recall":
        return <ActiveRecallGame />;
      case "chatbot":
        return (
          <div style={{ height: "360px" }}>
            <ChatBot username={username} />
          </div>
        );
      default:
        return (
          <div
            style={{
              padding: 10,
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.7)",
              background: "#f9fafb",
              fontSize: "0.9rem",
            }}
          >
            Simple card‑matching prototype coming soon… use this slot for future
            games.
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
            {GAME_HISTORY.map((h) => (
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
                  {h.title}
                </div>
                <div
                  style={{
                    color: "#6b7280",
                    marginBottom: 2,
                  }}
                >
                  📅 {h.date}
                </div>
                <div style={{ color: "#15803d" }}>✅ {h.summary}</div>
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

function QuizGame() {
  const questions = [
    {
      id: 1,
      topic: "Basics",
      question:
        "Which option best describes the goal of cyber security?",
      options: [
        "To remove all bugs from software",
        "To protect confidentiality, integrity, and availability of data",
        "To block all internet traffic",
        "To monitor social media activity",
      ],
      correctIndex: 1,
    },
    {
      id: 2,
      topic: "Mobile Devices",
      question:
        "Which practice most reduces risk when using public Wi‑Fi on a phone?",
      options: [
        "Turning off the lock screen",
        "Using a VPN for network traffic",
        "Installing apps from unknown sources",
        "Disabling device encryption",
      ],
      correctIndex: 1,
    },
    {
      id: 3,
      topic: "IT Section",
      question:
        "What does least privilege mean in access control?",
      options: [
        "Users get access to all company systems",
        "Users get only the minimum access needed to perform their job",
        "Admins share one common password",
        "Guests can edit production servers",
      ],
      correctIndex: 1,
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const q = questions[currentIndex];

  function handleOptionClick(idx) {
    if (showResult) return;
    setSelected(idx);
  }

  function handleSubmit() {
    if (selected == null) return;
    const isCorrect = selected === q.correctIndex;
    if (isCorrect) setScore((s) => s + 1);
    setShowResult(true);
  }

  function handleNext() {
    setSelected(null);
    setShowResult(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
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
        Quiz · Question {currentIndex + 1} of {questions.length} · Score:{" "}
        <strong>{score}</strong>
      </div>
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
            fontSize: "0.75rem",
            color: "#3b82f6",
            marginBottom: 4,
          }}
        >
          Topic: {q.topic}
        </div>
        <div
          style={{
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          {q.question}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {q.options.map((opt, idx) => {
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

        <div
          style={{
            marginTop: 8,
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          {!showResult && (
            <button
              onClick={handleSubmit}
              style={{
                padding: "6px 12px",
                borderRadius: 9999,
                border: "none",
                background:
                  "linear-gradient(135deg,#3b82f6,#0ea5e9)",
                color: "#f9fafb",
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
                color: "#111827",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Next question
            </button>
          )}
          {showResult && currentIndex === questions.length - 1 && (
            <span
              style={{
                fontSize: "0.8rem",
                color: "#15803d",
              }}
            >
              Quiz complete! Final score: {score}/{questions.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RiddlesGame() {
  const riddles = [
    {
      id: 1,
      prompt:
        "I live on your phone and ask for too many permissions. If you install me from untrusted stores, I may steal your data. What am I?",
      answer: "A malicious mobile app (malware).",
    },
    {
      id: 2,
      prompt:
        "I am a fake login page that looks exactly like the real thing. If you trust me, I’ll take your password. Who am I?",
      answer: "A phishing page.",
    },
    {
      id: 3,
      prompt:
        "I limit what each user can do in a system so one mistake doesn’t break everything. What security principle am I?",
      answer: "Least privilege.",
    },
  ];
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

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

function FlashCardsGame() {
  const cards = [
    {
      id: 1,
      front: "CIA Triad",
      back: "Confidentiality, Integrity, Availability – three core goals of security.",
    },
    {
      id: 2,
      front: "Mobile device hardening",
      back: "Use screen lock, OS updates, store apps from trusted stores, and enable encryption.",
    },
    {
      id: 3,
      front: "Firewall",
      back: "A network device or software that filters traffic based on rules.",
    },
    {
      id: 4,
      front: "Phishing",
      back: "Deceptive messages or sites that trick users into revealing credentials or data.",
    },
  ];

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

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

function ActiveRecallGame() {
  const prompts = [
    {
      id: 1,
      question:
        "Explain, in your own words, how you would secure a new Android phone that you use for banking.",
      hint: "Think: screen lock, OS updates, app sources, encryption, backups.",
    },
    {
      id: 2,
      question:
        "Describe the difference between authentication and authorization with a cyber security example.",
      hint: "Login vs. what resources you can access.",
    },
    {
      id: 3,
      question:
        "List at least three signs that an email might be a phishing attempt.",
      hint: "Sender, links, tone, urgency.",
    },
  ];

  const [index, setIndex] = useState(0);
  const [notes, setNotes] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState({}); // id -> true

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

