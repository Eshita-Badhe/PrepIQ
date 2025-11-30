// src/UploadDocs.jsx
import React, { useState } from "react";

export default function UploadDocs({ username }) {
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");

  function handleFileChange(e) {
    setFiles([...e.target.files]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !title || files.length === 0) {
      setStatus("Please provide title and files.");
      return;
    }
    const formData = new FormData();
    formData.append("username", username);
    formData.append("title", title);
    files.forEach(f => formData.append("files", f));

    try {
      const res = await fetch("http://localhost:5000/api/upload-docs", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setStatus("Uploaded successfully!");
      } else {
        setStatus("Upload failed: " + (data.msg || "Unknown error"));
      }
    } catch (err) {
      setStatus("Network error: " + err.message);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h3>Upload Resources</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title: </label>
          <input value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Files: </label>
          <input type="file" multiple onChange={handleFileChange} />
        </div>
        <button type="submit" style={{ marginTop: 12 }}>Upload</button>
      </form>
      {status && <div style={{ marginTop: 8 }}>{status}</div>}
    </div>
  );
}
