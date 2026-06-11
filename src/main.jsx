import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AppProvider } from './contexts/AppProvider.jsx';

// Import global stylesheets
import './index.css';
import './assets/styles/theme.css';

// Import database utilities for debugging
import './utils/dbReset.js';

// Prevent browser scroll wheel from silently changing <input type="number"> values
document.addEventListener('wheel', () => {
  if (document.activeElement?.type === 'number') {
    document.activeElement.blur();
  }
}, { passive: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
);

