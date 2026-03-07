import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Divider,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Home as HomeIcon,
  HttpsOutlined as HeadersIcon,
} from '@mui/icons-material';
import axios from 'axios';
import config from '../config';

const LANDING_OPTIONS = [
  { value: '/', label: 'Dashboard' },
  { value: '/routes', label: 'Routes' },
];

const Settings = () => {
  const [tab, setTab] = useState(0);
  const [corsConfig, setCorsConfig] = useState({
    allowOrigin: '*',
    allowMethods: 'GET,POST,OPTIONS,DELETE,PUT',
    allowHeaders: '*',
  });
  const [customHeaders, setCustomHeaders] = useState([]);
  const [landingPage, setLandingPage] = useState(() => localStorage.getItem('landingPage') || '/');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [corsRes, headersRes] = await Promise.all([
          axios.get(config.apiRoutes.corsConfig),
          axios.get(config.apiRoutes.customHeadersConfig),
        ]);
        setCorsConfig(corsRes.data);
        setCustomHeaders(Array.isArray(headersRes.data) ? headersRes.data : []);
      } catch {
        setError('Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSaveCors = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await axios.put(config.apiRoutes.corsConfig, corsConfig);
      setSuccess('CORS configuration saved');
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHeaders = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await axios.put(config.apiRoutes.customHeadersConfig, {
        headers: customHeaders.filter((h) => h.key),
      });
      setSuccess('Custom headers saved');
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLanding = () => {
    localStorage.setItem('landingPage', landingPage);
    setSuccess('Landing page preference saved');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <SettingsIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <Typography variant="h5">Settings</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Global server configuration
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            setError('');
            setSuccess('');
          }}
        >
          <Tab
            label="CORS"
            icon={<SecurityIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 44, fontSize: '0.85rem' }}
          />
          <Tab
            label="Response Headers"
            icon={<HeadersIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 44, fontSize: '0.85rem' }}
          />
          <Tab
            label="Preferences"
            icon={<HomeIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 44, fontSize: '0.85rem' }}
          />
        </Tabs>
      </Box>

      {}
      {tab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Default CORS headers applied to all routes. Each route can override these individually.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', mb: 0.5, display: 'block', fontWeight: 600 }}
              >
                Access-Control-Allow-Origin
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={corsConfig.allowOrigin}
                onChange={(e) => setCorsConfig((p) => ({ ...p, allowOrigin: e.target.value }))}
                placeholder="* or https://example.com"
              />
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                {['*', 'null'].map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    size="small"
                    onClick={() => setCorsConfig((p) => ({ ...p, allowOrigin: v }))}
                    variant={corsConfig.allowOrigin === v ? 'filled' : 'outlined'}
                    color={corsConfig.allowOrigin === v ? 'primary' : 'default'}
                    sx={{ cursor: 'pointer', fontFamily: 'monospace' }}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', mb: 0.5, display: 'block', fontWeight: 600 }}
              >
                Access-Control-Allow-Methods
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={corsConfig.allowMethods}
                onChange={(e) => setCorsConfig((p) => ({ ...p, allowMethods: e.target.value }))}
                placeholder="GET,POST,OPTIONS,DELETE,PUT"
              />
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['GET,POST,OPTIONS,DELETE,PUT', 'GET,POST,OPTIONS', 'GET'].map((v) => (
                  <Chip
                    key={v}
                    label={v}
                    size="small"
                    onClick={() => setCorsConfig((p) => ({ ...p, allowMethods: v }))}
                    variant={corsConfig.allowMethods === v ? 'filled' : 'outlined'}
                    color={corsConfig.allowMethods === v ? 'primary' : 'default'}
                    sx={{ cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', mb: 0.5, display: 'block', fontWeight: 600 }}
              >
                Access-Control-Allow-Headers
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={corsConfig.allowHeaders}
                onChange={(e) => setCorsConfig((p) => ({ ...p, allowHeaders: e.target.value }))}
                placeholder="* or Content-Type,Authorization"
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveCors}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save CORS'}
            </Button>
          </Box>
        </Paper>
      )}

      {}
      {tab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Global response headers added to all dynamic routes (unless the route defines its own).
          </Typography>

          {customHeaders.map((h, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                size="small"
                placeholder="Header-Name"
                value={h.key}
                onChange={(e) => {
                  const updated = [...customHeaders];
                  updated[i] = { ...updated[i], key: e.target.value };
                  setCustomHeaders(updated);
                }}
                sx={{ flex: 1 }}
                InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.82rem' } }}
              />
              <TextField
                size="small"
                placeholder="value"
                value={h.value}
                onChange={(e) => {
                  const updated = [...customHeaders];
                  updated[i] = { ...updated[i], value: e.target.value };
                  setCustomHeaders(updated);
                }}
                sx={{ flex: 1 }}
                InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.82rem' } }}
              />
              <IconButton
                size="small"
                color="error"
                onClick={() => setCustomHeaders(customHeaders.filter((_, j) => j !== i))}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))}

          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setCustomHeaders([...customHeaders, { key: '', value: '' }])}
            sx={{ mt: 1 }}
          >
            Add Header
          </Button>

          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSaveHeaders}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Headers'}
            </Button>
          </Box>
        </Paper>
      )}

      {}
      {tab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            UI preferences stored in your browser.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', mb: 1, display: 'block', fontWeight: 600 }}
            >
              Landing Page after Login
            </Typography>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select value={landingPage} onChange={(e) => setLandingPage(e.target.value)}>
                {LANDING_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.75 }}
            >
              Where to redirect after a successful login.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveLanding}>
              Save Preferences
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default Settings;
