// src/apps/GenerateMindMap.jsx
import React, { useState } from "react";

const API_BASE = "http://localhost:5000"; // your Flask base

export default function GenerateMindMap({ username = "User" }) {
  const [topic, setTopic] = useState("");
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [mindmapJson, setMindmapJson] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username || "User",
          mode: "mindmap",
          topic: topic.trim(),
          extra: extra || "Focus on exam-important definitions and algorithms.",
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Mind map generation failed.");
      }
      // data.mindmap is JSON tree; data.pdf_url is Supabase PDF URL
      setMindmapJson(data.mindmap || null);
      setPdfUrl(data.pdf_url || null);
      setHasGenerated(true);
    } catch (e) {
      console.error(e);
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    // Same as generate, just allow user to tweak extra instructions and overwrite
    await handleGenerate();
  };

  const renderNode = (node, depth = 0) => {
    if (!node) return null;
    return (
      <div key={node.id || node.label + depth} style={{ marginLeft: depth * 16 }}>
        <div
          style={{
            padding: "4px 8px",
            borderRadius: 6,
            background: depth === 0 ? "#2563eb" : "#e5e7eb",
            color: depth === 0 ? "#fff" : "#111827",
            fontWeight: depth === 0 ? 600 : 500,
            display: "inline-block",
            marginBottom: 4,
          }}
        >
          {node.label}
        </div>
        {Array.isArray(node.children) &&
          node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: 16,
        background: "#f3f4f6",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, marginBottom: 4 }}>🧠 Generate Mind Map</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#4b5563" }}>
          Enter a topic and optional extra instructions to create a mind map.
          A PDF will be saved to Supabase and can be downloaded.
        </p>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
          Topic
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Operating System Deadlock"
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 14,
          }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
          Extra instructions (optional)
        </label>
        <textarea
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          rows={3}
          placeholder="e.g. Focus on exam-important points, add examples under each subtopic."
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            fontSize: 14,
            resize: "vertical",
          }}
        />
      </div>

      {error && (
        <div
          style={{
            marginBottom: 10,
            padding: 8,
            borderRadius: 6,
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontSize: 14,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Generating..." : hasGenerated ? "Update Mind Map" : "Generate Mind Map"}
        </button>
        {hasGenerated && (
          <button
            onClick={handleRegenerate}
            disabled={loading}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #9ca3af",
              background: "#fff",
              color: "#374151",
              fontSize: 14,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            Regenerate with changes
          </button>
        )}
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #10b981",
              background: "#ecfdf5",
              color: "#047857",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            ⬇ Download Mind Map PDF
          </a>
        )}
      </div>

      <div
        style={{
          flex: 1,
          borderRadius: 8,
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          padding: 12,
          overflow: "auto",
        }}
      >
        <h3 style={{ marginTop: 0, fontSize: 14, marginBottom: 8 }}>
          Mind Map Preview
        </h3>
        {!mindmapJson ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            Mind map structure will appear here after generation.
          </p>
        ) : (
          renderNode(mindmapJson, 0)
        )}
      </div>
    </div>
  );
}
