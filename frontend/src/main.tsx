import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SpecSessionProvider } from './context/SpecSessionContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SpecSessionProvider>
          <App />
        </SpecSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
