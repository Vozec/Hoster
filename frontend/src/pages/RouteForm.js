import React, { useState, useEffect, useRef, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { php } from '@codemirror/lang-php';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  FormHelperText,
  Grid,
  Divider,
  Chip,
  Switch,
  FormControlLabel,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Casino as CasinoIcon,
  Code as CodeIcon,
  UploadFile as UploadFileIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Tag as TagIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  HttpsOutlined as HeadersIcon,
  InsertDriveFile as FileIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import TagInput from '../components/TagInput';
import config from '../config';
import { alpha } from '@mui/material/styles';

const CONTENT_TYPES = [
  { value: 'text/html', label: 'HTML', ext: 'html' },
  { value: 'application/json', label: 'JSON', ext: 'json' },
  { value: 'text/plain', label: 'Plain Text', ext: 'text' },
  { value: 'application/xml', label: 'XML', ext: 'xml' },
  { value: 'application/javascript', label: 'JavaScript', ext: 'javascript' },
  { value: 'application/x-httpd-php', label: 'PHP', ext: 'php' },
  { value: 'custom', label: 'Custom MIME Type', ext: 'text' },
];

const ENCODINGS = [
  { value: 'text', label: 'Text (default)' },
  { value: 'base64', label: 'Base64 (type raw)' },
  { value: 'hex', label: 'Hex (type raw)' },
  { value: 'file', label: 'File Upload' },
];

function getCmExtension(ct) {
  if (ct?.includes('html')) return [html()];
  if (ct?.includes('javascript')) return [javascript()];
  if (ct?.includes('json')) return [json()];
  if (ct?.includes('xml')) return [xml()];
  if (ct?.includes('php')) return [php()];
  return [];
}

function generateSlug(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const RouteForm = ({ onSuccess, isPopup }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const fileInputRef = useRef();

  const [formData, setFormData] = useState({
    path: '',
    name: '',
    contentType: 'text/html',
    customContentType: '',
    contentEncoding: 'text',
    content: '',
    category: 'classic',
    tags: [],
    corsConfig: {
      enabled: false,
      allowOrigin: '*',
      allowMethods: 'GET,POST,OPTIONS,DELETE,PUT',
      allowHeaders: '*',
    },
    customHeaders: [],
    fileName: '',
    contentDisposition: '',
    rateLimit: { enabled: false, maxRequests: 60, windowMs: 60000 },
  });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [corsOpen, setCorsOpen] = useState(false);
  const [headersOpen, setHeadersOpen] = useState(false);
  const [rateLimitOpen, setRateLimitOpen] = useState(false);
  const [existingTags, setExistingTags] = useState([]);

  const [formErrors, setFormErrors] = useState({});
  const [cdMode, setCdMode] = useState('none');

  useEffect(() => {
    axios
      .get(config.apiRoutes.routes)
      .then((res) => {
        const tags = [...new Set(res.data.flatMap((r) => r.tags || []))].sort();
        setExistingTags(tags);
      })
      .catch(() => {});

    if (isEditMode) {
      axios
        .get(config.apiRoutes.route(id))
        .then((res) => {
          const r = res.data;
          const isCustom = !CONTENT_TYPES.some((t) => t.value === r.contentType);
          setFormData({
            path: r.path || '',
            name: r.name || '',
            contentType: isCustom ? 'custom' : r.contentType,
            customContentType: isCustom ? r.contentType : '',
            contentEncoding: r.contentEncoding || 'text',
            content: r.content || '',
            category: r.category || 'classic',
            tags: r.tags || [],
            corsConfig: r.corsConfig || {
              enabled: false,
              allowOrigin: '*',
              allowMethods: 'GET,POST,OPTIONS,DELETE,PUT',
              allowHeaders: '*',
            },
            customHeaders: r.customHeaders || [],
            fileName: r.fileName || '',
            contentDisposition: r.contentDisposition || '',
            rateLimit: r.rateLimit || { enabled: false, maxRequests: 60, windowMs: 60000 },
          });
          const cdVal = r.contentDisposition || '';
          setCdMode(
            !cdVal
              ? 'none'
              : cdVal === 'inline'
                ? 'inline'
                : cdVal.startsWith('attachment')
                  ? 'attachment'
                  : 'custom'
          );
          if (r.corsConfig?.enabled) setCorsOpen(true);
          if (r.customHeaders?.length > 0) setHeadersOpen(true);
          if (r.rateLimit?.enabled) setRateLimitOpen(true);
        })
        .catch(() => setError('Failed to load route data'))
        .finally(() => setFetchLoading(false));
    }
  }, [id, isEditMode]);

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleRandomPath = () => {
    const slug = generateSlug(8);
    handleChange('path', `/${slug}`);
  };

  const handleCdMode = useCallback(
    (mode) => {
      setCdMode(mode);
      if (mode === 'none') handleChange('contentDisposition', '');
      else if (mode === 'inline') handleChange('contentDisposition', 'inline');
      else if (mode === 'attachment') {
        handleChange(
          'contentDisposition',
          `attachment; filename="${formData.fileName.split(' (')[0]}"`
        );
      }
    },
    [formData.fileName, handleChange]
  );

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result.split(',')[1];
      setFormData((prev) => ({
        ...prev,
        content: b64,
        contentEncoding: 'file',
        fileName: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        contentDisposition: prev.contentDisposition || '',
      }));
      setFormErrors((prev) => ({ ...prev, content: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      content: '',
      contentEncoding: 'text',
      fileName: '',
      contentDisposition: '',
    }));
  };

  const validate = () => {
    const errors = {};
    let path = formData.path.trim();
    if (!path) {
      path = `/${generateSlug(8)}`;
      handleChange('path', path);
    } else if (!path.startsWith('/')) {
      path = '/' + path;
      handleChange('path', path);
    }
    if (formData.contentType === 'custom' && !formData.customContentType.trim()) {
      errors.customContentType = 'Custom content type is required';
    }
    if (!formData.content && formData.content !== '') {
      errors.content = 'Content is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      path: formData.path.trim() || `/${generateSlug(8)}`,
      name: formData.name.trim() || undefined,
      contentType:
        formData.contentType === 'custom' ? formData.customContentType : formData.contentType,
      contentEncoding: formData.contentEncoding,
      content: formData.content,
      category: formData.category,
      tags: formData.tags,
      corsConfig: formData.corsConfig,
      customHeaders: formData.customHeaders.filter((h) => h.key),
      fileName: formData.fileName,
      contentDisposition: formData.contentDisposition,
      rateLimit: formData.rateLimit,
    };

    try {
      if (isEditMode) {
        await axios.put(config.apiRoutes.route(id), payload);
        setSuccess('Route updated successfully');
        if (onSuccess) onSuccess();
        else setTimeout(() => navigate(config.adminRoutes.routeDetails(id)), 800);
      } else {
        const res = await axios.post(config.apiRoutes.routes, payload);
        setSuccess('Route created successfully');
        if (onSuccess) onSuccess();
        else setTimeout(() => navigate(config.adminRoutes.routeDetails(res.data.route._id)), 800);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving route');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const isFileMode = formData.contentEncoding === 'file';
  const isTextEncoding = formData.contentEncoding === 'text';
  const cmExtensions = getCmExtension(
    formData.contentType === 'custom' ? formData.customContentType : formData.contentType
  );

  return (
    <Box>
      {!isPopup && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(config.adminRoutes.home)}
              size="small"
              color="inherit"
            >
              Back
            </Button>
            <Typography variant="h5">{isEditMode ? 'Edit Route' : 'New Route'}</Typography>
          </Box>
        </Box>
      )}

      {(error || success) && (
        <Box sx={{ mb: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: 'text.secondary',
                  mb: 2,
                  display: 'block',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Route Metadata
              </Typography>

              {}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', mb: 0.5, display: 'block', fontWeight: 500 }}
                >
                  Path
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  name="path"
                  value={formData.path}
                  onChange={(e) => handleChange('path', e.target.value)}
                  placeholder="/my-route"
                  disabled={loading}
                  InputProps={{
                    sx: { fontFamily: 'monospace' },
                    endAdornment: (
                      <Tooltip title="Generate random path">
                        <IconButton
                          size="small"
                          onClick={handleRandomPath}
                          disabled={loading}
                          sx={{
                            mr: -0.5,
                            color: 'text.disabled',
                            borderRadius: 1,
                            '&:hover': { color: 'primary.main', bgcolor: alpha('#6366f1', 0.1) },
                          }}
                        >
                          <CasinoIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    ),
                  }}
                  helperText="Leave empty to auto-generate"
                />
              </Box>

              {}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', mb: 0.5, display: 'block', fontWeight: 500 }}
                >
                  Name
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="My Route"
                  disabled={loading}
                  helperText="Auto-generated from path if empty"
                />
              </Box>

              {}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', mb: 0.5, display: 'block', fontWeight: 500 }}
                >
                  Category
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="classic">Classic (permanent)</MenuItem>
                    <MenuItem value="temporary">Temporary (auto-purge)</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', mb: 0.5, display: 'block', fontWeight: 500 }}
                >
                  Content Type
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={formData.contentType}
                    onChange={(e) => handleChange('contentType', e.target.value)}
                    disabled={loading}
                  >
                    {CONTENT_TYPES.map((ct) => (
                      <MenuItem key={ct.value} value={ct.value}>
                        {ct.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {formData.contentType === 'custom' && (
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={formData.customContentType}
                    onChange={(e) => handleChange('customContentType', e.target.value)}
                    placeholder="application/pdf"
                    error={!!formErrors.customContentType}
                    helperText={formErrors.customContentType || 'Enter a valid MIME type'}
                    disabled={loading}
                    InputProps={{ sx: { fontFamily: 'monospace' } }}
                  />
                </Box>
              )}

              {}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', mb: 0.5, display: 'block', fontWeight: 500 }}
                >
                  Content Encoding
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={formData.contentEncoding}
                    onChange={(e) => handleChange('contentEncoding', e.target.value)}
                    disabled={loading}
                  >
                    {ENCODINGS.map((enc) => (
                      <MenuItem key={enc.value} value={enc.value}>
                        {enc.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {formData.contentEncoding === 'base64'
                      ? 'Type raw Base64 in the editor — server decodes before serving'
                      : formData.contentEncoding === 'hex'
                        ? 'Type raw Hex in the editor — server decodes before serving'
                        : formData.contentEncoding === 'file'
                          ? 'Upload a file — served as raw binary'
                          : 'Content is served as-is (plain text)'}
                  </FormHelperText>
                </FormControl>
              </Box>

              {}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />

              <Divider sx={{ my: 2 }} />

              {}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <TagIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Tags
                  </Typography>
                </Box>
                <TagInput
                  value={formData.tags}
                  onChange={(tags) => handleChange('tags', tags)}
                  disabled={loading}
                  existingTags={existingTags}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {}
              <Box>
                <Box
                  onClick={() => setCorsOpen(!corsOpen)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    py: 0.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <SecurityIcon
                      sx={{
                        fontSize: 16,
                        color: formData.corsConfig.enabled ? 'primary.main' : 'text.secondary',
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: formData.corsConfig.enabled ? 'primary.main' : 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      CORS Override
                    </Typography>
                    {formData.corsConfig.enabled && (
                      <Chip
                        label="ON"
                        size="small"
                        color="primary"
                        sx={{ height: 16, fontSize: '0.6rem' }}
                      />
                    )}
                  </Box>
                  {corsOpen ? (
                    <ExpandLessIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  ) : (
                    <ExpandMoreIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  )}
                </Box>

                <Collapse in={corsOpen}>
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 2,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={formData.corsConfig.enabled}
                          onChange={(e) =>
                            handleChange('corsConfig', {
                              ...formData.corsConfig,
                              enabled: e.target.checked,
                            })
                          }
                          disabled={loading}
                        />
                      }
                      label={
                        <Typography variant="caption">
                          Enable CORS override for this route
                        </Typography>
                      }
                      sx={{ mb: 1.5, display: 'flex' }}
                    />
                    {formData.corsConfig.enabled && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Allow-Origin"
                          value={formData.corsConfig.allowOrigin}
                          onChange={(e) =>
                            handleChange('corsConfig', {
                              ...formData.corsConfig,
                              allowOrigin: e.target.value,
                            })
                          }
                          disabled={loading}
                          InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Allow-Methods"
                          value={formData.corsConfig.allowMethods}
                          onChange={(e) =>
                            handleChange('corsConfig', {
                              ...formData.corsConfig,
                              allowMethods: e.target.value,
                            })
                          }
                          disabled={loading}
                          InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Allow-Headers"
                          value={formData.corsConfig.allowHeaders}
                          onChange={(e) =>
                            handleChange('corsConfig', {
                              ...formData.corsConfig,
                              allowHeaders: e.target.value,
                            })
                          }
                          disabled={loading}
                          InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
                        />
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Box>

              <Divider sx={{ my: 2 }} />

              {}
              <Box>
                <Box
                  onClick={() => setHeadersOpen(!headersOpen)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    py: 0.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <HeadersIcon
                      sx={{
                        fontSize: 16,
                        color:
                          formData.customHeaders.length > 0 ? 'secondary.main' : 'text.secondary',
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color:
                          formData.customHeaders.length > 0 ? 'secondary.main' : 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      Response Headers
                    </Typography>
                    {formData.customHeaders.length > 0 && (
                      <Chip
                        label={formData.customHeaders.length}
                        size="small"
                        color="secondary"
                        sx={{ height: 16, fontSize: '0.6rem' }}
                      />
                    )}
                  </Box>
                  {headersOpen ? (
                    <ExpandLessIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  ) : (
                    <ExpandMoreIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  )}
                </Box>

                <Collapse in={headersOpen}>
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 2,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mb: 1.5 }}
                    >
                      Extra headers sent with every response from this route.
                    </Typography>
                    {formData.customHeaders.map((h, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 0.75, mb: 1 }}>
                        <TextField
                          size="small"
                          placeholder="Header-Name"
                          value={h.key}
                          onChange={(e) => {
                            const updated = [...formData.customHeaders];
                            updated[i] = { ...updated[i], key: e.target.value };
                            handleChange('customHeaders', updated);
                          }}
                          disabled={loading}
                          sx={{ flex: 1 }}
                          InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.78rem' } }}
                        />
                        <TextField
                          size="small"
                          placeholder="value"
                          value={h.value}
                          onChange={(e) => {
                            const updated = [...formData.customHeaders];
                            updated[i] = { ...updated[i], value: e.target.value };
                            handleChange('customHeaders', updated);
                          }}
                          disabled={loading}
                          sx={{ flex: 1 }}
                          InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.78rem' } }}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            handleChange(
                              'customHeaders',
                              formData.customHeaders.filter((_, j) => j !== i)
                            )
                          }
                          disabled={loading}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() =>
                        handleChange('customHeaders', [
                          ...formData.customHeaders,
                          { key: '', value: '' },
                        ])
                      }
                      disabled={loading}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Add Header
                    </Button>
                  </Box>
                </Collapse>
              </Box>

              <Divider sx={{ my: 2 }} />

              {}
              <Box>
                <Box
                  onClick={() => setRateLimitOpen(!rateLimitOpen)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    py: 0.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <SpeedIcon
                      sx={{
                        fontSize: 16,
                        color: formData.rateLimit.enabled ? 'warning.main' : 'text.secondary',
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: formData.rateLimit.enabled ? 'warning.main' : 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      Rate Limit
                    </Typography>
                    {formData.rateLimit.enabled && (
                      <Chip
                        label={`${formData.rateLimit.maxRequests} / ${formData.rateLimit.windowMs / 1000}s`}
                        size="small"
                        color="warning"
                        sx={{ height: 16, fontSize: '0.6rem' }}
                      />
                    )}
                  </Box>
                  {rateLimitOpen ? (
                    <ExpandLessIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  ) : (
                    <ExpandMoreIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  )}
                </Box>

                <Collapse in={rateLimitOpen}>
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 2,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={formData.rateLimit.enabled}
                          onChange={(e) =>
                            handleChange('rateLimit', {
                              ...formData.rateLimit,
                              enabled: e.target.checked,
                            })
                          }
                          disabled={loading}
                        />
                      }
                      label={
                        <Typography variant="caption">
                          Enable rate limiting for this route
                        </Typography>
                      }
                      sx={{ mb: 1.5, display: 'flex' }}
                    />
                    {formData.rateLimit.enabled && (
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <TextField
                          size="small"
                          label="Max requests"
                          type="number"
                          value={formData.rateLimit.maxRequests}
                          onChange={(e) =>
                            handleChange('rateLimit', {
                              ...formData.rateLimit,
                              maxRequests: parseInt(e.target.value) || 60,
                            })
                          }
                          disabled={loading}
                          sx={{ flex: 1 }}
                          inputProps={{ min: 1 }}
                        />
                        <TextField
                          size="small"
                          label="Window (seconds)"
                          type="number"
                          value={formData.rateLimit.windowMs / 1000}
                          onChange={(e) =>
                            handleChange('rateLimit', {
                              ...formData.rateLimit,
                              windowMs: (parseInt(e.target.value) || 60) * 1000,
                            })
                          }
                          disabled={loading}
                          sx={{ flex: 1 }}
                          inputProps={{ min: 1 }}
                        />
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Box>
            </Paper>
          </Grid>

          {}
          <Grid item xs={12} lg={8}>
            <Paper
              sx={{
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: isPopup ? 400 : 560,
              }}
            >
              {}
              <Box
                sx={{
                  px: 2,
                  py: 1.25,
                  bgcolor: 'background.default',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isFileMode ? (
                    <FileIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                  ) : (
                    <CodeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: isFileMode ? 'secondary.main' : 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {isFileMode ? 'File Upload' : 'Content'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {!isFileMode && formData.contentEncoding !== 'text' && (
                    <Chip
                      label={formData.contentEncoding.toUpperCase()}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        bgcolor: alpha('#fbbf24', 0.12),
                        color: '#fbbf24',
                      }}
                    />
                  )}
                  <Chip
                    label={
                      formData.contentType === 'custom'
                        ? formData.customContentType || 'custom'
                        : formData.contentType
                    }
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      fontFamily: 'monospace',
                      bgcolor: alpha('#6366f1', 0.12),
                      color: '#818cf8',
                    }}
                  />
                </Box>
              </Box>

              {}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {isFileMode ? (
                  <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {formData.fileName ? (
                      <Box
                        sx={{
                          p: 2.5,
                          bgcolor: 'background.default',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: alpha('#22d3ee', 0.3),
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <FileIcon sx={{ fontSize: 36, color: 'secondary.main', flexShrink: 0 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formData.fileName}
                          </Typography>
                          {formData.content && (
                            <Typography variant="caption" color="text.secondary">
                              ~{Math.round((formData.content.length * 0.75) / 1024)} KB decoded
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<UploadFileIcon />}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                          >
                            Replace
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleRemoveFile}
                            disabled={loading}
                          >
                            Remove
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          textAlign: 'center',
                          py: 6,
                          border: '2px dashed',
                          borderColor: 'divider',
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          '&:hover': {
                            borderColor: 'secondary.main',
                            bgcolor: alpha('#22d3ee', 0.04),
                          },
                        }}
                      >
                        <UploadFileIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                          Click to select a file — served as raw binary
                        </Typography>
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          startIcon={<UploadFileIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          Choose File
                        </Button>
                      </Box>
                    )}

                    {}
                    {formData.fileName && (
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            display: 'block',
                            mb: 1.5,
                          }}
                        >
                          Content-Disposition
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                          {['none', 'inline', 'attachment', 'custom'].map((opt) => (
                            <Button
                              key={opt}
                              size="small"
                              variant={cdMode === opt ? 'contained' : 'outlined'}
                              color={cdMode === opt ? 'secondary' : 'inherit'}
                              onClick={() => handleCdMode(opt)}
                              disabled={loading}
                              sx={{ textTransform: 'none', fontSize: '0.78rem', minWidth: 0 }}
                            >
                              {opt}
                            </Button>
                          ))}
                        </Box>
                        {(cdMode === 'custom' || cdMode === 'attachment') && (
                          <TextField
                            fullWidth
                            size="small"
                            value={formData.contentDisposition}
                            onChange={(e) => handleChange('contentDisposition', e.target.value)}
                            placeholder='attachment; filename="myfile.pdf"'
                            disabled={loading}
                            InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.82rem' } }}
                            helperText="Full Content-Disposition header value"
                          />
                        )}
                        {cdMode === 'none' && (
                          <Typography variant="caption" color="text.disabled">
                            No Content-Disposition header will be sent.
                          </Typography>
                        )}
                        {cdMode === 'inline' && (
                          <Typography variant="caption" color="text.disabled">
                            Browser will attempt to display the file inline.
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                ) : isTextEncoding ? (
                  <>
                    <CodeMirror
                      value={formData.content}
                      onChange={(val) => handleChange('content', val)}
                      extensions={cmExtensions}
                      theme={oneDark}
                      readOnly={loading}
                      placeholder="Enter content here..."
                      height={isPopup ? '350px' : '500px'}
                      style={{ fontSize: '13px' }}
                      basicSetup={{
                        lineNumbers: true,
                        highlightActiveLineGutter: true,
                        foldGutter: true,
                        dropCursor: false,
                        allowMultipleSelections: false,
                        indentOnInput: true,
                        syntaxHighlighting: true,
                        autocompletion: true,
                        closeBrackets: true,
                      }}
                    />
                    {formErrors.content && (
                      <Alert severity="error" sx={{ mt: 1, py: 0.5, fontSize: '0.8rem' }}>
                        {formErrors.content}
                      </Alert>
                    )}
                  </>
                ) : (
                  <Box sx={{ p: 2 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      {formData.contentEncoding === 'base64'
                        ? 'Type raw Base64 below. The server will decode it before serving.'
                        : 'Type raw Hex below (e.g. 48656c6c6f). The server will decode it before serving.'}
                    </Alert>
                    <TextField
                      fullWidth
                      multiline
                      minRows={10}
                      value={formData.content}
                      onChange={(e) => handleChange('content', e.target.value)}
                      placeholder={
                        formData.contentEncoding === 'base64'
                          ? 'SGVsbG8gV29ybGQ='
                          : '48656c6c6f20576f726c64'
                      }
                      disabled={loading}
                      error={!!formErrors.content}
                      helperText={formErrors.content}
                      InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
                    />
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              {!isPopup && (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate(config.adminRoutes.home)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                sx={{ px: 3 }}
              >
                {loading ? 'Saving...' : isEditMode ? 'Update Route' : 'Create Route'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default RouteForm;
