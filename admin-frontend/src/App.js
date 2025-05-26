import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import RoutesList from './pages/RoutesList';
import RouteForm from './pages/RouteForm';
import RouteDetails from './pages/RouteDetails';
import config from './config';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4a6da7',
      light: '#6889c0',
      dark: '#3a5785',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4a6da7',
      light: '#6889c0',
      dark: '#3a5785',
      contrastText: '#ffffff',
    },
    error: {
      main: '#f44336',
      light: '#f44336',
      dark: '#f44336',
    },
    warning: {
      main: '#ff9800',
      light: '#ff9800',
      dark: '#ff9800',
    },
    info: {
      main: '#1976d2',
      light: '#1976d2',
      dark: '#1976d2',
    },
    success: {
      main: '#4caf50',
      light: '#4caf50',
      dark: '#4caf50',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
      darker: '#0a0a0a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#e0e0e0',
      disabled: '#a0a0a0',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#4c566a #2e3440',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: '#2e3440',
            width: 8,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#4c566a',
            minHeight: 24,
          },
          '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
            backgroundColor: '#5e81ac',
          },
          '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
            backgroundColor: '#5e81ac',
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#81a1c1',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          border: '1px solid rgba(236, 239, 244, 0.12)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          border: '1px solid rgba(236, 239, 244, 0.12)',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          borderBottom: '1px solid rgba(236, 239, 244, 0.12)',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(236, 239, 244, 0.12)',
          borderRadius: '12px',
          overflow: 'hidden',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#3b4252',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: 'rgba(46, 52, 64, 0.5)',
          },
          '&:hover': {
            backgroundColor: 'rgba(76, 86, 106, 0.2) !important',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          '&:hover': {
            backgroundColor: 'rgba(76, 86, 106, 0.2)',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(236, 239, 244, 0.12)',
        },
      },
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<RoutesList />} />
              <Route path="routes" element={<RoutesList />} />
              <Route path="routes/new" element={<RouteForm />} />
              <Route path="routes/:id" element={<RouteDetails />} />
              <Route path="routes/:id/edit" element={<RouteForm />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
