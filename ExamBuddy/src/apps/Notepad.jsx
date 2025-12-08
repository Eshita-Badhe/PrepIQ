// NotepadApp.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/app.css";

export default function NotepadApp() {
  const [content, setContent] = useState("");
  const [style, setStyle] = useState({
    color: "#000000",
    fontFamily: "Arial",
    fontSize: 16,
  });

  useEffect(() => {
    axios.get("/api/notepad").then((res) => {
      setContent(res.data.content || "");
      setStyle(res.data.style || style);
    });
  }, []);

  const saveNote = async () => {
    await axios.post("/api/notepad", { content, style });
  };

  const downloadNote = async () => {
    const res = await axios.get("/api/notepad/download", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "note.txt";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="notepad-app">
      <h2>Notepad</h2>

      <section>
        <h3>Style</h3>
        <label>
          Color
          <input
            type="color"
            value={style.color}
            onChange={(e) => setStyle({ ...style, color: e.target.value })}
          />
        </label>
        <label>
          Font
          <select
            value={style.fontFamily}
            onChange={(e) => setStyle({ ...style, fontFamily: e.target.value })}
          >
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier</option>
          </select>
        </label>
        <label>
          Size
          <input
            type="number"
            min={10}
            max={48}
            value={style.fontSize}
            onChange={(e) =>
              setStyle({ ...style, fontSize: Number(e.target.value) })
            }
          />
        </label>
      </section>

      <section>
        <h3>Note</h3>
        <textarea
          style={{
            color: style.color,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            minHeight: "200px",
          }}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </section>

      <section>
        <button onClick={saveNote}>Save</button>
        <button onClick={downloadNote}>Download</button>
      </section>
    </div>
  );
}
