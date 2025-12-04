// src/apps/ExplorerApp.jsx
import React, { useEffect, useState } from "react";
import FileViewerApp from "./FileViewerApp";

const ROOTS = [
  { id: "uploaded", label: "Uploaded" },
  { id: "generated_notes", label: "Generated Notes" },
  { id: "generated_sample_papers", label: "Sample Papers" },
];

export function Explorer({ openWindow }) {
  const [selectedRoot, setSelectedRoot] = useState("uploaded");
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState("");

  // Load folders whenever root changes
  useEffect(() => {
    loadRootFolders(selectedRoot);
  }, [selectedRoot]);

  async function loadRootFolders(rootType) {
    setLoadingFolders(true);
    setError("");
    setFolders([]);
    setFiles([]);
    setSelectedFolder(null);

    try {
      const params = new URLSearchParams({ root_type: rootType });
      const res = await fetch(
        "http://localhost:5000/api/list-root-folders?" + params.toString(),
        { credentials: "include" }
      );
      const data = await res.json();
      if (!data.success) setError(data.msg || "Failed to load folders");
      else setFolders(data.folders || []);
    } catch (e) {
      setError("Network error: " + e.message);
    } finally {
      setLoadingFolders(false);
    }
  }

  async function openFolder(folder) {
    setSelectedFolder(folder);
    setFiles([]);
    setError("");
    setLoadingFiles(true);

    try {
      const params = new URLSearchParams({
        root_type: selectedRoot,
        folder,
      });
      const res = await fetch(
    "http://localhost:5000/api/list-root-folder-files?" + params.toString(),
    { credentials: "include" }
  );
      const data = await res.json();
      if (!data.success) setError(data.msg || "Failed to load files");
      else setFiles(data.files || []);
    } catch (e) {
      setError("Network error: " + e.message);
    } finally {
      setLoadingFiles(false);
    }
  }

  function openFile(file) {
    openWindow({
      name: file.name,
      content: () => (
        <FileViewerApp fullPath={file.full_path} fileName={file.name} />
      ),
    });
  }

  return (
    <div style={{ display: "flex", height: "100%", fontSize: 13 }}>
      {/* Column 1: Roots */}
      <div
        style={{
          width: 180,
          borderRight: "1px solid #ddd",
          padding: 8,
          overflowY: "auto",
        }}
      >
        {ROOTS.map((root) => (
          <div
            key={root.id}
            onClick={() => setSelectedRoot(root.id)}
            style={{
              padding: "6px 8px",
              borderRadius: 4,
              cursor: "pointer",
              background:
                selectedRoot === root.id
                  ? "rgba(50,120,220,0.15)"
                  : "transparent",
            }}
          >
            📁 {root.label}
          </div>
        ))}
      </div>

      {/* Column 2: Folders for selected root */}
      <div
        style={{
          width: 220,
          borderRight: "1px solid #ddd",
          padding: 8,
          overflowY: "auto",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>
          {ROOTS.find((r) => r.id === selectedRoot)?.label}
        </div>

        {loadingFolders && <div>Loading folders...</div>}

        {error && (
          <div style={{ color: "red", marginBottom: 4 }}>{error}</div>
        )}

        {!loadingFolders && !error && folders.length === 0 && (
          <div style={{ color: "#666" }}>No folders yet.</div>
        )}

        {folders.map((folder) => (
          <div
            key={folder}
            onDoubleClick={() => openFolder(folder)}
            style={{
              padding: "6px 8px",
              borderRadius: 4,
              cursor: "pointer",
              background:
                selectedFolder === folder
                  ? "rgba(50,120,220,0.15)"
                  : "transparent",
            }}
          >
            📁 {folder}
          </div>
        ))}
      </div>

      {/* Column 3: Files in selected folder */}
      <div style={{ flex: 1, padding: 8, overflowY: "auto" }}>
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>
          {selectedFolder || "No folder selected"}
        </div>

        {selectedFolder && loadingFiles && <div>Loading files...</div>}

        {selectedFolder && !loadingFiles && files.length === 0 && !error && (
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
