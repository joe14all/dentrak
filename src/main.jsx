import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AppProvider } from './contexts/AppProvider.jsx';

// Import global stylesheets
import './index.css';
import './assets/styles/theme.css';

// Import database utilities for debugging
import './utils/dbReset.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
);

