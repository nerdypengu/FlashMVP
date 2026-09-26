import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SpecSessionProvider } from './context/SpecSessionContext'
import { ToastProvider } from './components/ui/Toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SpecSessionProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </SpecSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
