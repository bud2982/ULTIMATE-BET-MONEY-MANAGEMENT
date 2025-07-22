import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.simple';

// Main entry point semplificato
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);