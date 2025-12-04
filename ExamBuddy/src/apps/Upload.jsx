// src/UploadDocs.jsx
import React, { useState } from "react";

export default function UploadDocs({ username }) {
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState(""); // "ok" | "err"

  function handleFileChange(e) {
    setFiles([...e.target.files]);
  }

  async function handleSubmit(e) {
    setStatus("Uploading...")
    e.preventDefault();
    if (!username || !title || files.length === 0) {
      setStatusType("err");
      setStatus("Please provide title and at least one file.");
      return;
    }
    const formData = new FormData();
    formData.append("username", username);
    formData.append("title", title);
    formData.append("root_type", "uploaded"); 
    files.forEach((f) => formData.append("files", f));
    try {
      const res = await fetch("http://localhost:5000/api/upload-docs", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setStatusType("ok");
        setStatus("Uploaded successfully!");
      } else {
        setStatusType("err");
        setStatus("Upload failed: " + (data.msg || "Unknown error"));
      }
    } catch (err) {
      setStatusType("err");
      setStatus("Network error: " + err.message);
    }
  }

  return (
    <div className="upload-panel">
      <h3 className="upload-title">Upload Resources</h3>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="upload-field">
          <label htmlFor="upload-title">Title</label>
          <input
            id="upload-title"
            className="upload-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Cloud Computing notes"
          />
        </div>

        <div className="upload-field">
          <label htmlFor="upload-files">Files</label>
          <input
            id="upload-files"
            type="file"
            multiple
            className="upload-file-input"
            onChange={handleFileChange}
          />
        </div>

        <button type="submit" className="upload-submit">
          Upload
        </button>
      </form>

      {status && (
        <div className={`upload-status ${statusType}`}>
          {status}
        </div>
      )}
    </div>
  );
}
