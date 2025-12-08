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
    if (fullPath) loadUrl();
  }, [fullPath]);

  if (error) {
    return (
      <div className="app-shell file-viewer-app">
        <h2>File Viewer</h2>
        <div className="app-section">
          <p style={{ color: "#fecaca" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="app-shell file-viewer-app">
        <h2>File Viewer</h2>
        <div className="app-section">
          <p>Loading file...</p>
        </div>
      </div>
    );
  }

  const isPdf = fileName.toLowerCase().endsWith(".pdf");

  return (
    <div className="app-shell file-viewer-app">
      <div className="file-viewer-header">
        <div>
          <span className="app-badge">Preview</span>
        </div>
        <a
          className="app-button secondary"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          ⬇ Open / Download
        </a>
      </div>

      <div className="app-section file-viewer-body">
        {isPdf ? (
          <iframe
            src={url}
            title={fileName}
            className="file-viewer-frame"
          />
        ) : (
          <div className="file-viewer-fallback">
            <p>
              This file type cannot be previewed here. Use the button above to
              open or download it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
