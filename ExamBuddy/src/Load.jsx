import React, { useEffect, useState, useRef } from 'react';
import './Windows7.css';
import { useNavigate } from 'react-router-dom';

function Windows7BootAnimation() {
  const [done, setDone] = useState(false);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Play audio
    if (audioRef.current) {
      audioRef.current.volume = 1.0;
      audioRef.current.play().catch(() => {
        window.addEventListener("click", playAudioOnce);
      });
    }
    const timer = setTimeout(() => setDone(true), 10000); // 10 sec
    return () => clearTimeout(timer);
  }, []);

  const playAudioOnce = () => {
    if (audioRef.current) {
      audioRef.current.play();
      window.removeEventListener("click", playAudioOnce);
    }
  };

  // After animation finishes, check direct login status via backend
  useEffect(() => {
    if (!done) return;
    async function checkDirectLoginStatus() {
      try {
        const resp = await fetch("http://localhost:5000/api/direct-login-status", {
          credentials: 'include'
        });
        const result = await resp.json();
        if (result.status === "direct") {
          navigate('/desktop');          // Directly to desktop/app
        } else if (result.status === "normal") {
          navigate('/boot');             // Go to boot options
        } else {
          navigate('/login');            // Not logged in: show login
        }
      } catch (err) {
        navigate('/boot');    // Fallback if API fails
      }
    }
    checkDirectLoginStatus();
  }, [done, navigate]);

  if (done) return null; // Don’t render anything while fetching/routes

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
      <h4>&copy; 2025 Microsoft Corporation</h4>
    </div>
  );
}

export default Windows7BootAnimation;
