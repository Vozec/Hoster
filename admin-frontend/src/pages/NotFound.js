import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 500,
        }}
      >
        <Typography variant="h1" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
          404
        </Typography>
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
          Page non trouvée
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, textAlign: 'center' }}>
          La page que vous recherchez n'existe pas ou a été déplacée.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/"
          size="large"
        >
          Retour à l'accueil
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFound;
