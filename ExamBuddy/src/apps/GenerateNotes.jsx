// src/apps/GenerateNotes.jsx
import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ---------- helpers for styled notes ----------

function highlightKeywords(text) {
  // **keyword** → bold purple
  return text.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const clean = part.slice(2, -2);
      return (
        <span
          key={idx}
          style={{
            fontWeight: 700,
            color: "#4C1D95",
          }}
        >
          {clean}
        </span>
      );
    }
    return part;
  });
}

function renderLine(line, index) {
  if (line.startsWith("# ")) {
    return (
      <h2
        key={index}
        style={{
          margin: "10px 0 4px",
          fontSize: 18,
          color: "#1D4ED8",
          borderBottom: "2px solid rgba(59,130,246,0.25)",
          paddingBottom: 4,
        }}
      >
        {line.replace("# ", "")}
      </h2>
    );
  }

  if (line.startsWith("## ")) {
    return (
      <h3
        key={index}
        style={{
          margin: "8px 0 4px",
          fontSize: 15,
          color: "#4338CA",
        }}
      >
        {line.replace("## ", "")}
      </h3>
    );
  }

  if (line.trim().startsWith("- ")) {
    return (
      <li
        key={index}
        style={{
          marginLeft: 18,
          marginBottom: 4,
          color: "#111827",
        }}
      >
        {/* hide "-" and show bullet dot */}
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#6366F1",
            marginRight: 6,
            position: "relative",
            top: -1,
          }}
        />
        {highlightKeywords(line.trim().replace("- ", ""))}
      </li>
    );
  }

  if (line.trim() === "") {
    return <div key={index} style={{ height: 6 }} />;
  }

  return (
    <p
      key={index}
      style={{
        margin: "2px 0",
        fontSize: 13,
        lineHeight: 1.5,
        color: "#111827",
      }}
    >
      {highlightKeywords(line)}
    </p>
  );
}

function StyledNotes({ notes, noteFormat }) {
  const lines = notes.split("\n");

  // ---------- mind map layout ----------
  if (noteFormat === "mindmap") {
    const blocks = notes
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean);

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        {blocks.map((block, idx) => {
          const blockLines = block.split("\n");
          const titleLine =
            blockLines[0].startsWith("#") || blockLines[0].startsWith("*")
              ? blockLines[0]
              : null;
          const rest = titleLine ? blockLines.slice(1) : blockLines;

          const rotation =
            idx % 3 === 0 ? "-1.5deg" : idx % 3 === 1 ? "1deg" : "0deg";

          return (
            <div
              key={idx}
              style={{
                minWidth: 210,
                maxWidth: 260,
                borderRadius: 14,
                border: "1px solid rgba(129,140,248,0.8)",
                background:
                  "radial-gradient(circle at top left, rgba(59,130,246,0.10), rgba(124,58,237,0.03))",
                padding: "10px 14px",
                boxShadow: "0 10px 24px rgba(15,23,42,0.14)",
                position: "relative",
                transform: `rotate(${rotation})`,
              }}
            >
              {/* connector dot */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#4C1D95",
                  position: "absolute",
                  top: 8,
                  right: 8,
                }}
              />
              {titleLine && (
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#1D4ED8",
                    marginBottom: 6,
                    letterSpacing: 0.3,
                  }}
                >
                  {titleLine.replace(/^(\*|#+)\s*/, "")}
                </div>
              )}
              {rest.map((ln, i) =>
                ln.trim() ? (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      marginBottom: 4,
                      color: "#111827",
                    }}
                  >
                    {highlightKeywords(ln.replace(/^(\*|-)\s*/, ""))}
                  </div>
                ) : (
                  <div key={i} style={{ height: 4 }} />
                )
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ---------- other formats ----------
  return (
    <div
      style={{
        borderRadius: 8,
        border: "1px solid #E5E7EB",
        padding: 12,
        background:
          "linear-gradient(135deg, rgba(59,130,246,0.02), rgba(124,58,237,0.04))",
      }}
    >
      <ul style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}>
        {lines.map((line, idx) => (
          <React.Fragment key={idx}>{renderLine(line, idx)}</React.Fragment>
        ))}
      </ul>
    </div>
  );
}

// ---------- main component ----------

export default function GenerateNotes({ username }) {
  const API_BASE = "http://localhost:5000";

  const [topic, setTopic] = useState("");
  const [noteFormat, setNoteFormat] = useState("standard");
  const [customPrompt, setCustomPrompt] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState(""); // "ok" | "err"
  const [loading, setLoading] = useState(false);

  const previewRef = useRef(null); // for PDF capture

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

  // styled PDF (screenshot of preview)
const handleDownloadPdf = async () => {
  if (!notes.trim()) {
    setStatusType("err");
    setStatus("Generate notes before downloading.");
    return;
  }

  try {
    const node = previewRef.current;

    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    }); // high‑res capture [web:21][web:23]

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 20;        // 10mm left/right margin
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    // first page
    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // add extra pages for remaining content
    while (heightLeft > 0) {
      pdf.addPage();
      position = heightLeft - imgHeight + 10; // move image up so the next slice is visible
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${topic.replace(/\s+/g, "_")}_notes.pdf`);
    setStatusType("ok");
    setStatus("Notes downloaded as styled PDF (full content).");
  } catch (err) {
    console.error("PDF error:", err);
    setStatusType("err");
    setStatus("Failed to generate complete PDF.");
  }
};

  const handleOpenChatbot = () => {
    if (!notes.trim()) {
      setStatusType("err");
      setStatus("Generate notes before chatting.");
      return;
    }

    window.dispatchEvent(
      new CustomEvent("openChatbot", {
        detail: { username },
      })
    );
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.split}>
        {/* Left: form */}
        <div style={styles.leftPane}>
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
                  style={styles.secondaryButton}
                  onClick={handleDownloadPdf}
                >
                  Download Notes (PDF)
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
          <div
            ref={previewRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 16,
              borderRadius: 10,
              background: "#F9FAFB",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 750, maxWidth: "100%" }}>
              {notes ? (
                <StyledNotes notes={notes} noteFormat={noteFormat} />
              ) : (
                <p style={styles.previewPlaceholder}>
                  Generated notes will appear here in a clean, readable format.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  split: {
    display: "flex",
    gap: 8,
    height: "100%",
    maxHeight: "calc(100vh - 80px)",
  },

  leftPane: {
    flex: "0 0 30%",       // basis = 30%, no grow
    background: "#ffffff",
    borderRadius: 8,
    padding: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
  },

  rightPane: {
    flex: "0 0 70%",       // basis = 70%, no grow
    background: "#ffffff",
    borderRadius: 8,
    padding: 12,
    boxShadow: "0 1px 4px rgba(15,23,42,0.12)",
    display: "flex",
    flexDirection: "column",
  },
  title: {
    margin: 0,
    fontSize: 18,
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 13,
    color: "#6B7280",
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
    color: "#374151",
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
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
    fontWeight: 700,
    color: "#1D4ED8",
  },
  previewPlaceholder: {
    fontSize: 13,
    color: "#9CA3AF",
  },
};
