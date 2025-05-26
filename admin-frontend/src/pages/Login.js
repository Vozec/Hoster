import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Container, Paper, TextField, Button, Typography, 
  Box, Alert, CircularProgress, Divider, InputAdornment,
  useTheme
} from '@mui/material';
import { 
  Lock as LockIcon, 
  Person as PersonIcon,
  Security as SecurityIcon 
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

const Login = () => {
  const theme = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || config.adminRoutes.home;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#121212',
        backgroundSize: 'cover',
        padding: 3
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            borderRadius: '16px',
            border: '2px solid',
            borderColor: 'primary.main',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            background: '#1e1e1e',
            maxWidth: '450px',
            mx: 'auto'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box 
              sx={{ 
                display: 'inline-flex',
                p: 3,
                borderRadius: '50%',
                backgroundColor: 'rgba(25, 118, 210, 0.15)',
                mb: 3,
                border: '2px solid',
                borderColor: 'primary.main'
              }}
            >
              <SecurityIcon 
                color="primary" 
                sx={{ 
                  fontSize: 64,
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                }} 
              />
            </Box>

            <Divider sx={{ mb: 4 }} />
          </Box>
          
          {error && (
            <Alert 
              severity="error" 
              variant="filled"
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              margin="normal"
              required
              disabled={loading}
              variant="outlined"
              sx={{ 
                mb: 4,
                '& .MuiInputLabel-root': {
                  fontSize: '1.2rem',
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '1.2rem',
                  height: 70,
                  '& fieldset': {
                    borderWidth: 2,
                    borderColor: 'rgba(25, 118, 210, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="primary" sx={{ fontSize: 28 }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              required
              disabled={loading}
              variant="outlined"
              sx={{ 
                mb: 5,
                '& .MuiInputLabel-root': {
                  fontSize: '1.2rem',
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '1.2rem',
                  height: 70,
                  '& fieldset': {
                    borderWidth: 2,
                    borderColor: 'rgba(25, 118, 210, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" sx={{ fontSize: 28 }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ 
                py: 3,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '1.5rem',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.5)',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(25, 118, 210, 0.7)',
                  backgroundColor: '#1565c0'
                }
              }}
            >
              {loading ? <CircularProgress size={32} color="inherit" /> : 'SIGN IN'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
