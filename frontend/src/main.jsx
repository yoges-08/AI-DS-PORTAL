import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { AuthModalProvider } from './context/AuthModalContext';
import { RobertProvider } from './context/RobertContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <RobertProvider>
          <AuthModalProvider>
            <App />
          </AuthModalProvider>
        </RobertProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
