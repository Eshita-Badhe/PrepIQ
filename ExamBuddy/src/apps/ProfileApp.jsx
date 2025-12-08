// src/apps/ProfileApp.jsx
import React, { useState, useEffect } from "react";
import userImg from "../assets/user.png";

export default function ProfileApp({ openWindow }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [showMemory, setShowMemory] = useState(false);
  const [memories, setMemories] = useState([]);

  // local form state for "Complete your profile"
  const [profileForm, setProfileForm] = useState({
    name: "",
    role: "",
    details: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

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
          // fallback mock
          const fallback = {
            name: "USER",
            role: "Student",
            streak: 0,
            lastSeen: "Today",
            details: "",
            isComplete: false,
          };
          setUser(fallback);
          setProfileForm({
            name: fallback.name,
            role: fallback.role,
            details: fallback.details,
          });
        } else {
          setUser(data.profile);
          setProfileForm({
            name: data.profile.name || "",
            role: data.profile.role || "Student",
            details: data.profile.details || "",
          });
        }
      } catch (e) {
        setError("Network error: " + e.message);
        const fallback = {
          name: "USER",
          role: "Student",
          streak: 0,
          lastSeen: "Today",
          details: "",
          isComplete: false,
        };
        setUser(fallback);
        setProfileForm({
          name: fallback.name,
          role: fallback.role,
          details: fallback.details,
        });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

// 2. Load memories point-wise (real backend now)
useEffect(() => {
  async function loadMemories() {
    if (!showMemory) return;

    try {
      const res = await fetch("http://localhost:5000/api/memories", {
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) {
        console.error("Failed to load memories:", data.msg);
        return;
      }
      const storedMemories = data.memories || [];
      setMemories([]);
      storedMemories.forEach((mem, index) => {
        setTimeout(() => {
          setMemories((prev) => [...prev, mem]);
        }, index * 400);
      });
    } catch (e) {
      console.error("Memory fetch error:", e);
    }
  }
  loadMemories();
}, [showMemory]);


  if (loading) return <div>Loading user profile...</div>;
  if (!user) return <div>Unable to load profile. {error}</div>;

  // open "Complete Profile" window
  function openProfileFormWindow() {
    openWindow({
      name: "Complete Profile",
      content: () => (
        <div style={{ padding: 20, fontSize: 12 }}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Complete your profile</h3>

          <div className="form-group" style={{ marginBottom: 8 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Full Name</label>
            <input
              style={{ width: "100%" }}
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>

          <div className="form-group" style={{ marginBottom: 8 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Role</label>
            <input
              style={{ width: "100%" }}
              value={profileForm.role}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, role: e.target.value }))
              }
            />
          </div>

          <div className="form-group" style={{ marginBottom: 8 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              Details / Tagline
            </label>
            <input
              style={{ width: "100%" }}
              value={profileForm.details}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, details: e.target.value }))
              }
            />
          </div>

          <button
            className="action-btn"
            disabled={savingProfile}
            onClick={async () => {
              setSavingProfile(true);
              try {
                const res = await fetch("http://localhost:5000/api/profile", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify(profileForm),
                });
                const data = await res.json();
                if (data.success) {
                  alert("Profile updated");
                  // refresh local user object
                  setUser((u) =>
                    u
                      ? {
                          ...u,
                          name: profileForm.name,
                          role: profileForm.role,
                          details: profileForm.details,
                          isComplete:
                            profileForm.name.trim() &&
                            profileForm.role.trim() &&
                            profileForm.details.trim(),
                        }
                      : u
                  );
                } else {
                  alert(data.msg || "Failed to update profile");
                }
              } catch (err) {
                alert("Network error: " + err.message);
              } finally {
                setSavingProfile(false);
              }
            }}
          >
            💾 Save
          </button>
        </div>
      ),
    });
  }

  // delete account
  async function handleDeleteAccount() {
    const ok = window.confirm(
      "This will permanently delete your account, chats, and profile. Continue?"
    );
    if (!ok) return;

    try {
      const res = await fetch("http://localhost:5000/api/delete-account", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        alert("Account deleted. You will be logged out.");
        window.location.href = "/"; // or login page
      } else {
        alert(data.msg || "Failed to delete account");
      }
    } catch (err) {
      alert("Network error: " + err.message);
    }
  }

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
          onError={(e) => (e.target.src = "https://via.placeholder.com/64")}
        />
        <div>
          <h3 style={{ margin: "0 0 4px 0" }}>{user.name}</h3>
          <div style={{ color: "#666", fontSize: "12px" }}>{user.role}</div>
          <div style={{ color: "#2f6ab8", fontSize: "12px" }}>
            {user.details}
          </div>
          <div style={{ color: "#888", fontSize: "11px", marginTop: 4 }}>
            Last seen: {user.lastSeen}
          </div>
          {error && (
            <div style={{ color: "red", fontSize: "11px", marginTop: 4 }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ fontSize: "11px", color: "#666" }}>CURRENT STREAK</div>
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

        {!user.isComplete && (
          <button className="action-btn" onClick={openProfileFormWindow}>
            🧩 Complete your Profile
          </button>
        )}

        <button
          className="action-btn"
          style={{ borderLeft: "4px solid gold" }}
          onClick={() => setShowMemory(!showMemory)}
        >
          🧠 {showMemory ? "Hide Memory" : "View Memory Bank"}
        </button>

        <button
          className="action-btn"
          style={{ borderLeft: "4px solid red", marginTop: 8 }}
          onClick={handleDeleteAccount}
        >
          ⚠️ Delete Account
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
