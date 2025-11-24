import React, { useEffect, useState, useRef } from 'react';
import './Windows7.css';
import Boot from "./Boot"; 

// reference: https://codepen.io/rajatkantinandi/pen/qxmYYX?utm_source=chatgpt.com

function Windows7BootAnimation() {
  const [done, setDone] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Play audio
    if (audioRef.current) {
      audioRef.current.volume = 1.0;
      audioRef.current.play().catch(() => {
        // Autoplay blocked, wait for click
        window.addEventListener("click", playAudioOnce);
      });
    }

    // Timer to move to next screen
    const timer = setTimeout(() => {
      setDone(true);
    }, 10000); // 10 sec

    return () => clearTimeout(timer);
  }, []);

  const playAudioOnce = () => {
    if (audioRef.current) {
      audioRef.current.play();
      window.removeEventListener("click", playAudioOnce);
    }
  };

  // After 10 sec → show Boot screen
  if (done) return <Boot />;

  return (
    <div className="container">
      <audio ref={audioRef} src="/Windows7-Startup-Sound.mp3" />

      <div className="boot-animation booting">
        <div className="ball red"></div>
        <div className="ball blue"></div>
        <div className="ball green"></div>
        <div className="ball yellow"></div>
      </div>

      <h2>Starting Windows</h2>
      <h4>&copy; 2025 Microsoft Corporation </h4>
    </div>
  );
}

export default Windows7BootAnimation;
