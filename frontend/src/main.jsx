import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { FirebaseAuthProvider } from './context/FirebaseAuthContext.jsx'
import { UserProfileProvider } from './context/UserProfileContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FirebaseAuthProvider>
      <UserProfileProvider>
        <App />
      </UserProfileProvider>
    </FirebaseAuthProvider>
  </React.StrictMode>,
)
