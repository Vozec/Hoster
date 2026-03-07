import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  Checkbox,
  Switch,
  FormControlLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  OpenInNew as OpenInNewIcon,
  Search as SearchIcon,
  ContentCopy as ContentCopyIcon,
  CopyAll as CopyAllIcon,
  PlayArrow as PlayArrowIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
  Tag as TagIcon,
  Close as CloseIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  Sort as SortIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RouteTestDialog from '../components/RouteTestDialog';
import ExportImportDialog from '../components/ExportImportDialog';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import config from '../config';
import { alpha } from '@mui/material/styles';
import { tagColor } from '../utils/tagColors';
import { getCtMeta } from '../utils/contentTypes';

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest first' },
  { value: 'createdAt_asc', label: 'Oldest first' },
  { value: 'path_asc', label: 'Path A→Z' },
  { value: 'name_asc', label: 'Name A→Z' },
];

function sortRoutes(routes, sortBy) {
  const [field, dir] = sortBy.split('_');
  return [...routes].sort((a, b) => {
    const va = field === 'createdAt' ? new Date(a[field]) : (a[field] || '').toLowerCase();
    const vb = field === 'createdAt' ? new Date(b[field]) : (b[field] || '').toLowerCase();
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

function expiryLabel(route) {
  if (route.category !== 'temporary' || !route.temporarySince) return null;
  const daysSince = Math.floor((Date.now() - new Date(route.temporarySince)) / 86400000);
  return `${daysSince}d old`;
}

const RouteActions = ({ route, onDelete, onClone, onTest, onCopy, navigate, stopPropagation }) => {
  const wrap = (fn) => (e) => {
    if (stopPropagation) e.stopPropagation();
    fn(e);
  };
  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}
      onClick={(e) => e.stopPropagation()}
    >
      <Tooltip title="View Logs">
        <IconButton
          size="small"
          color="info"
          onClick={wrap(() => navigate(config.adminRoutes.routeDetails(route._id)))}
        >
          <VisibilityIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Open Route">
        <IconButton
          size="small"
          color="success"
          component="a"
          href={route.path}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <OpenInNewIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Copy URL">
        <IconButton
          size="small"
          onClick={wrap(() => onCopy(`${window.location.origin}${route.path}`))}
        >
          <ContentCopyIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Test Route">
        <IconButton size="small" onClick={wrap(() => onTest(route))} sx={{ color: '#4ade80' }}>
          <PlayArrowIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit">
        <IconButton
          size="small"
          color="primary"
          component={Link}
          to={config.adminRoutes.editRoute(route._id)}
          onClick={(e) => e.stopPropagation()}
        >
          <EditIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Clone">
        <IconButton size="small" onClick={wrap(() => onClone(route._id))} sx={{ color: '#a78bfa' }}>
          <CopyAllIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton size="small" color="error" onClick={wrap(() => onDelete(route))}>
          <DeleteIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

const RouteCard = ({ route, selected, onSelect, onDelete, onClone, onTest, onCopy, navigate }) => {
  const ct = getCtMeta(route.contentType);

  return (
    <Card
      onClick={() => navigate(config.adminRoutes.routeDetails(route._id))}
      sx={{
        position: 'relative',
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        borderColor: selected ? 'primary.main' : 'divider',
        '&:hover': { borderColor: 'primary.light', boxShadow: '0 0 0 1px rgba(99,102,241,0.3)' },
      }}
    >
      {}
      <Box
        sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={selected}
          onChange={(e) => onSelect(route._id, e.target.checked)}
          size="small"
          sx={{ p: 0.5 }}
        />
      </Box>

      <CardContent sx={{ pt: 1.5, pb: '12px !important', pl: 4.5 }}>
        {}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.25 }}
            >
              <Typography
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 200,
                }}
              >
                {route.path}
              </Typography>
              <Chip
                label={ct.label}
                color={ct.color}
                size="small"
                sx={{ height: 18, fontSize: '0.68rem' }}
              />
              {route.category === 'temporary' && (
                <Chip
                  label={expiryLabel(route) ? `temp · ${expiryLabel(route)}` : 'temp'}
                  size="small"
                  color="warning"
                  icon={<AccessTimeIcon style={{ fontSize: 11 }} />}
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              {route.name}
            </Typography>
            {(route.tags || []).length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4, mt: 0.5 }}>
                {route.tags.map((tag) => {
                  const c = tagColor(tag);
                  return (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        bgcolor: alpha(c, 0.12),
                        color: c,
                        border: `1px solid ${alpha(c, 0.3)}`,
                      }}
                    />
                  );
                })}
                {route.corsConfig?.enabled && (
                  <Chip
                    label="CORS"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      bgcolor: alpha('#22d3ee', 0.1),
                      color: '#22d3ee',
                    }}
                  />
                )}
              </Box>
            )}
          </Box>
          <RouteActions
            route={route}
            onDelete={onDelete}
            onClone={onClone}
            onTest={onTest}
            onCopy={onCopy}
            navigate={navigate}
            stopPropagation
          />
        </Box>
      </CardContent>
    </Card>
  );
};

const RouteRow = ({ route, selected, onSelect, onDelete, onClone, onTest, onCopy, navigate }) => {
  const ct = getCtMeta(route.contentType);
  return (
    <Box
      onClick={() => navigate(config.adminRoutes.routeDetails(route._id))}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.25,
        cursor: 'pointer',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: selected ? alpha('#6366f1', 0.06) : 'background.paper',
        transition: 'background 0.12s',
        '&:hover': { bgcolor: alpha('#6366f1', 0.08) },
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Box onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          onChange={(e) => onSelect(route._id, e.target.checked)}
          size="small"
          sx={{ p: 0.25 }}
        />
      </Box>
      <Chip
        label={ct.label}
        color={ct.color}
        size="small"
        sx={{ height: 18, fontSize: '0.68rem', flexShrink: 0 }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.88rem',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {route.path}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {route.name}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.4, flexWrap: 'wrap', flexShrink: 0, maxWidth: 200 }}>
        {(route.tags || []).map((tag) => {
          const c = tagColor(tag);
          return (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                height: 16,
                fontSize: '0.62rem',
                bgcolor: alpha(c, 0.12),
                color: c,
                border: `1px solid ${alpha(c, 0.25)}`,
              }}
            />
          );
        })}
        {route.category === 'temporary' && (
          <Chip
            label={expiryLabel(route) ? `temp · ${expiryLabel(route)}` : 'temp'}
            size="small"
            color="warning"
            sx={{ height: 16, fontSize: '0.62rem' }}
          />
        )}
      </Box>
      <RouteActions
        route={route}
        onDelete={onDelete}
        onClone={onClone}
        onTest={onTest}
        onCopy={onCopy}
        navigate={navigate}
        stopPropagation
      />
    </Box>
  );
};

const RoutesList = () => {
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef = useRef(null);
  const [showTemporary, setShowTemporary] = useState(() =>
    JSON.parse(localStorage.getItem('showTemporaryRoutes') || 'false')
  );
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [allTags, setAllTags] = useState([]);

  const [viewMode, setViewMode] = useState(() => localStorage.getItem('routesViewMode') || 'grid');
  const [sortBy, setSortBy] = useState(
    () => localStorage.getItem('routesSortBy') || 'createdAt_desc'
  );
  const [page, setPage] = useState(1);
  const [deleteRoute, setDeleteRoute] = useState(null);
  const [deleteMultiOpen, setDeleteMultiOpen] = useState(false);
  const [testRoute, setTestRoute] = useState(null);
  const [exportImportOpen, setExportImportOpen] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [cloneDialog, setCloneDialog] = useState(null);
  const [cloneTargetPath, setCloneTargetPath] = useState('');

  const handleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('routesViewMode', mode);
  };

  const handleSortBy = (val) => {
    setSortBy(val);
    localStorage.setItem('routesSortBy', val);
    setPage(1);
  };

  const navigate = useNavigate();

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(config.apiRoutes.routes);
      setRoutes(res.data);
      const tags = [...new Set(res.data.flatMap((r) => r.tags || []))].sort();
      setAllTags(tags);
      setError('');
    } catch {
      setError('Unable to load routes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const filterRoutes = useCallback((data, search, showTemp, tag) => {
    let result = data;
    if (!showTemp) result = result.filter((r) => r.category !== 'temporary');
    if (tag) result = result.filter((r) => (r.tags || []).includes(tag));
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name?.toLowerCase().includes(s) ||
          r.path?.toLowerCase().includes(s) ||
          r.contentType?.toLowerCase().includes(s) ||
          r.content?.toLowerCase().includes(s) ||
          (r.tags || []).some((t) => t.toLowerCase().includes(s))
      );
    }
    setFilteredRoutes(result);
  }, []);

  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(searchTerm), 150);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchTerm]);

  useEffect(() => {
    filterRoutes(routes, debouncedSearch, showTemporary, activeTag);
    setPage(1);
  }, [routes, debouncedSearch, showTemporary, activeTag, filterRoutes]);

  const handleDeleteConfirm = async () => {
    if (!deleteRoute) return;
    try {
      await axios.delete(config.apiRoutes.route(deleteRoute._id));
      const updated = routes.filter((r) => r._id !== deleteRoute._id);
      setRoutes(updated);
    } catch {
      setError('Error deleting route');
    }
    setDeleteRoute(null);
  };

  const handleDeleteMultiple = async () => {
    try {
      await axios.post(config.apiRoutes.deleteMultiple, { ids: selectedRoutes });
      setRoutes(routes.filter((r) => !selectedRoutes.includes(r._id)));
      setSelectedRoutes([]);
    } catch {
      setError('Error deleting routes');
    }
    setDeleteMultiOpen(false);
  };

  const handleClone = (id) => {
    const route = routes.find((r) => r._id === id);
    setCloneTargetPath('');
    setCloneDialog({ id, name: route?.name || '' });
  };

  const handleCloneConfirm = async () => {
    if (!cloneDialog) return;
    try {
      await axios.post(config.apiRoutes.cloneRoute(cloneDialog.id), {
        targetPath: cloneTargetPath.trim() || undefined,
      });
      setSnackbar('Route cloned successfully');
      fetchRoutes();
    } catch (err) {
      setSnackbar(err.response?.data?.message || 'Failed to clone route');
    }
    setCloneDialog(null);
  };

  const handleSelect = (id, checked) => {
    setSelectedRoutes((prev) => (checked ? [...prev, id] : prev.filter((i) => i !== id)));
  };

  const handleSelectAll = (checked) => {
    setSelectedRoutes(checked ? filteredRoutes.map((r) => r._id) : []);
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setSnackbar('URL copied to clipboard');
  };

  const handleToggleTemp = (v) => {
    setShowTemporary(v);
    localStorage.setItem('showTemporaryRoutes', JSON.stringify(v));
  };

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
        <Box>
          <Typography variant="h5" sx={{ mb: 0.25 }}>
            Routes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredRoutes.length} route{filteredRoutes.length !== 1 ? 's' : ''}{' '}
            {routes.length !== filteredRoutes.length ? `of ${routes.length}` : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={sortBy}
              onChange={(e) => handleSortBy(e.target.value)}
              startAdornment={<SortIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.disabled' }} />}
              sx={{ fontSize: '0.8rem' }}
            >
              {SORT_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value} sx={{ fontSize: '0.8rem' }}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, display: 'flex' }}
          >
            <Tooltip title="Grid view">
              <IconButton
                size="small"
                onClick={() => handleViewMode('grid')}
                sx={{
                  borderRadius: '6px 0 0 6px',
                  bgcolor: viewMode === 'grid' ? alpha('#6366f1', 0.15) : 'transparent',
                }}
              >
                <GridViewIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="List view">
              <IconButton
                size="small"
                onClick={() => handleViewMode('list')}
                sx={{
                  borderRadius: '0 6px 6px 0',
                  bgcolor: viewMode === 'list' ? alpha('#6366f1', 0.15) : 'transparent',
                }}
              >
                <ViewListIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => setExportImportOpen(true)}
          >
            Export / Import
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/routes/new')}
          >
            New Route
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 1.5 }}>
          <TextField
            sx={{ flex: 1, minWidth: 200 }}
            placeholder="Search in all fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={showTemporary}
                onChange={(e) => handleToggleTemp(e.target.checked)}
                size="small"
              />
            }
            label={<Typography variant="caption">Show Temp</Typography>}
            sx={{ m: 0 }}
          />
          {selectedRoutes.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteMultiOpen(true)}
            >
              Delete ({selectedRoutes.length})
            </Button>
          )}
        </Box>

        {}
        {allTags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
            <TagIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Chip
              label="All"
              size="small"
              onClick={() => setActiveTag(null)}
              variant={!activeTag ? 'filled' : 'outlined'}
              color={!activeTag ? 'primary' : 'default'}
              sx={{ height: 22, fontSize: '0.72rem', cursor: 'pointer' }}
            />
            {allTags.map((tag) => {
              const c = tagColor(tag);
              return (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  sx={{
                    height: 22,
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    bgcolor: activeTag === tag ? alpha(c, 0.2) : alpha(c, 0.08),
                    color: c,
                    border: `1px solid ${alpha(c, activeTag === tag ? 0.5 : 0.2)}`,
                    fontWeight: activeTag === tag ? 600 : 400,
                  }}
                />
              );
            })}
          </Box>
        )}
      </Box>

      {}
      {filteredRoutes.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 0.5 }}>
          <Checkbox
            size="small"
            checked={selectedRoutes.length === filteredRoutes.length && filteredRoutes.length > 0}
            indeterminate={
              selectedRoutes.length > 0 && selectedRoutes.length < filteredRoutes.length
            }
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
          <Typography variant="caption" color="text.secondary">
            {selectedRoutes.length > 0 ? `${selectedRoutes.length} selected` : 'Select all'}
          </Typography>
        </Box>
      )}

      {}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredRoutes.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {routes.length === 0 ? 'No routes yet' : 'No routes match your filters'}
          </Typography>
          {routes.length === 0 ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/routes/new')}
              size="small"
            >
              Create your first route
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSearchTerm('');
                setActiveTag(null);
              }}
            >
              Clear filters
            </Button>
          )}
        </Box>
      ) : (
        (() => {
          const sorted = sortRoutes(filteredRoutes, sortBy);
          const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
          const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
          return (
            <>
              {viewMode === 'grid' ? (
                <Grid container spacing={2}>
                  {paged.map((route) => (
                    <Grid item xs={12} sm={6} lg={4} key={route._id}>
                      <RouteCard
                        route={route}
                        selected={selectedRoutes.includes(route._id)}
                        onSelect={handleSelect}
                        onDelete={setDeleteRoute}
                        onClone={handleClone}
                        onTest={setTestRoute}
                        onCopy={handleCopyUrl}
                        navigate={navigate}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  {paged.map((route) => (
                    <RouteRow
                      key={route._id}
                      route={route}
                      selected={selectedRoutes.includes(route._id)}
                      onSelect={handleSelect}
                      onDelete={setDeleteRoute}
                      onClone={handleClone}
                      onTest={setTestRoute}
                      onCopy={handleCopyUrl}
                      navigate={navigate}
                    />
                  ))}
                </Box>
              )}
              {totalPages > 1 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 1.5,
                    mt: 3,
                  }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    {page} / {totalPages}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </Box>
              )}
            </>
          );
        })()
      )}

      {}
      <DeleteConfirmDialog
        open={!!deleteRoute}
        onClose={() => setDeleteRoute(null)}
        onConfirm={handleDeleteConfirm}
        itemName={deleteRoute?.name}
        itemType="route"
      />

      <DeleteConfirmDialog
        open={deleteMultiOpen}
        onClose={() => setDeleteMultiOpen(false)}
        onConfirm={handleDeleteMultiple}
        itemName={`${selectedRoutes.length} routes`}
        itemType="routes"
      />

      {testRoute && (
        <RouteTestDialog open={!!testRoute} onClose={() => setTestRoute(null)} route={testRoute} />
      )}

      <ExportImportDialog
        open={exportImportOpen}
        onClose={() => setExportImportOpen(false)}
        onImportSuccess={fetchRoutes}
      />

      {}
      <Dialog open={!!cloneDialog} onClose={() => setCloneDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Clone Route
          </Typography>
          {cloneDialog && (
            <Typography variant="caption" color="text.secondary">
              {cloneDialog.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            label="Target path (optional)"
            value={cloneTargetPath}
            onChange={(e) => setCloneTargetPath(e.target.value)}
            placeholder="/my-clone"
            helperText="Leave empty to auto-generate a random path"
            InputProps={{ sx: { fontFamily: 'monospace' } }}
            sx={{ mt: 1 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={() => setCloneDialog(null)}
          >
            Cancel
          </Button>
          <Button size="small" variant="contained" onClick={handleCloneConfirm}>
            Clone
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default RoutesList;
