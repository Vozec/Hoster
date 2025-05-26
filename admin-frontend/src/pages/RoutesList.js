import React, { useState, useEffect } from 'react';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { 
  Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, Box, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Alert, Card, CardContent, Chip, Divider, Grid, Tooltip, TextField,
  Checkbox, FormControlLabel, Switch, InputAdornment, Toolbar
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Visibility as VisibilityIcon,
  Add as AddIcon,
  OpenInNew as OpenInNewIcon,
  Code as CodeIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  DeleteSweep as DeleteSweepIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RouteForm from './RouteForm';
import config from '../config';

const RoutesList = () => {
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTemporary, setShowTemporary] = useState(() => {
    const savedState = localStorage.getItem('showTemporaryRoutes');
    return savedState ? JSON.parse(savedState) : false;
  });
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [deleteMultipleDialogOpen, setDeleteMultipleDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(config.apiRoutes.routes);
      setRoutes(response.data);
      filterRoutes(response.data, searchTerm, showTemporary);
      setError('');
    } catch (err) {
      console.error('Error retrieving routes:', err);
      setError('Unable to load routes');
    } finally {
      setLoading(false);
    }
  };
  
  const filterRoutes = (routesData, search, showTemp) => {
    let result = routesData;
    
    // Filter by category if temporary routes are not displayed
    if (!showTemp) {
      result = result.filter(route => route.category !== 'temporary');
    }
    
    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(route => 
        route.name.toLowerCase().includes(searchLower) || 
        route.path.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredRoutes(result);
  };
  
  // Update filters when states change
  useEffect(() => {
    if (routes.length > 0) {
      filterRoutes(routes, searchTerm, showTemporary);
    }
  }, [searchTerm, showTemporary]);

  const handleDeleteClick = (route) => {
    setRouteToDelete(route);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!routeToDelete) return;
    
    try {
      await axios.delete(config.apiRoutes.route(routeToDelete._id));
      const updatedRoutes = routes.filter(route => route._id !== routeToDelete._id);
      setRoutes(updatedRoutes);
      filterRoutes(updatedRoutes, searchTerm, showTemporary);
      setDeleteDialogOpen(false);
      setRouteToDelete(null);
    } catch (err) {
      console.error('Error deleting route:', err);
      setError('Error deleting route');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRouteToDelete(null);
  };
  
  // Fonctions pour la sélection multiple
  const handleSelectRoute = (event, routeId) => {
    if (event.target.checked) {
      setSelectedRoutes([...selectedRoutes, routeId]);
    } else {
      setSelectedRoutes(selectedRoutes.filter(id => id !== routeId));
    }
  };
  
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRoutes(filteredRoutes.map(route => route._id));
    } else {
      setSelectedRoutes([]);
    }
  };
  
  const handleDeleteMultipleClick = () => {
    if (selectedRoutes.length === 0) return;
    setDeleteMultipleDialogOpen(true);
  };
  
  const handleDeleteMultipleConfirm = async () => {
    try {
      await axios.post(config.apiRoutes.deleteMultiple, { ids: selectedRoutes });
      const updatedRoutes = routes.filter(route => !selectedRoutes.includes(route._id));
      setRoutes(updatedRoutes);
      filterRoutes(updatedRoutes, searchTerm, showTemporary);
      setSelectedRoutes([]);
      setDeleteMultipleDialogOpen(false);
    } catch (err) {
      console.error('Error deleting multiple routes:', err);
      setError('Error deleting multiple routes');
    }
  };
  
  const handleDeleteMultipleCancel = () => {
    setDeleteMultipleDialogOpen(false);
  };

  // Content type utility functions
  const getContentTypeLabel = (contentType) => {
    switch (contentType) {
      case 'text/html':
        return 'HTML';
      case 'application/json':
        return 'JSON';
      case 'text/plain':
        return 'Text';
      case 'application/xml':
        return 'XML';
      case 'application/javascript':
        return 'JavaScript';
      default:
        return 'Custom';
    }
  };

  const getContentTypeColor = (contentType) => {
    switch (contentType) {
      case 'text/html':
        return 'primary';
      case 'application/json':
        return 'secondary';
      case 'text/plain':
        return 'success';
      case 'application/xml':
        return 'info';
      case 'application/javascript':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleViewLogs = (routeId) => {
    navigate(config.adminRoutes.routeDetails(routeId));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>


      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3, gap: 2 }}>
        {selectedRoutes.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={handleDeleteMultipleClick}
            sx={{ borderRadius: '8px', textTransform: 'none' }}
          >
            Delete Selected ({selectedRoutes.length})
          </Button>
        )}
      </Box>
      
      <Paper sx={{ p: 4, mb: 3, borderRadius: '12px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name or path..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: '8px' }
              }}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showTemporary}
                    onChange={(e) => {
                      const newValue = e.target.checked;
                      setShowTemporary(newValue);
                      localStorage.setItem('showTemporaryRoutes', JSON.stringify(newValue));
                    }}
                    color="primary"
                  />
                }
                label="Show Temporary Routes"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {routes.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
            No routes have been created yet
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setCreateDialogOpen(true)}
            startIcon={<AddIcon />}
            sx={{ 
              mt: 2, 
              borderRadius: '8px', 
              textTransform: 'none', 
              py: 1, 
              px: 3,
              borderColor: '#1976d2',
              color: '#1976d2',
              '&:hover': {
                borderColor: '#1976d2',
                bgcolor: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            Create your first route
          </Button>
        </Paper>
      ) : filteredRoutes.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
            No routes match your search criteria
          </Typography>
          {!showTemporary && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setShowTemporary(true)}
              sx={{ borderRadius: '8px', textTransform: 'none', py: 1, px: 3, mr: 2 }}
            >
              Show Temporary Routes
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={() => { setSearchTerm(''); setShowTemporary(true); }}
            sx={{ borderRadius: '8px', textTransform: 'none', py: 1, px: 3 }}
          >
            Clear Filters
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'background.paper' }}>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  <Checkbox
                    checked={selectedRoutes.length === filteredRoutes.length}
                    onChange={handleSelectAll}
                    color="primary"
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Path</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Content Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Last Modified</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRoutes.map((route) => (
                <TableRow key={route._id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRoutes.includes(route._id)}
                      onChange={(e) => handleSelectRoute(e, route._id)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    {route.name}
                    {route.category === 'temporary' && (
                      <Chip
                        label="Temporary"
                        size="small"
                        color="warning"
                        sx={{ ml: 1, fontSize: '0.7rem' }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{route.path}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getContentTypeLabel(route.contentType)} 
                      color={getContentTypeColor(route.contentType)}
                      size="small"
                      icon={<CodeIcon />}
                    />
                  </TableCell>
                  <TableCell>{new Date(route.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(route.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="View Logs">
                        <IconButton 
                          color="info" 
                          onClick={() => handleViewLogs(route._id)}
                          size="small"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Visit Route">
                        <IconButton 
                          color="success" 
                          component="a"
                          href={route.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                        >
                          <OpenInNewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton 
                          color="primary" 
                          component={Link} 
                          to={config.adminRoutes.editRoute(route._id)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteClick(route)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={!!routeToDelete}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={routeToDelete?.name}
        itemType="route"
      />
      
      {/* Delete multiple confirmation dialog */}
      <DeleteConfirmDialog
        open={deleteMultipleDialogOpen}
        onClose={handleDeleteMultipleCancel}
        onConfirm={handleDeleteMultipleConfirm}
        itemName={`${selectedRoutes.length} routes sélectionnées`}
        itemType="routes"
      />

      {/* Dialog pour la création de route */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Route</DialogTitle>
        <DialogContent>
          <RouteForm onSuccess={() => { setCreateDialogOpen(false); fetchRoutes(); }} isPopup />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoutesList;
