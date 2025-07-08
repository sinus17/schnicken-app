// import { StrictMode } from 'react' // Temporarily disabled for performance
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />
)
