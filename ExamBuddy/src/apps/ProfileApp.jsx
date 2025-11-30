import React, { useState, useEffect } from "react";
import userImg from "../assets/user.png";

export default function ProfileApp({ openWindow }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [showMemory, setShowMemory] = useState(false);
  const [memories, setMemories] = useState([]);

  // 1. Real backend fetch
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("http://localhost:5000/api/profile", {
          credentials: "include",
        });
        const data = await res.json();
        if (!data.success) {
          setError(data.msg || "Failed to load profile");
          // fallback mock if needed
          setUser({
            name: "USER",
            role: "Student",
            streak: 0,
            lastSeen: "Today",
            details: "",
          });
        } else {
          setUser(data.profile);
        }
      } catch (e) {
        setError("Network error: " + e.message);
        setUser({
          name: "Student User",
          role: "TY.SEM5 Computer Science",
          streak: 0,
          lastSeen: "Today",
          details: "",
        });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // 2. Load memories point-wise (still mock for now)
  useEffect(() => {
    if (showMemory) {
      const storedMemories = [
        "Working on 'Exam Buddy' full-stack project [memory:1]",
        "Uses Windows 7 UI style preference [memory:6]",
        "Learning React & Google Cloud Auth [memory:21]",
        "Interested in Android & Blockchain",
        "Preparing for Software Testing exams",
      ];
      setMemories([]);
      storedMemories.forEach((mem, index) => {
        setTimeout(() => {
          setMemories((prev) => [...prev, mem]);
        }, index * 400);
      });
    }
  }, [showMemory]);

  if (loading) return <div>Loading user profile...</div>;

  if (!user) return <div>Unable to load profile. {error}</div>;

  return (
    <div className="profile-dashboard">
      {/* Header with User Details */}
      <div className="profile-header">
        <img
          src={userImg}
          alt="User"
          width={200}
          height={200}
          className="profile-pic"
          onError={(e) =>
            (e.target.src = "https://via.placeholder.com/64")
          }
        />
        <div>
          <h3 style={{ margin: "0 0 4px 0" }}>{user.name}</h3>
          <div style={{ color: "#666", fontSize: "12px" }}>
            {user.role}
          </div>
          <div style={{ color: "#2f6ab8", fontSize: "12px" }}>
            {user.details}
          </div>
          <div style={{ color: "#888", fontSize: "11px", marginTop: 4 }}>
            Last seen: {user.lastSeen}
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ fontSize: "11px", color: "#666" }}>
            CURRENT STREAK
          </div>
          <div className="stat-val">🔥 {user.streak} Days</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: "11px", color: "#666" }}>STATUS</div>
          <div className="stat-val" style={{ color: "green" }}>
            Active
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: "auto" }}>
        <button
          className="action-btn"
          onClick={() =>
            openWindow({
              name: "Progress",
              content: () => (
                <div style={{ padding: 20 }}>
                  <h3>User Progress</h3>
                  <p>Graphs and charts go here...</p>
                </div>
              ),
            })
          }
        >
          📊 View Progress
        </button>

        <button
          className="action-btn"
          onClick={() =>
            openWindow({
              name: "History",
              content: () => (
                <div style={{ padding: 20 }}>
                  <h3>Activity History</h3>
                  <ul>
                    <li>Login: Today</li>
                    <li>Exam Prep: Yesterday</li>
                  </ul>
                </div>
              ),
            })
          }
        >
          🕒 View History
        </button>

        <button
          className="action-btn"
          onClick={() => alert("Notes App Opening...")}
        >
          📝 My Notes
        </button>

        <button
          className="action-btn"
          style={{ borderLeft: "4px solid gold" }}
          onClick={() => setShowMemory(!showMemory)}
        >
          🧠 {showMemory ? "Hide Memory" : "View Memory Bank"}
        </button>
      </div>

      {/* Side Panel - Loads point wise */}
      {showMemory && (
        <div className="memory-panel">
          <h4
            style={{
              margin: "0 0 10px 0",
              borderBottom: "1px dashed #aaa",
            }}
          >
            User Context
          </h4>
          {memories.map((m, i) => (
            <div
              key={i}
              className="memory-item"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              • {m}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
