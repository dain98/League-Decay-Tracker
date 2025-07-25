import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
// Import components - make sure paths match your project structure
import { useDataDragon } from './hooks/useDataDragon.js';
import Footer from './components/Footer';

// Lazy load major pages for code-splitting
const Login = lazy(() => import('./components/Login'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const AuthGuard = lazy(() => import('./components/AuthGuard'));
const DuplicateEmailError = lazy(() => import('./components/DuplicateEmailError'));
const EmailNotVerified = lazy(() => import('./components/EmailNotVerified'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const Privacy = lazy(() => import('./components/Privacy'));
const About = lazy(() => import('./components/About'));

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
          <Suspense fallback={<div style={{ color: '#fff', textAlign: 'center', marginTop: 64 }}>Loading...</div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/duplicate-email" element={<DuplicateEmailError />} />
              <Route path="/verify-email" element={<EmailNotVerified />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/about" element={<About />} />
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
          </Suspense>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
