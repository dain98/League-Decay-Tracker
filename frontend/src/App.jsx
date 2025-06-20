import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
// Import components - make sure paths match your project structure
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AuthGuard from './components/AuthGuard';
import './App.css';

// Create a dark theme (Riot-inspired theme)
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#d13639', // Riot red
    },
    secondary: {
      main: '#0a323c', // Dark teal
    },
    background: {
      default: '#091428', // Riot dark blue
      paper: '#0a1428',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          width: '100%',
          backgroundColor: '#091428',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;