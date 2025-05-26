import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Paper,
  Container,
  Tooltip,
  useTheme,
  Button
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

const Layout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();

  const handleLogout = () => {
    logout();
    navigate(config.adminRoutes.login);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          bgcolor: 'background.darker',
          color: 'text.primary',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <Toolbar>
          <Typography variant="h5" component="div" sx={{ 
            flexGrow: 1, 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #4a6da7 30%, #6889c0 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.5px',
            fontSize: '1.8rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            Payload Hoster
          </Typography>
          
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => navigate('/routes/new')}
            startIcon={<AddIcon />}
            sx={{ 
              mr: 2,
              borderRadius: '8px', 
              textTransform: 'none', 
              py: 1, 
              px: 2,
              borderColor: '#4a6da7',
              color: '#4a6da7',
              '&:hover': {
                borderColor: '#4a6da7',
                bgcolor: 'rgba(74, 109, 167, 0.04)'
              }
            }}
          >
            New Route
          </Button>
          
          <Tooltip title="Logout">
            <IconButton 
              onClick={handleLogout} 
              color="primary" 
              size="large"
              sx={{ 
                border: '2px solid',
                borderColor: 'primary.main',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.2)'
                }
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          mt: '64px', // Toolbar height
          p: 1,
        }}
      >
        <Container maxWidth={false} sx={{ py: 2, width: '100%', px: 1 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              borderRadius: 2,
              border: '2px solid',
              borderColor: 'primary.main',
              bgcolor: 'background.paper',
              minHeight: 'calc(100vh - 100px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Outlet />
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
