import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

const DeleteConfirmDialog = ({ open, onClose, onConfirm, itemName, itemType = 'route' }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: '2px solid',
          borderColor: 'error.main',
          bgcolor: 'background.paper',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          minWidth: '400px',
        },
      }}
    >
      <DialogTitle
        id="delete-dialog-title"
        sx={{
          bgcolor: 'error.dark',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.3rem',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <DeleteIcon /> Confirm deletion
      </DialogTitle>
      <DialogContent sx={{ mt: 2, p: 3 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to delete{' '}
          {itemType === 'routes' ? 'these routes' : `this ${itemType}`}?
        </Typography>
        {itemName && (
          <Typography variant="body1" fontWeight="bold" color="error.main">
            {itemName}
          </Typography>
        )}
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          This action is irreversible and will permanently delete{' '}
          {itemType === 'routes' ? 'the selected routes' : `the ${itemType}`} and all associated
          logs.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 'bold',
            px: 3,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 'bold',
            px: 3,
          }}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
