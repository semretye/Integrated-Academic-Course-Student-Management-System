import React from 'react';
import ReactDOM from 'react-dom/client'; // ✅ use react-dom/client instead of react-dom
import { AuthProvider } from './AuthContext';
import App from './App';

// ✅ createRoot instead of render
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
