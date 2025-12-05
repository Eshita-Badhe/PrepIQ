// src/apps/GenerateNotes.jsx
import React, { useState } from "react";

export default function GenerateNotes({ username}) {
  const API_BASE = "http://localhost:5000";

  const [topic, setTopic] = useState("");
  const [noteFormat, setNoteFormat] = useState("standard");
  const [customPrompt, setCustomPrompt] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState(""); // "ok" | "err"
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e) => {
  e.preventDefault();
  if (!topic.trim()) {
    setStatusType("err");
    setStatus("Please enter a topic.");
    return;
  }

  setLoading(true);
  setStatus("Generating comprehensive notes...");
  setStatusType("");
  setNotes("");

  try {
    // 🔄 Use NEW dedicated endpoint instead of /chat
    const res = await fetch(`${API_BASE}/api/generate-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        note_format: noteFormat,
        custom_prompt: customPrompt,
        username,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();
    
    if (!data.success || !data.notes) {
      throw new Error(data.error || "No notes generated");
    }

    const generatedNotes = data.notes;
    
    console.log(`✅ Generated ${generatedNotes.length} characters`);
    
    setNotes(generatedNotes);

    if (!statusType || statusType === "ok") {
      setStatusType("ok");
      setStatus(
        `✓ Notes generated successfully (${generatedNotes.length} characters)`
      );
    }
  } catch (err) {
    console.error("Generate error:", err);
    setStatusType("err");
    setStatus(`Failed to generate notes: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  const handleRegenerate = () => {
    // Keep topic/format/customPrompt so user can tweak and regenerate
    setNotes("");
    setStatus("");
    setStatusType("");
  };

  const handleDownloadLocal = () => {
    if (!notes.trim()) {
      setStatusType("err");
      setStatus("Generate notes before downloading.");
      return;
    }
    const fileContent = `Topic: ${topic}\nFormat: ${noteFormat}\n\n${notes}`;
    const blob = new Blob([fileContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${topic.replace(/\s+/g, "_")}_notes.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    setStatusType("ok");
    setStatus("Notes downloaded as text file.");
  };

  // ---------- just open ChatBot app (no upload here) ----------
  const handleOpenChatbot = () => {
    if (!notes.trim()) {
      setStatusType("err");
      setStatus("Generate notes before chatting.");
      return;
    }

    // Let the main app/window manager open the ChatBot window
    window.dispatchEvent(
      new CustomEvent("openChatbot",{
        detail: { username },
      })
    );
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.split}>
        {/* Left: form */}
        <div style={styles.leftPane}>
          <h2 style={styles.title}>Generate Study Notes</h2>
          <p style={styles.subtitle}>
            Enter a topic and generate structured notes. Preview appears on the right.
          </p>

          {status && (
            <div
              style={{
                ...styles.status,
                ...(statusType === "ok" ? styles.statusOk : {}),
                ...(statusType === "err" ? styles.statusErr : {}),
              }}
            >
              {status}
            </div>
          )}

          <form onSubmit={handleGenerate} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Topic *</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Database Management, 3D Avatar Systems"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Note Format</label>
              <select
                value={noteFormat}
                onChange={(e) => setNoteFormat(e.target.value)}
                style={styles.input}
              >
                <option value="detailed">Detailed Point Wise Notes</option>
                <option value="summarization">Summarization</option>
                <option value="cheatsheet">Cheat Sheet</option>
                <option value="mindmap">Mind Maps</option>
                <option value="checklist">Important Topics Checklist</option>
                <option value="qa">Question Answer Format</option>
                <option value="differentiation">Differentiation</option>
                <option value="keywords">Keyword Definition</option>
                <option value="diagrams">Diagrams booklet</option>
                <option value="pyqs">Solved PYQs Booklet</option>
                <option value="practice_papers">Practice Question Papers</option>
              </select>

            </div>

            <div style={styles.field}>
              <label style={styles.label}>Additional Instructions (optional)</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Focus on definitions and diagrams"
                style={{ ...styles.input, height: 80, resize: "vertical" }}
              />
            </div>

            <div style={styles.buttonRow}>
              <button
                type="submit"
                style={styles.primaryButton}
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate Notes"}
              </button>

              {notes && (
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={handleRegenerate}
                >
                  Regenerate Notes
                </button>
              )}
            </div>

            {notes && (
              <div style={{ ...styles.buttonRow, marginTop: 8 }}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={handleDownloadLocal}
                >
                  Download Notes (text)
                </button>
                <button
                  type="button"
                  style={styles.primaryButton}
                  onClick={handleOpenChatbot}
                >
                  Chat with AI
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right: preview */}
        <div style={styles.rightPane}>
          <h3 style={styles.previewTitle}>Preview</h3>
          {notes ? (
            <pre style={styles.previewContent}>{notes}</pre>
          ) : (
            <p style={styles.previewPlaceholder}>
              Generated notes will appear here in a clean, readable format.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    height: "100%",
    padding: 8,
    background: "#f5f5f5",
    boxSizing: "border-box",
    overflow: "auto",
  },
  split: {
    display: "flex",
    gap: 8,
    height: "100%",
    maxHeight: "calc(100vh - 80px)",
  },
  leftPane: {
    flex: 1,
    background: "#ffffff",
    borderRadius: 8,
    padding: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
  },
  rightPane: {
    flex: 1,
    background: "#ffffff",
    borderRadius: 8,
    padding: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
  },
  title: {
    margin: 0,
    fontSize: 18,
    color: "#333",
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 13,
    color: "#777",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#444",
  },
  input: {
    borderRadius: 6,
    border: "1px solid #ddd",
    padding: "8px 10px",
    fontSize: 13,
    fontFamily: "inherit",
  },
  buttonRow: {
    display: "flex",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  primaryButton: {
    borderRadius: 6,
    border: "none",
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    color: "#fff",
    background:
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  secondaryButton: {
    borderRadius: 6,
    border: "1px solid #ccc",
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    color: "#333",
    background: "#f5f5f5",
  },
  status: {
    padding: 8,
    borderRadius: 6,
    fontSize: 12,
    marginBottom: 8,
    borderLeft: "4px solid #ccc",
    background: "#f5f5f5",
    color: "#555",
  },
  statusOk: {
    borderLeftColor: "#28a745",
    background: "#e6f4ea",
    color: "#1e7e34",
  },
  statusErr: {
    borderLeftColor: "#dc3545",
    background: "#f8d7da",
    color: "#842029",
  },
  previewTitle: {
    margin: 0,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: 600,
    color: "#444",
  },
  previewContent: {
    margin: 0,
    fontSize: 13,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    flex: 1,
    overflowY: "auto",
    borderRadius: 6,
    border: "1px solid #e0e0e0",
    padding: 8,
    background: "#fafafa",
  },
  previewPlaceholder: {
    fontSize: 13,
    color: "#999",
  },
};
