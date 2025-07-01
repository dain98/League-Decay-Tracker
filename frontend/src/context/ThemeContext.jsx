import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const ThemeContext = createContext();

const getInitialMode = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('themeMode');
    if (stored === 'light' || stored === 'dark') return stored;
    // Default: match system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode,
        ...(mode === 'dark'
          ? {
              background: {
                default: '#0a1a22',
                paper: 'rgba(10, 50, 60, 0.8)',
              },
              primary: { main: '#00bcd4' },
              secondary: { main: '#ff9800' },
            }
          : {
              background: {
                default: '#f5f5f5',
                paper: '#fff',
              },
              primary: { main: '#1976d2' },
              secondary: { main: '#ff9800' },
            }),
      },
      shape: { borderRadius: 10 },
      typography: {
        fontFamily: 'Inter, Roboto, Arial, sans-serif',
      },
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeContext); 
