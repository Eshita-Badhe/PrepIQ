// src/apps/ExplorerApp.jsx
import React, { useEffect, useState } from "react";
import FileViewerApp from "./FileViewerApp";

export function Explorer({ openWindow }) {
  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [folderError, setFolderError] = useState("");

  const [selectedFolder, setSelectedFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileError, setFileError] = useState("");

  // Load folders
  useEffect(() => {
    async function loadFolders() {
      try {
        const res = await fetch("http://localhost:5000/api/user-folders", {
          credentials: "include",
        });
        const data = await res.json();
        if (!data.success) setFolderError(data.msg || "Failed to load folders");
        else setFolders(data.folders || []);
      } catch (e) {
        setFolderError("Network error: " + e.message);
      } finally {
        setLoadingFolders(false);
      }
    }
    loadFolders();
  }, []);

  // Load files in a folder
  async function openFolder(title) {
    setSelectedFolder(title);
    setFiles([]);
    setFileError("");
    setLoadingFiles(true);
    try {
      const params = new URLSearchParams({ title });
      const res = await fetch(
        "http://localhost:5000/api/user-folder-files?" + params.toString(),
        { credentials: "include" }
      );
      const data = await res.json();
      if (!data.success) setFileError(data.msg || "Failed to load files");
      else setFiles(data.files || []);
    } catch (e) {
      setFileError("Network error: " + e.message);
    } finally {
      setLoadingFiles(false);
    }
  }

  // Open file in new window
  function openFile(file) {
    console.log("Opening file window for:", file);
    openWindow({
      name: file.name,
      content: () => (
        <FileViewerApp
          fullPath={file.full_path}
          fileName={file.name}
        />
      ),
    });
  }

  return (
    <div style={{ display: "flex", height: "100%", fontSize: 13 }}>
      {/* Folders */}
      <div
        style={{
          width: 220,
          borderRight: "1px solid #ddd",
          padding: 8,
          overflowY: "auto",
        }}
      >
        <h4>My Resources</h4>
        {loadingFolders && <div>Loading folders...</div>}
        {folderError && <div style={{ color: "red" }}>{folderError}</div>}
        {!loadingFolders && !folderError && folders.length === 0 && (
          <div style={{ color: "#666" }}>No folders yet.</div>
        )}
        {folders.map((title) => (
          <div
            key={title}
            onDoubleClick={() => openFolder(title)}
            style={{
              padding: "6px 8px",
              borderRadius: 4,
              cursor: "pointer",
              background:
                selectedFolder === title
                  ? "rgba(50,120,220,0.15)"
                  : "transparent",
            }}
          >
            📁 {title}
          </div>
        ))}
      </div>

      {/* Files */}
      <div style={{ flex: 1, padding: 8, overflowY: "auto" }}>
        <h4>
          {selectedFolder ? `Files in "${selectedFolder}"` : "Select a folder"}
        </h4>
        {selectedFolder && loadingFiles && <div>Loading files...</div>}
        {selectedFolder && fileError && (
          <div style={{ color: "red" }}>{fileError}</div>
        )}
        {selectedFolder && !loadingFiles && !fileError && files.length === 0 && (
          <div style={{ color: "#666" }}>No files in this folder.</div>
        )}
        {selectedFolder && files.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {files.map((f) => (
              <li
                key={f.full_path}
                style={{ marginBottom: 4, cursor: "pointer" }}
                onDoubleClick={() => openFile(f)}
              >
                📄 {f.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
