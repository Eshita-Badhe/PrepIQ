import { useState, useRef } from "react";

export function useWindowManager() {
  const [wins, setWins] = useState([]);
  const [z, setZ] = useState([]); // Z-index stack
  const next = useRef(1);

  function openWindow({ name, content, w = 520, h = 400, centered = true }) {
    const id = next.current++;
    const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
    const winH = typeof window !== "undefined" ? window.innerHeight : 800;
    // Random offset so windows don't stack perfectly on top of each other
    const x = centered ? Math.max(20, (winW - w) / 2 + (Math.random() - 0.5) * 40) : 120 + Math.random() * 200;
    const y = centered ? Math.max(20, (winH - h) / 2 + (Math.random() - 0.5) * 40) : 80 + Math.random() * 120;
    
    const win = { id, name, content, x, y, w, h, state: "normal" };
    setWins((s) => [...s, win]);
    setZ((s) => [...s, id]);
    return id;
  }

  function closeWindow(id) { 
    setWins((s) => s.filter((w) => w.id !== id)); 
    setZ((s) => s.filter((x) => x !== id)); 
  }

  function minimizeWindow(id) { 
    setWins((s) => s.map((w) => (w.id === id ? { ...w, state: "minimized" } : w))); 
  }

  function maximizeWindow(id) { 
    setWins((s) => s.map((w) => (w.id === id ? { ...w, state: w.state === "maximized" ? "normal" : "maximized" } : w))); 
    focusWindow(id);
  }

  function focusWindow(id) { 
    setZ((s) => [...s.filter((x) => x !== id), id]); 
  }

  function updateWindow(id, patch) { 
    setWins((s) => s.map((w) => (w.id === id ? { ...w, ...patch } : w))); 
  }

  return { wins, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindow, z };
}
