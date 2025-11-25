import React, { useState } from "react";
import { Rnd } from "react-rnd";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function Win7Window({ title, children, onClose }) {
  const [isMinimized, setMinimized] = useState(false);
  const [isMaximized, setMaximized] = useState(false);

  const handleMinimize = () => setMinimized(true);
  const handleMaximize = () => setMaximized(!isMaximized);
  const handleRestore = () => setMinimized(false);

  return !isMinimized ? (
    <Rnd
      dragHandleClassName="win7-title"
      enableResizing={!isMaximized}
      style={{
        zIndex: 999,
        position: "fixed",
        boxShadow: "0 6px 15px #224",
        borderRadius: "5px",
        border: "2px solid #acf",
        background: "linear-gradient(#e3ecfc, #dde9fc)",
        ...(isMaximized
          ? {
              top: 0,
              left: 0,
              width: "100vw",
              height: "calc(100vh - 38px)"
            }
          : {})
      }}
      default={{
        x: 120,
        y: 120,
        width: 360,
        height: 320
      }}
    >
      <div className="win7-window">
        <div className="win7-title">
          <span>{title}</span>
          <div className="window-buttons">
            <button onClick={handleMinimize}>_</button>
            <button onClick={handleMaximize}>{isMaximized ? "❐" : "□"}</button>
            <button onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="win7-content">{children}</div>
      </div>
    </Rnd>
  ) : (
    <div className="win7-taskbar-app" onClick={handleRestore}>
      {title}
    </div>
  );
}

function Notepad() {
  const [text, setText] = useState(localStorage.getItem("notepad") || "");
  return (
    <div>
      <textarea
        value={text}
        spellCheck
        autoFocus
        style={{ width: "100%", height: "160px" }}
        onChange={e => setText(e.target.value)}
      />
      <button
        onClick={() => localStorage.setItem("notepad", text)}
        style={{ marginTop: 8, float: "right" }}
      >
        Save
      </button>
    </div>
  );
}

function Calculator() {
  const [input, setInput] = useState("");
  function press(val) {
    if (val === "C") setInput("");
    else if (val === "=") {
      try {
        setInput(eval(input).toString());
      } catch {
        setInput("Error");
      }
    } else setInput(input + val);
  }
  return (
    <div>
      <input value={input} readOnly style={{ width: "80%", margin: "10px" }} />
      <div>
        {["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", "C", "=", "+"].map(v => (
          <button key={v} onClick={() => press(v)} style={{ width: "2rem", margin: 2 }}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function YearCalendar() {
  const [date, setDate] = useState(new Date());
  return (
    <Calendar
      value={date}
      onChange={setDate}
      view="year"
      selectRange={false}
      calendarType="ISO 8601"
      className="calendar-year"
    />
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [windows, setWindows] = useState([]);

  const openWindow = type => {
    setMenuOpen(false);
    setWindows([...windows, { id: Date.now(), type }]);
  };

  const closeWindow = id => setWindows(windows.filter(w => w.id !== id));

  return (
    <div className="app-bg">
      {/* Start Menu */}
      {menuOpen && (
        <div className="win7-startmenu">
          <div className="menu-header">Windows 7</div>
          <div className="menu-items">
            <button onDoubleClick={() => openWindow("notepad")}>Notepad</button>
            <button onDoubleClick={() => openWindow("calculator")}>Calculator</button>
            <button onDoubleClick={() => openWindow("calendar")}>Calendar</button>
          </div>
        </div>
      )}
      {/* Windows */}
      {windows.map(w => (
        <Win7Window
          key={w.id}
          title={w.type === "notepad" ? "Notepad" : w.type === "calculator" ? "Calculator" : "Calendar"}
          onClose={() => closeWindow(w.id)}
        >
          {w.type === "notepad" && <Notepad />}
          {w.type === "calculator" && <Calculator />}
          {w.type === "calendar" && <YearCalendar />}
        </Win7Window>
      ))}

      {/* Taskbar */}
      <div className="win7-taskbar">
        <div
          className="win7-startbtn"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/3b/Windows_7_Logo.svg"
            alt="win7"
            width={32}
          />
        </div>
        <div className="taskbar-icons">
          <div
            title="Notepad"
            style={{ margin: 5 }}
            onDoubleClick={() => openWindow("notepad")}
            onMouseEnter={e => (e.target.style.opacity = 0.5)}
            onMouseLeave={e => (e.target.style.opacity = 1)}
          >📝</div>
          <div
            title="Calculator"
            style={{ margin: 5 }}
            onDoubleClick={() => openWindow("calculator")}
            onMouseEnter={e => (e.target.style.opacity = 0.5)}
            onMouseLeave={e => (e.target.style.opacity = 1)}
          >🧮</div>
          <div
            title="Calendar"
            style={{ margin: 5 }}
            onDoubleClick={() => openWindow("calendar")}
            onMouseEnter={e => (e.target.style.opacity = 0.5)}
            onMouseLeave={e => (e.target.style.opacity = 1)}
          >📅</div>
        </div>
        <div style={{ marginLeft: "auto", marginRight: 20 }}>
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
      {/* Styles */}
      <style>{`
        .app-bg {
          background: url("https://wallpapercave.com/wp/wp4092580.jpg");
          min-height: 100vh;
          position: relative;
          font-family: Segoe UI, Arial;
        }
        .win7-startbtn {
          background: linear-gradient(#e5f6ff, #b8e2fc);
          border-radius: 50%;
          box-shadow: 0 2px 8px #224;
          cursor: pointer;
          margin: 5px;
        }
        .win7-taskbar {
          background: linear-gradient(#e3ecfc, #a1c6ee);
          position: fixed;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 38px;
          display: flex;
          align-items: center;
          box-shadow: 0 -3px 10px #224;
          z-index: 1000;
        }
        .win7-startmenu {
          position: fixed;
          left: 10px;
          bottom: 58px;
          width: 250px;
          background: linear-gradient(#d8eafe, #c3d1fa);
          border-radius: 10px;
          box-shadow: 0 6px 20px #333;
          border: 2px solid #acf;
          z-index: 9999;
        }
        .menu-header {
          font-size: 1.2em;
          font-weight: bold;
          margin: 10px;
        }
        .menu-items button {
          display: block;
          width: 90%;
          margin: 10px auto;
          font-size: 1em;
          padding: 5px;
          border-radius: 4px;
          background: #e3ecfc;
          border: 1px solid #ccd8ee;
          cursor: pointer;
        }
        .menu-items button:hover {
          opacity: 0.5;
          background: #b5d5fd;
        }
        .win7-window {
          width: 100%;
          height: 100%;
          background: transparent;
          display: flex;
          flex-direction: column;
        }
        .win7-title {
          background: linear-gradient(#f3f9ff 60%, #cbd6ec 100%);
          padding: 3px 8px;
          border-bottom: 1px solid #7faaff;
          font-weight: bold;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 5px 5px 0 0;
          cursor: pointer;
        }
        .window-buttons button {
          background: #e3ecfc;
          border: 1px solid #7faafc;
          border-radius: 2px;
          margin-left: 3px;
          width: 24px;
          height: 24px;
          font-size: 1em;
          cursor: pointer;
        }
        .window-buttons button:hover {
          background: #b0d4fa;
          opacity: 0.5;
        }
        .win7-content {
          padding: 10px;
          background: white;
          border-radius: 0 0 5px 5px;
          height: 85%;
          overflow: auto;
        }
        .win7-taskbar-app {
          background: #aac5e6;
          border-radius: 2px;
          padding: 2px 10px;
          display: inline-block;
          margin: 5px;
          cursor: pointer;
          opacity: 0.6;
        }
        .taskbar-icons > div {
          display: inline-block;
          font-size: 1.3em;
          padding: 2px 8px;
          border-radius: 3px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .calendar-year {
          border: none;
          background: none;
        }
      `}
      </style>
    </div>
  );
}
