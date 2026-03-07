import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import axios from 'axios';
import { alpha } from '@mui/material/styles';

const METHOD_COLORS = {
  GET: '#6366f1',
  POST: '#22d3ee',
  PUT: '#fbbf24',
  DELETE: '#f87171',
  PATCH: '#a78bfa',
};

const RouteTestDialog = ({ open, onClose, route }) => {
  const [method, setMethod] = useState('GET');
  const [body, setBody] = useState('');
  const [customHeaders, setCustomHeaders] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');

  const handleTest = async () => {
    setLoading(true);
    setError('');
    setResponse(null);

    let headers = {};
    if (customHeaders.trim()) {
      try {
        customHeaders.split('\n').forEach((line) => {
          const [key, ...rest] = line.split(':');
          if (key && rest.length > 0) headers[key.trim()] = rest.join(':').trim();
        });
      } catch {}
    }

    const url = `${window.location.origin}${route.path}`;
    const startTime = Date.now();

    try {
      const res = await axios({
        method,
        url,
        headers,
        data: body && method !== 'GET' ? body : undefined,
        validateStatus: () => true,
        transformResponse: (data) => data,
        responseType: 'text',
      });

      const duration = Date.now() - startTime;
      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        data: res.data,
        duration,
        url,
      });
    } catch (err) {
      setError(`Request failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = response
    ? response.status < 300
      ? '#4ade80'
      : response.status < 400
        ? '#fbbf24'
        : '#f87171'
    : null;

  const truncate = (str, n = 2000) =>
    str && str.length > n ? str.slice(0, n) + `\n... (${str.length - n} more chars)` : str;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Test Route
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {route?.path}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Method</InputLabel>
            <Select value={method} onChange={(e) => setMethod(e.target.value)} label="Method">
              {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
                <MenuItem key={m} value={m}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      color: METHOD_COLORS[m],
                      fontFamily: 'monospace',
                    }}
                  >
                    {m}
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            value={route ? `${window.location.origin}${route.path}` : ''}
            InputProps={{
              readOnly: true,
              sx: { fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' },
            }}
          />
        </Box>

        {}
        <TextField
          fullWidth
          label="Custom Headers (one per line: Key: Value)"
          value={customHeaders}
          onChange={(e) => setCustomHeaders(e.target.value)}
          multiline
          rows={2}
          size="small"
          sx={{ mb: 2, fontFamily: 'monospace' }}
          InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
          placeholder="Content-Type: application/json&#10;X-Custom: value"
        />

        {}
        {method !== 'GET' && (
          <TextField
            fullWidth
            label="Request Body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            multiline
            rows={4}
            size="small"
            sx={{ mb: 2 }}
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
            placeholder='{"key": "value"}'
          />
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {}
        {response && (
          <Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                RESPONSE
              </Typography>
              <Chip
                label={`${response.status} ${response.statusText}`}
                size="small"
                sx={{
                  bgcolor: alpha(statusColor, 0.12),
                  color: statusColor,
                  border: `1px solid ${alpha(statusColor, 0.3)}`,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  height: 22,
                }}
              />
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {response.duration}ms
              </Typography>
            </Box>
            <Box
              sx={{
                bgcolor: '#0a0a0f',
                border: '1px solid #2a2a3a',
                borderRadius: 1,
                p: 2,
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                color: '#e2e8f0',
                maxHeight: 300,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {truncate(response.data) || '(empty response)'}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" size="small">
          Close
        </Button>
        <Button
          onClick={handleTest}
          variant="contained"
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
          disabled={loading || !route}
          size="small"
        >
          {loading ? 'Sending...' : 'Send Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RouteTestDialog;
