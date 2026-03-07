import React, { useState, useEffect, useRef, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { php } from '@codemirror/lang-php';
import { oneDark } from '@codemirror/theme-one-dark';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import {
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Tooltip,
  IconButton,
  Tab,
  Tabs,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Snackbar,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Edit as EditIcon,
  OpenInNew as OpenInNewIcon,
  Code as CodeIcon,
  AccessTime as AccessTimeIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  ContentCopy as ContentCopyIcon,
  FiberManualRecord as LiveIcon,
  QrCode as QrCodeIcon,
  FileDownload as FileDownloadIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import QRCode from 'qrcode';
import axios from 'axios';
import socketService from '../services/socketService';
import config from '../config';
import { alpha } from '@mui/material/styles';
import { tagColor } from '../utils/tagColors';
import { getCtMeta } from '../utils/contentTypes';

function getCmExtension(ct) {
  if (!ct) return [];
  if (ct.includes('html')) return [html()];
  if (ct.includes('javascript')) return [javascript()];
  if (ct.includes('json')) return [json()];
  if (ct.includes('xml')) return [xml()];
  if (ct.includes('php')) return [php()];
  return [];
}

const InfoRow = ({ label, children }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography
      variant="caption"
      sx={{
        color: 'text.disabled',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        display: 'block',
        mb: 0.25,
      }}
    >
      {label}
    </Typography>
    {children}
  </Box>
);

const RouteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [route, setRoute] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsReconnecting, setWsReconnecting] = useState(false);
  const [forcePreview, setForcePreview] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [logFilter, setLogFilter] = useState('');
  const [logMethodFilter, setLogMethodFilter] = useState('ALL');
  const [snackbar, setSnackbar] = useState('');
  const logsEndRef = useRef(null);
  const logsTopRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [routeRes, logsRes] = await Promise.all([
          axios.get(config.apiRoutes.route(id)),
          axios.get(config.apiRoutes.routeLogs(id)),
        ]);
        setRoute(routeRes.data);
        setLogs(logsRes.data);
      } catch {
        setError('Failed to load route data');
      } finally {
        setLoading(false);
      }
    };
    load();

    const socket = socketService.connect();
    socketService.subscribeToRouteLogs(id, (newLog) => {
      setLogs((prev) => [newLog, ...prev]);
    });
    setWsConnected(socket.connected);

    const onConnect = () => {
      setWsConnected(true);
      setWsReconnecting(false);
    };
    const onDisconnect = () => {
      setWsConnected(false);
      setWsReconnecting(true);
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      if (id) socketService.unsubscribeFromRouteLogs(id);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [id]);

  useEffect(() => {
    if (logs.length > 0) logsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [logs]);

  const handleDelete = async () => {
    try {
      await axios.delete(config.apiRoutes.route(id));
      navigate(config.adminRoutes.home);
    } catch {
      setError('Failed to delete route');
      setDeleteOpen(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`${window.location.origin}${route.path}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ctMeta = route ? getCtMeta(route.contentType) : null;

  const handleOpenQr = useCallback(async () => {
    const url = `${window.location.origin}${route.path}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 256, margin: 2 });
      setQrDataUrl(dataUrl);
      setQrOpen(true);
    } catch {}
  }, [route]);

  const handleExportRoute = useCallback(() => {
    const blob = new Blob([JSON.stringify(route, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `route-${route.path.replace(/\//g, '_') || 'root'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setSnackbar('Route exported');
  }, [route]);

  const handleExportLogs = useCallback(
    (format) => {
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `logs-${route.path.replace(/\//g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      } else {
        const cols = ['timestamp', 'method', 'ip', 'userAgent'];
        const rows = logs.map((l) => cols.map((c) => JSON.stringify(l[c] ?? '')).join(','));
        const csv = [cols.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `logs-${route.path.replace(/\//g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      }
      setSnackbar('Logs exported');
    },
    [logs, route]
  );

  const filteredLogs = logs.filter((l) => {
    if (logMethodFilter !== 'ALL' && l.method !== logMethodFilter) return false;
    if (logFilter) {
      const s = logFilter.toLowerCase();
      return (
        (l.ip || '').toLowerCase().includes(s) || (l.rawRequest || '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  const getForcePreviewContent = () => {
    const MAX = 4096;
    try {
      let decoded;
      if (route.contentEncoding === 'hex') {
        decoded = (route.content.match(/.{1,2}/g) || [])
          .map((b) => String.fromCharCode(parseInt(b, 16)))
          .join('');
      } else {
        decoded = atob(route.content);
      }
      const preview = decoded.slice(0, MAX);
      const truncated = decoded.length > MAX;
      return (
        <>
          {preview}
          {truncated && (
            <span style={{ color: '#64748b' }}>
              {'\n\n'}... ({Math.round(decoded.length / 1024)} KB total, truncated)
            </span>
          )}
        </>
      );
    } catch {
      return <span style={{ color: '#f87171' }}>Could not decode content.</span>;
    }
  };

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!route) return <Alert severity="warning">Route not found</Alert>;

  return (
    <Box>
      {}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/routes')}
            size="small"
            color="inherit"
          >
            Routes
          </Button>
          <Box>
            <Tooltip title={copied ? 'Copied!' : 'Click to copy URL'} placement="right">
              <Typography
                variant="h5"
                sx={{
                  mb: 0.1,
                  cursor: 'pointer',
                  '&:hover': { color: 'primary.main' },
                  transition: 'color 0.15s',
                }}
                onClick={handleCopyUrl}
              >
                {route.name}
              </Typography>
            </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={copied ? 'Copied!' : 'Click to copy URL'} placement="right">
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    color: copied ? 'success.main' : 'text.secondary',
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main' },
                    transition: 'color 0.15s',
                  }}
                  onClick={handleCopyUrl}
                >
                  {route.path}
                </Typography>
              </Tooltip>
              <ContentCopyIcon
                sx={{
                  fontSize: 12,
                  color: copied ? 'success.main' : 'text.disabled',
                  transition: 'color 0.15s',
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title="QR Code">
            <IconButton
              size="small"
              onClick={handleOpenQr}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <QrCodeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export route as JSON">
            <IconButton
              size="small"
              onClick={handleExportRoute}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <FileDownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Open route">
            <IconButton
              size="small"
              component="a"
              href={route.path}
              target="_blank"
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(config.adminRoutes.editRoute(id))}
            size="small"
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteOpen(true)}
            size="small"
          >
            Delete
          </Button>
        </Box>
      </Box>

      {}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab
            label="Info"
            icon={<InfoIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 44, fontSize: '0.85rem' }}
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Access Logs
                <Chip label={logs.length} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
              </Box>
            }
            icon={<HistoryIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 44, fontSize: '0.85rem' }}
          />
        </Tabs>
      </Box>

      {}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  mb: 2,
                  display: 'block',
                }}
              >
                Route Details
              </Typography>

              <InfoRow label="Name">
                <Typography variant="body2">{route.name}</Typography>
              </InfoRow>
              <InfoRow label="Path">
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {route.path}
                </Typography>
              </InfoRow>
              <InfoRow label="Category">
                <Chip
                  label={route.category}
                  size="small"
                  color={route.category === 'temporary' ? 'warning' : 'default'}
                  sx={{ height: 20, fontSize: '0.72rem' }}
                />
              </InfoRow>
              <InfoRow label="Content Type">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={ctMeta?.label}
                    color={ctMeta?.color}
                    size="small"
                    sx={{ height: 20, fontSize: '0.72rem' }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: 'monospace', color: 'text.disabled' }}
                  >
                    {route.contentType}
                  </Typography>
                </Box>
              </InfoRow>
              {route.contentEncoding && route.contentEncoding !== 'text' && (
                <InfoRow label="Encoding">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={route.contentEncoding.toUpperCase()}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        bgcolor: alpha('#fbbf24', 0.12),
                        color: '#fbbf24',
                      }}
                    />
                    {route.contentEncoding === 'file' && route.fileName && (
                      <Typography variant="caption" color="text.secondary">
                        {route.fileName}
                      </Typography>
                    )}
                  </Box>
                </InfoRow>
              )}
              {route.contentDisposition && (
                <InfoRow label="Content-Disposition">
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                    {route.contentDisposition}
                  </Typography>
                </InfoRow>
              )}

              {(route.tags || []).length > 0 && (
                <InfoRow label="Tags">
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {route.tags.map((tag) => {
                      const c = tagColor(tag);
                      return (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: alpha(c, 0.12),
                            color: c,
                            border: `1px solid ${alpha(c, 0.3)}`,
                          }}
                        />
                      );
                    })}
                  </Box>
                </InfoRow>
              )}

              <Divider sx={{ my: 2 }} />

              <InfoRow label="Created">
                <Typography variant="body2">
                  {new Date(route.createdAt).toLocaleString()}
                </Typography>
              </InfoRow>
              <InfoRow label="Last modified">
                <Typography variant="body2">
                  {new Date(route.updatedAt).toLocaleString()}
                </Typography>
              </InfoRow>

              {route.corsConfig?.enabled && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <InfoRow label="CORS Override">
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        mt: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          color: 'text.secondary',
                          display: 'block',
                          lineHeight: 1.8,
                        }}
                      >
                        Allow-Origin: {route.corsConfig.allowOrigin}
                        <br />
                        Allow-Methods: {route.corsConfig.allowMethods}
                        <br />
                        Allow-Headers: {route.corsConfig.allowHeaders}
                      </Typography>
                    </Box>
                  </InfoRow>
                </>
              )}

              {(route.customHeaders || []).length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <InfoRow label="Custom Headers">
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        mt: 0.5,
                      }}
                    >
                      {route.customHeaders.map((h, i) => (
                        <Typography
                          key={i}
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            color: 'text.secondary',
                            display: 'block',
                            lineHeight: 1.8,
                          }}
                        >
                          {h.key}: {h.value}
                        </Typography>
                      ))}
                    </Box>
                  </InfoRow>
                </>
              )}

              {route.rateLimit?.enabled && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <InfoRow label="Rate Limit">
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
                    >
                      {route.rateLimit.maxRequests} req / {route.rateLimit.windowMs / 1000}s
                    </Typography>
                  </InfoRow>
                </>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                overflow: 'hidden',
                cursor: 'pointer',
                '&:hover .preview-header': { bgcolor: alpha('#6366f1', 0.08) },
              }}
              onClick={() => navigate(config.adminRoutes.editRoute(id))}
              title="Click to edit"
            >
              <Box
                className="preview-header"
                sx={{
                  px: 2,
                  py: 1.25,
                  bgcolor: 'background.default',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  transition: 'background 0.15s',
                }}
              >
                <CodeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Content Preview
                </Typography>
                {route.contentEncoding && route.contentEncoding !== 'text' && (
                  <Chip
                    label={route.contentEncoding.toUpperCase()}
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: '0.6rem',
                      ml: 0.5,
                      bgcolor: alpha('#fbbf24', 0.12),
                      color: '#fbbf24',
                    }}
                  />
                )}
                {['file', 'base64', 'hex'].includes(route.contentEncoding) &&
                  !route.contentType?.startsWith('image/') && (
                    <Chip
                      label={forcePreview ? 'Hide' : 'Force preview'}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setForcePreview((p) => !p);
                      }}
                      sx={{
                        height: 16,
                        fontSize: '0.58rem',
                        ml: 0.5,
                        cursor: 'pointer',
                        bgcolor: alpha('#22d3ee', 0.1),
                        color: '#22d3ee',
                      }}
                    />
                  )}
                <Chip
                  label="Click to edit"
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.58rem',
                    ml: 'auto',
                    bgcolor: alpha('#6366f1', 0.1),
                    color: '#818cf8',
                  }}
                />
              </Box>
              {}
              {['file', 'base64'].includes(route.contentEncoding) &&
              route.contentType?.startsWith('image/') ? (
                <Box
                  sx={{
                    bgcolor: '#0d1117',
                    p: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: 120,
                  }}
                >
                  <img
                    src={`data:${route.contentType};base64,${route.content}`}
                    alt="preview"
                    style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 4, display: 'block' }}
                  />
                </Box>
              ) : forcePreview && ['file', 'base64', 'hex'].includes(route.contentEncoding) ? (
                <Box
                  sx={{
                    bgcolor: '#0d1117',
                    p: 2,
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                    color: '#e2e8f0',
                    maxHeight: 400,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    lineHeight: 1.6,
                  }}
                >
                  {getForcePreviewContent()}
                </Box>
              ) : ['file', 'base64', 'hex'].includes(route.contentEncoding) ? (
                <Box
                  sx={{
                    bgcolor: '#0d1117',
                    p: 2,
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                    color: '#e2e8f0',
                    maxHeight: 400,
                    overflow: 'auto',
                    lineHeight: 1.6,
                  }}
                >
                  {route.contentEncoding === 'file' ? (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      {route.fileName || 'Uploaded file'} — ~
                      {Math.round((route.content.length * 0.75) / 1024)} KB
                    </span>
                  ) : route.contentEncoding === 'base64' ? (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      [Binary content — base64 encoded, ~
                      {Math.round((route.content.length * 0.75) / 1024)} KB decoded]
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      [Binary content — hex encoded, ~{Math.round(route.content.length / 2 / 1024)}{' '}
                      KB decoded]
                    </span>
                  )}
                </Box>
              ) : (
                <CodeMirror
                  value={route.content || ''}
                  extensions={getCmExtension(route.contentType)}
                  theme={oneDark}
                  editable={false}
                  height="400px"
                  style={{ fontSize: '13px' }}
                  basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
                />
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {}
      {tabValue === 1 && (
        <Paper>
          {}
          <Box
            sx={{
              px: 2,
              py: 1.25,
              bgcolor: '#0d1117',
              borderBottom: '1px solid #2a2a3a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: '12px 12px 0 0',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f87171' }} />
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#fbbf24' }} />
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#4ade80' }} />
              </Box>
              <Typography
                variant="caption"
                sx={{ fontFamily: 'monospace', color: '#64748b', ml: 1 }}
              >
                access.log — {route.path}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {wsReconnecting && <WifiOffIcon sx={{ fontSize: 12, color: '#fbbf24' }} />}
              <LiveIcon
                sx={{
                  fontSize: 8,
                  color: wsConnected ? '#4ade80' : wsReconnecting ? '#fbbf24' : '#94a3b8',
                  animation: wsConnected ? 'pulse 2s infinite' : 'none',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: wsConnected ? '#4ade80' : wsReconnecting ? '#fbbf24' : '#94a3b8',
                  fontSize: '0.7rem',
                }}
              >
                {wsConnected ? 'Live' : wsReconnecting ? 'Reconnecting…' : 'Offline'}
              </Typography>
            </Box>
          </Box>

          {}
          <Box
            sx={{
              px: 2,
              py: 1,
              bgcolor: '#111118',
              borderBottom: '1px solid #1e1e2e',
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <TextField
              size="small"
              placeholder="Filter by IP or content..."
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              sx={{
                flex: 1,
                minWidth: 160,
                '& .MuiInputBase-root': {
                  bgcolor: '#0d1117',
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  color: '#e2e8f0',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 14, color: '#64748b' }} />
                  </InputAdornment>
                ),
                endAdornment: logFilter && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setLogFilter('')} sx={{ p: 0.25 }}>
                      <CloseIcon sx={{ fontSize: 12, color: '#64748b' }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <Select
                value={logMethodFilter}
                onChange={(e) => setLogMethodFilter(e.target.value)}
                sx={{
                  bgcolor: '#0d1117',
                  fontSize: '0.78rem',
                  color: '#e2e8f0',
                  fontFamily: 'monospace',
                }}
              >
                {['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
                  <MenuItem key={m} value={m} sx={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              sx={{ fontSize: '0.72rem', minWidth: 0 }}
              onClick={() => handleExportLogs('json')}
            >
              JSON
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              sx={{ fontSize: '0.72rem', minWidth: 0 }}
              onClick={() => handleExportLogs('csv')}
            >
              CSV
            </Button>
          </Box>

          {}
          <Box
            sx={{
              bgcolor: '#0d1117',
              minHeight: 300,
              maxHeight: 480,
              overflow: 'auto',
              p: 1.5,
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              borderRadius: '0 0 12px 12px',
            }}
          >
            <div ref={logsTopRef} />
            {filteredLogs.length === 0 ? (
              <Typography sx={{ color: '#64748b', fontStyle: 'italic', p: 1 }}>
                {logs.length === 0
                  ? 'No access logs yet. Waiting for requests...'
                  : 'No logs match your filter.'}
              </Typography>
            ) : (
              filteredLogs.map((log, i) => (
                <Box key={log._id || i} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </Typography>
                    <Chip
                      label={log.method}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        bgcolor:
                          log.method === 'POST' ? alpha('#22d3ee', 0.15) : alpha('#6366f1', 0.15),
                        color: log.method === 'POST' ? '#22d3ee' : '#818cf8',
                        border: 'none',
                      }}
                    />
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>{log.ip}</Typography>
                  </Box>
                  {log.rawRequest && (
                    <Box
                      sx={{
                        bgcolor: '#111118',
                        border: '1px solid #1e1e2e',
                        borderRadius: 0.75,
                        p: 1.5,
                        color: '#c9d1d9',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        lineHeight: 1.5,
                        fontSize: '0.74rem',
                      }}
                    >
                      {log.rawRequest}
                    </Box>
                  )}
                  {i < filteredLogs.length - 1 && (
                    <Divider sx={{ mt: 1.5, borderColor: '#1e1e2e' }} />
                  )}
                </Box>
              ))
            )}
            <div ref={logsEndRef} />
          </Box>
        </Paper>
      )}

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        itemName={route?.name}
        itemType="route"
      />

      {}
      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} maxWidth="xs">
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            QR Code
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
            {window.location.origin}
            {route?.path}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', pb: 1 }}>
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="QR code"
              style={{ width: 256, height: 256, borderRadius: 8 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" variant="outlined" color="inherit" onClick={() => setQrOpen(false)}>
            Close
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              const a = document.createElement('a');
              a.href = qrDataUrl;
              a.download = `qr-${route?.path?.replace(/\//g, '_') || 'route'}.png`;
              a.click();
            }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={2500}
        onClose={() => setSnackbar('')}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </Box>
  );
};

export default RouteDetails;
