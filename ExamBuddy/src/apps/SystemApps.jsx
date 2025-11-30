import React, { useState } from "react";
export function NotepadApp() {
  const [text, setText] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <textarea value={text} onChange={e => setText(e.target.value)} style={{ flex: 1, padding: 8 }} />
    </div>
  );
}
export function BrowserApp() { return <div><h3>Browser</h3></div>; }
export function CalculatorApp() {
  const [expr, setExpr] = useState("");
  const [res, setRes] = useState("");
  function calc() { try { setRes(eval(expr)); } catch { setRes("error"); } }
  return (<div><h3>Calculator</h3><input value={expr} onChange={e => setExpr(e.target.value)} /><button onClick={calc}>=</button><div>Result: {res}</div></div>);
}
export function SystemInfoApp() {
  return (<div><h3>System Info</h3><ul><li>OS: Windows 7 (Sim)</li></ul></div>);
}
