import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box,
  useTheme
} from '@mui/material';

const Header = ({ title }) => {
  const theme = useTheme();
  
  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        marginBottom: 4
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              fontWeight: 'bold',
              flexGrow: 1,
              textAlign: 'center'
            }}
          >
            {title || 'Payload Hoster'}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
