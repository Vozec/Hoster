import React, { useState, useEffect } from 'react';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { 
  Typography, Paper, Box, CircularProgress, Alert, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, Button, Chip, Divider, Accordion, AccordionSummary,
  AccordionDetails, Tooltip, IconButton, Tab, Tabs, Grid, Container, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';

import { useParams, useNavigate } from 'react-router-dom';
import { 
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  OpenInNew as OpenInNewIcon,
  Code as CodeIcon,
  AccessTime as AccessTimeIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import axios from 'axios';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import socketService from '../services/socketService';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

const RouteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [route, setRoute] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [success, setSuccess] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    target: '',
    port: '',
    ssl: false
  });
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);

  useEffect(() => {
    fetchRouteAndLogs();
    
    // Configurer la connexion WebSocket pour les logs en temps réel
    socketService.connect();
    socketService.subscribeToRouteLogs(id, (newLog) => {
      setLogs(prevLogs => [newLog, ...prevLogs]);
    });
    
    // Cleanup subscription on unmount
    return () => {
      if (id) {
        socketService.unsubscribeFromRouteLogs(id);
      }
    };
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Fonctions utilitaires pour les types de contenu
  const getContentTypeLabel = (contentType) => {
    switch (contentType) {
      case 'text/html':
        return 'HTML';
      case 'application/json':
        return 'JSON';
      case 'text/plain':
        return 'Texte';
      case 'application/xml':
        return 'XML';
      case 'application/javascript':
        return 'JavaScript';
      default:
        return contentType;
    }
  };

  const getContentTypeColor = (contentType) => {
    switch (contentType) {
      case 'text/html':
        return 'primary';
      case 'application/json':
        return 'secondary';
      case 'text/plain':
        return 'default';
      case 'application/xml':
        return 'info';
      case 'application/javascript':
        return 'warning';
      default:
        return 'default';
    }
  };

  const fetchRouteAndLogs = async () => {
    try {
      setLoading(true);
      
      // Récupérer les détails de la route
      const routeResponse = await axios.get(config.apiRoutes.route(id));
      setRoute(routeResponse.data);
      
      // Récupérer les logs d'accès
      const logsResponse = await axios.get(config.apiRoutes.routeLogs(id));
      setLogs(logsResponse.data);
      
      setError('');
      setEditForm({
        name: routeResponse.data.name,
        target: routeResponse.data.target,
        port: routeResponse.data.port,
        ssl: routeResponse.data.ssl
      });
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const getContentPreview = () => {
    if (!route) return null;
    
    switch (route.contentType) {
      case 'text/html':
        return (
          <SyntaxHighlighter language="html" style={docco}>
            {route.content}
          </SyntaxHighlighter>
        );
      case 'application/json':
        try {
          const formattedJson = JSON.stringify(JSON.parse(route.content), null, 2);
          return (
            <SyntaxHighlighter language="json" style={docco}>
              {formattedJson}
            </SyntaxHighlighter>
          );
        } catch (e) {
          return (
            <SyntaxHighlighter language="json" style={docco}>
              {route.content}
            </SyntaxHighlighter>
          );
        }
      case 'application/xml':
        return (
          <SyntaxHighlighter language="xml" style={docco}>
            {route.content}
          </SyntaxHighlighter>
        );
      default:
        return (
          <SyntaxHighlighter language="text" style={docco}>
            {route.content}
          </SyntaxHighlighter>
        );
    }
  };

  const handleCategoryChange = async () => {
    try {
      const newCategory = route.category === 'temporary' ? 'classic' : 'temporary';
      await axios.put(config.apiRoutes.route(id), {
        ...route,
        category: newCategory
      });
      setRoute(prev => ({ ...prev, category: newCategory }));
      setSuccess('Category updated successfully');
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update category');
    }
  };

  const handleEditClick = () => {
    if (!isAuthenticated) {
      navigate(config.adminRoutes.login);
      return;
    }
    navigate(config.adminRoutes.editRoute(id));
  };

  const handleLogsClick = () => {
    if (!isAuthenticated) {
      navigate(config.adminRoutes.login);
      return;
    }
    setLogsDialogOpen(true);
    fetchLogs();
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(config.apiRoutes.route(id), editForm);
      setEditDialogOpen(false);
      fetchRouteAndLogs();
    } catch (err) {
      setError('Erreur lors de la mise à jour de la route');
      console.error('Error updating route:', err);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(config.apiRoutes.route(id));
      setDeleteDialogOpen(false);
      navigate(config.adminRoutes.home);
    } catch (err) {
      setError('Erreur lors de la suppression de la route');
      console.error('Error deleting route:', err);
      setDeleteDialogOpen(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      setLogsError(null);
      const response = await axios.get(config.apiRoutes.routeLogs(id));
      setLogs(response.data);
    } catch (err) {
      setLogsError('Erreur lors du chargement des logs');
      console.error('Error fetching logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!route) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">Route non trouvée</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3 }}>
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(config.adminRoutes.home)}
          sx={{ 
            borderRadius: '8px', 
            textTransform: 'none',
            borderColor: '#4a6da7',
            color: '#4a6da7',
            '&:hover': {
              borderColor: '#4a6da7',
              bgcolor: 'rgba(74, 109, 167, 0.04)'
            }
          }}
        >
          Back to List
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" component="h1">
              {route.name}
            </Typography>
            <Box>
              <Tooltip title="Voir les logs">
                <IconButton 
                  onClick={handleLogsClick} 
                  color="primary" 
                  sx={{ 
                    mr: 1,
                    border: '1px solid #4a6da7',
                    color: '#4a6da7',
                    '&:hover': {
                      bgcolor: 'rgba(74, 109, 167, 0.04)'
                    }
                  }}
                >
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Modifier">
                <IconButton 
                  onClick={handleEditClick} 
                  color="primary" 
                  sx={{ 
                    mr: 1,
                    border: '1px solid #4a6da7',
                    color: '#4a6da7',
                    '&:hover': {
                      bgcolor: 'rgba(74, 109, 167, 0.04)'
                    }
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Supprimer">
                <IconButton 
                  onClick={handleDeleteClick} 
                  color="error"
                  sx={{ 
                    border: '1px solid #d32f2f',
                    color: '#d32f2f',
                    '&:hover': {
                      bgcolor: 'rgba(211, 47, 47, 0.04)'
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        sx={{ 
          mb: 3, 
          borderBottom: 1, 
          borderColor: 'divider',
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 'medium',
            minHeight: '48px',
          }
        }}
      >
        <Tab icon={<InfoIcon />} label="Information" iconPosition="start" />
        <Tab icon={<HistoryIcon />} label="Access Logs" iconPosition="start" />
      </Tabs>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center' }}>
                  <InfoIcon sx={{ mr: 1 }} /> General Information
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                      Name
                    </Typography>
                    <Typography variant="body1">
                      {route.name}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                      Path
                    </Typography>
                    <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                      {route.path}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                      Content Type
                    </Typography>
                    <Chip 
                      label={getContentTypeLabel(route.contentType)} 
                      color={getContentTypeColor(route.contentType)} 
                      size="small"
                      icon={<CodeIcon />}
                      sx={{ mt: 0.5 }}
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                      {route.contentType}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                      Created on
                    </Typography>
                    <Typography variant="body1">
                      {new Date(route.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                      Last modified
                    </Typography>
                    <Typography variant="body1">
                      {new Date(route.updatedAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center' }}>
                  <CodeIcon sx={{ mr: 1 }} /> Content Preview
                </Typography>
                <Box className="content-preview" sx={{ 
                  mt: 2,
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  bgcolor: '#f8f8f8'
                }}>
                  {getContentPreview()}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Card sx={{ 
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4a6da7', display: 'flex', alignItems: 'center' }}>
                <HistoryIcon sx={{ mr: 1 }} /> Access Logs
              </Typography>
              <Chip 
                label="Real-time" 
                color="success" 
                size="small"
                icon={<RefreshIcon style={{ fontSize: '0.8rem' }} />}
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
            
            {logsLoading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : logsError ? (
              <Alert severity="error">{logsError}</Alert>
            ) : logs.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  No access logs for this route
                </Typography>
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                {logs.map((log, index) => (
                  <Accordion 
                    key={log._id} 
                    sx={{ 
                      mb: 1,
                      boxShadow: 'none',
                      border: '1px solid #eee',
                      borderRadius: '8px !important',
                      '&:before': { display: 'none' },
                      overflow: 'hidden'
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ 
                        bgcolor: '#2d2d2d',
                        color: '#fff',
                        '&:hover': {
                          bgcolor: '#363636'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: '#fff' }} />
                          <Typography variant="body2" sx={{ color: '#fff' }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                        <Chip 
                          label={log.method} 
                          size="small" 
                          color={log.method === 'GET' ? 'success' : 'primary'} 
                          sx={{ mr: 2 }}
                        />
                        <Typography variant="body2" sx={{ color: '#fff', mr: 2 }}>
                          IP: {log.ip}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Complete Request:
                      </Typography>
                      <Box sx={{ 
                        bgcolor: '#2d2d2d', 
                        color: '#fff', 
                        p: 2, 
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        whiteSpace: 'pre-wrap',
                        overflowX: 'auto',
                        backgroundColor: '#2d2d2d !important'
                      }}>
                        {log.rawRequest || `${log.method} ${route.path} HTTP/1.1\nUser-Agent: ${log.userAgent}\nHost: ${window.location.host}\n`}
                      </Box>
                      
                      {log.query && Object.keys(log.query).length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Request Parameters:
                          </Typography>
                          <SyntaxHighlighter language="json" style={docco}>
                            {JSON.stringify(log.query, null, 2)}
                          </SyntaxHighlighter>
                        </Box>
                      )}
                      
                      {log.body && Object.keys(log.body).length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            Request Body:
                          </Typography>
                          <SyntaxHighlighter language="json" style={docco}>
                            {JSON.stringify(log.body, null, 2)}
                          </SyntaxHighlighter>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
      {/* Dialogue de confirmation de suppression */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={route?.name}
        itemType="route"
      />
    </Container>
  );
};

export default RouteDetails;
