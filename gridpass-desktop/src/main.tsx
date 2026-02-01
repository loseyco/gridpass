import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Mounting App...');

// Safe IPC check
if (window.ipcRenderer) {
  window.ipcRenderer.on('main-process-message', (_event, message) => {
    console.log(message)
  })
} else {
  console.error('IPC Renderer not available!');
}

// Simple API check
if (!window.api) {
  document.body.innerHTML = '<div style="color:red; padding:20px; font-family:sans-serif;"><h1>Fatal Error</h1><p>window.api is not defined. Preload script failed to load.</p></div>';
  throw new Error('window.api missing');
}

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (e) {
  console.error('Failed to mount app:', e);
  document.body.innerHTML = `<div style="color:red; padding:20px;"><h1>React Error</h1><pre>${String(e)}</pre></div>`;
}
