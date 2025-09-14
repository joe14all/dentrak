import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AppProvider } from './contexts/AppProvider.jsx';

// Import global stylesheets
import './index.css';
import './assets/styles/theme.css'; // <-- ADD THIS LINE

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
);

