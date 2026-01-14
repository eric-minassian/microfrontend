import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Standalone mode - wrap with BrowserRouter
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/mfe2">
      <App basePath="/mfe2" />
    </BrowserRouter>
  </StrictMode>,
)
