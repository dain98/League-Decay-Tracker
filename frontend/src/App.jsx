import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
// Import components - make sure paths match your project structure
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AuthGuard from './components/AuthGuard';
import DuplicateEmailError from './components/DuplicateEmailError';
import { useDataDragon } from './hooks/useDataDragon.js';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import Footer from './components/Footer';
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
  // Initialize Data Dragon service
  const { version, isLoading: ddragonLoading, error: ddragonError } = useDataDragon();

  // Log Data Dragon status for debugging
  React.useEffect(() => {
    if (version) {
      console.log('App: Data Dragon version loaded:', version);
    }
    if (ddragonError) {
      console.warn('App: Data Dragon error:', ddragonError);
    }
  }, [version, ddragonError]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/duplicate-email" element={<DuplicateEmailError />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
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
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
