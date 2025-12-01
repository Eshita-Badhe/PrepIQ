// src/apps/FileViewerApp.jsx
import React, { useEffect, useState } from "react";

export default function FileViewerApp({ fullPath, fileName }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUrl() {
      try {
        const params = new URLSearchParams({ path: fullPath });
        const res = await fetch(
          "http://localhost:5000/api/file-url?" + params.toString(),
          { credentials: "include" }
        );
        const data = await res.json();
        if (!data.success) {
          setError(data.msg || "Failed to get file URL");
        } else {
          setUrl(data.url);
        }
      } catch (e) {
        setError("Network error: " + e.message);
      }
    }
    loadUrl();
  }, [fullPath]);

  if (error) return <div style={{ padding: 10, color: "red" }}>{error}</div>;
  if (!url) return <div style={{ padding: 10 }}>Loading file...</div>;

  const isPdf = fileName.toLowerCase().endsWith(".pdf");

  return (
    <div style={{ padding: 10, height: "100%", boxSizing: "border-box" }}>
      <h4>{fileName}</h4>
      <div style={{ marginBottom: 8 }}>
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open / Download in browser
        </a>
      </div>
      {isPdf && (
        <iframe
          src={url}
          title={fileName}
          style={{ width: "100%", height: "80%", border: "1px solid #ccc" }}
        />
      )}
    </div>
  );
}
