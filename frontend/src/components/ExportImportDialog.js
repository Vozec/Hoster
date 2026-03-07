import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Tabs,
  Tab,
  Divider,
  Chip,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
  Close as CloseIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

const ExportImportDialog = ({ open, onClose, onImportSuccess }) => {
  const [tab, setTab] = useState(0);
  const [password, setPassword] = useState('');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const fileInputRef = useRef();

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      const params = password ? `?password=${encodeURIComponent(password)}` : '';
      const res = await axios.get(`${config.apiRoutes.exportRoutes}${params}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hoster-routes.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Export failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setError('');
    setImportResult(null);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      const res = await axios.post(config.apiRoutes.importRoutes, {
        data,
        password: password || undefined,
        overwrite,
      });
      setImportResult(res.data);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setImportFile(null);
    setImportResult(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}
      >
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
          Export / Import Routes
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            setError('');
            setImportResult(null);
          }}
          size="small"
        >
          <Tab
            label="Export"
            icon={<FileDownloadIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 48, fontSize: '0.85rem' }}
          />
          <Tab
            label="Import"
            icon={<FileUploadIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 48, fontSize: '0.85rem' }}
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ pt: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {tab === 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Export all routes to a JSON file. Optionally protect it with a password using AES-256
              encryption.
            </Typography>
            <TextField
              fullWidth
              label="Password (optional)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <LockIcon sx={{ color: 'text.disabled', mr: 1, fontSize: 18 }} />,
              }}
              helperText="Leave empty for an unencrypted export"
            />
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Import routes from a previously exported JSON file. Encrypted exports require the same
              password.
            </Typography>

            {}
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => {
                setImportFile(e.target.files[0]);
                setImportResult(null);
                setError('');
              }}
            />
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: importFile ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                mb: 2,
                transition: 'all 0.15s',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}
            >
              {importFile ? (
                <Box>
                  <Chip label={importFile.name} color="primary" size="small" sx={{ mb: 0.5 }} />
                  <Typography variant="caption" display="block" color="text.secondary">
                    {(importFile.size / 1024).toFixed(1)} KB · Click to change
                  </Typography>
                </Box>
              ) : (
                <>
                  <FileUploadIcon sx={{ color: 'text.disabled', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    Click to select a JSON export file
                  </Typography>
                </>
              )}
            </Box>

            <TextField
              fullWidth
              label="Password (if encrypted)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="small"
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <LockIcon sx={{ color: 'text.disabled', mr: 1, fontSize: 18 }} />,
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                size="small"
                variant={overwrite ? 'contained' : 'outlined'}
                onClick={() => setOverwrite(!overwrite)}
                sx={{ fontSize: '0.75rem' }}
              >
                {overwrite ? 'Overwrite: ON' : 'Overwrite: OFF'}
              </Button>
              <Typography variant="caption" color="text.secondary">
                {overwrite
                  ? 'Existing routes with same path will be updated'
                  : 'Existing routes will be skipped'}
              </Typography>
            </Box>

            {importResult && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Import complete: <strong>{importResult.created}</strong> created,{' '}
                <strong>{importResult.updated}</strong> updated,{' '}
                <strong>{importResult.skipped}</strong> skipped
                {importResult.errors?.length > 0 && (
                  <Box sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                    {importResult.errors.map((e, i) => (
                      <div key={i}>
                        {e.path}: {e.error}
                      </div>
                    ))}
                  </Box>
                )}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit" size="small">
          Close
        </Button>
        {tab === 0 ? (
          <Button
            onClick={handleExport}
            variant="contained"
            startIcon={
              exporting ? <CircularProgress size={14} color="inherit" /> : <FileDownloadIcon />
            }
            disabled={exporting}
            size="small"
          >
            {exporting ? 'Exporting...' : 'Download Export'}
          </Button>
        ) : (
          <Button
            onClick={handleImport}
            variant="contained"
            startIcon={
              importing ? <CircularProgress size={14} color="inherit" /> : <FileUploadIcon />
            }
            disabled={importing || !importFile}
            size="small"
          >
            {importing ? 'Importing...' : 'Import Routes'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ExportImportDialog;
