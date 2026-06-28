import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';

// Apply persisted dark mode before paint
const stored = localStorage.getItem('kings-and-spies-storage');
if (stored) {
  try {
    const parsed = JSON.parse(stored);
    if (parsed.state?.darkMode === false) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch { /* ignore */ }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
