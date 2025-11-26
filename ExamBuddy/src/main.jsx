import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Windows7BootAnimation from './Load.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Reg from './Reg';
import Boot from './Boot.jsx';
import Login from './Login.jsx';
import Win7Desktop from './App.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Windows7BootAnimation />} />
        <Route path="/login" element={<Login />} />
        <Route path="/desktop" element={<Win7Desktop />} />
        <Route path="/boot" element={<Boot />} />
        <Route path="/register" element={<Reg />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)