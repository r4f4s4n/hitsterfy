import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx';
import { SpotifyProvider } from './context/SpotifyContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SpotifyProvider>
          <App />
        </SpotifyProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)