import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Windows7BootAnimation from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Windows7BootAnimation />
  </StrictMode>,
)
