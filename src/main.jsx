import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

const rootEl = document.getElementById('root');

function showFatalError(err) {
  if (!rootEl) return;
  const message =
    err instanceof Error
      ? `${err.name}: ${err.message}\n${err.stack || ''}`
      : String(err);

  rootEl.innerHTML = `
    <div style="padding:16px;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">
      <h1 style="font-size:16px;margin:0 0 8px;">Frontend crashed</h1>
      <pre style="white-space:pre-wrap;margin:0;">${message.replaceAll('<', '&lt;')}</pre>
      <p style="margin:12px 0 0;font-size:12px;opacity:.7;">
        Check the browser console for the full error.
      </p>
    </div>
  `;
}

if (import.meta.env.DEV) {
  window.addEventListener('error', (e) => showFatalError(e.error || e.message));
  window.addEventListener('unhandledrejection', (e) => showFatalError(e.reason));
}

try {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (err) {
  showFatalError(err);
  throw err;
}
