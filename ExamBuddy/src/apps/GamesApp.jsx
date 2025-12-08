// GamesApp.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/app.css";

export default function GamesApp() {
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentMode, setCurrentMode] = useState("quiz");
  const [challenge, setChallenge] = useState(null);

  useEffect(() => {
    axios.get("/api/games/profile").then((res) => setProfile(res.data));
    axios.get("/api/games/leaderboard").then((res) => setLeaderboard(res.data.entries || []));
  }, []);

  const requestChallenge = async (mode) => {
    setCurrentMode(mode);
    const res = await axios.post("/api/games/challenge", { mode });
    setChallenge(res.data);
  };

  const preferredMethods = profile?.preferred_methods || [];

  return (
    <div className="games-app">
      <h2>Study Games</h2>

      {profile && (
        <section>
          <h3>Your progress</h3>
          <p>Level: {profile.level}</p>
          <p>XP: {profile.xp}</p>
          <p>
            Preferred methods:{" "}
            {preferredMethods.length > 0
              ? preferredMethods.join(", ")
              : "Not set yet"}
          </p>
        </section>
      )}

      <section>
        <h3>Modes</h3>
        <div className="mode-buttons">
          {["quiz", "flashcards", "riddles", "talks", "active_recall"].map((m) => (
            <button key={m} onClick={() => requestChallenge(m)}>
              {m.replace("_", " ").toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>Leaderboard</h3>
        <ol>
          {leaderboard.map((entry) => (
            <li key={entry.user_id}>
              {entry.username} — {entry.points} pts
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3>Current challenge</h3>
        {!challenge && <p>Pick a mode to start.</p>}
        {challenge && (
          <div className="challenge-card">
            <p>Type: {currentMode}</p>
            <p>Prompt: {challenge.prompt}</p>
            {/* For quiz: options; for flashcards: front/back etc. */}
          </div>
        )}
      </section>
    </div>
  );
}
