import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-okaidia.css';
import { 
  Typography, TextField, Button, Box, Paper, 
  FormControl, InputLabel, Select, MenuItem, 
  CircularProgress, Alert, FormHelperText,
  Card, CardContent, Chip, Divider, Grid, IconButton,
  Tooltip, FormControlLabel, Switch
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Save as SaveIcon, 
  ArrowBack as ArrowBackIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import config from '../config';

const contentTypes = [
  { value: 'text/html', label: 'HTML' },
  { value: 'application/json', label: 'JSON' },
  { value: 'text/plain', label: 'Plain Text' },
  { value: 'application/xml', label: 'XML' },
  { value: 'application/javascript', label: 'JavaScript' },
  { value: 'application/x-httpd-php', label: 'PHP' },
  { value: 'custom', label: 'Custom' }
];

const RouteForm = ({ onSuccess, isPopup }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    path: '',
    name: '',
    contentType: 'text/html',
    customContentType: '',
    content: '',
    category: 'classic',
    isDefault: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetchLoading, setFetchLoading] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode) {
      fetchRoute();
    }
  }, [id]);

  const fetchRoute = async () => {
    try {
      const response = await axios.get(config.apiRoutes.route(id));
      const routeData = response.data;
      
      // Vérifier si le content type est personnalisé
      const isCustomContentType = !contentTypes.some(type => type.value === routeData.contentType);
      
      if (isCustomContentType) {
        setFormData({
          ...routeData,
          customContentType: routeData.contentType,
          contentType: 'custom'
        });
      } else {
        setFormData(routeData);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération de la route:', err);
      setError('Impossible de charger les données de la route');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'isDefault' && checked ? {
        path: '/',
        name: 'Default Route'
      } : {})
    }));
  };

  const validateForm = () => {
    // Si un chemin est fourni et ne commence pas par /, l'ajouter
    if (formData.path && !formData.path.startsWith('/')) {
      setFormData(prev => ({ ...prev, path: '/' + formData.path }));
    }
    
    // Si le nom n'est pas fourni, générer un nom basé sur le chemin
    if (!formData.name) {
      const path = formData.path || '';
      const generatedName = path === '/' ? 'Default Route' : path
        .split('/')
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ') || 'New Route';
      setFormData(prev => ({ ...prev, name: generatedName }));
    }
    
    // Vérifier le type de contenu personnalisé
    if (formData.contentType === 'custom' && !formData.customContentType) {
      setError('Custom content type is required when selecting Custom');
      return false;
    }
    
    // Le contenu est toujours obligatoire
    if (!formData.content) {
      setError('Content is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Create a copy of formData to submit
    const dataToSubmit = { ...formData };
    
    // If custom content type is selected, use the custom value
    if (formData.contentType === 'custom' && formData.customContentType) {
      dataToSubmit.contentType = formData.customContentType;
    }
    
    // Remove customContentType field as it's not needed in the API
    delete dataToSubmit.customContentType;
    
    try {
      if (isEditMode) {
        await axios.put(config.apiRoutes.route(id), dataToSubmit);
        setSuccess('Route updated successfully');
        if (onSuccess) onSuccess();
        else setTimeout(() => { navigate(config.adminRoutes.home); }, 1000);
      } else {
        await axios.post(config.apiRoutes.routes, dataToSubmit);
        setSuccess('Route created successfully');
        if (onSuccess) onSuccess();
        else navigate(config.adminRoutes.home);
      }
    } catch (err) {
      console.error('Error saving route:', err);
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

  return (
    <div>
      {!isPopup && (
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
      )}
      
      <Box sx={{ mb: 3 }}>
        <Card sx={{ 
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          {(error || success) && (
            <Box sx={{ px: 3, pt: 3 }}>
              {error && (
                <Alert severity="error" sx={{ mb: error && success ? 2 : 0 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success">
                  {success}
                </Alert>
              )}
            </Box>
          )}
          
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={4}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Path"
                    name="path"
                    value={formData.path}
                    onChange={handleChange}
                    fullWidth
                    placeholder="/example-route (leave empty for auto-generation)"
                    helperText="The URL path for this route (must start with /)"
                    disabled={loading || (isEditMode && formData.isDefault)}
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: '8px' }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                    placeholder="Example Route (leave empty for auto-generation)"
                    helperText="A descriptive name for this route"
                    disabled={loading}
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: '8px' }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined" disabled={loading}>
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                      labelId="category-label"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      label="Category"
                    >
                      <MenuItem value="classic">Classic</MenuItem>
                      <MenuItem value="temporary">Temporary</MenuItem>
                    </Select>
                    <FormHelperText>
                      Classic routes are permanent, temporary routes are for quick sharing
                    </FormHelperText>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined" disabled={loading}>
                    <InputLabel id="content-type-label">Content Type</InputLabel>
                    <Select
                      labelId="content-type-label"
                      label="Content Type"
                      name="contentType"
                      value={formData.contentType}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      sx={{ borderRadius: '8px' }}
                    >
                      {contentTypes.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip 
                              icon={<CodeIcon />} 
                              label={option.label} 
                              size="small" 
                              color={
                                option.value === 'text/html' ? 'primary' :
                                option.value === 'application/json' ? 'secondary' :
                                option.value === 'text/plain' ? 'success' :
                                option.value === 'application/xml' ? 'info' :
                                option.value === 'application/javascript' ? 'warning' :
                                'default'
                              }
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              {option.value !== 'custom' ? option.value : ''}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {formData.isDefault ? 
                        'Default route is always JavaScript' : 
                        'Select the content type this route will serve'}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                
                {formData.contentType === 'custom' && (
                  <Grid item xs={12}>
                    <TextField
                      label="Custom Content Type"
                      name="customContentType"
                      value={formData.customContentType}
                      onChange={handleChange}
                      fullWidth
                      required
                      placeholder="e.g.: application/pdf, image/png, etc."
                      helperText="Enter a valid MIME type"
                      disabled={loading}
                      variant="outlined"
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  {formData.contentType === 'text/html' ? (
                    <Box>
                      <Box sx={{ 
                        border: '1px solid rgba(255, 255, 255, 0.23)', 
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        <Box sx={{ 
                          p: 1, 
                          bgcolor: 'rgba(255, 255, 255, 0.09)', 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.23)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            HTML Content
                          </Typography>
                          <Chip 
                            label="HTML" 
                            size="small" 
                            color="primary" 
                            icon={<CodeIcon />} 
                          />
                        </Box>
                        <Box sx={{ 
                          bgcolor: '#272822',
                          '& textarea': {
                            outline: 'none !important'
                          },
                          '& .token.tag': {
                            color: '#f92672 !important'
                          },
                          '& .token.attr-name': {
                            color: '#a6e22e !important'
                          },
                          '& .token.attr-value': {
                            color: '#e6db74 !important'
                          },
                          '& .token.punctuation': {
                            color: '#f8f8f2 !important'
                          },
                          '& .token.script': {
                            color: '#66d9ef !important'
                          }
                        }}>
                          <Editor
                            value={formData.content}
                            onValueChange={(code) => handleChange({ target: { name: 'content', value: code } })}
                            highlight={(code) => {
                              try {
                                return highlight(code, languages.markup, 'markup');
                              } catch (e) {
                                return code;
                              }
                            }}
                            padding={16}
                            disabled={loading}
                            placeholder="<html>&#10;  <body>&#10;    <h1>Hello World</h1>&#10;  </body>&#10;</html>"
                            style={{
                              fontFamily: '"Fira Code", Consolas, Monaco, "Courier New", monospace',
                              fontSize: '14px',
                              lineHeight: '1.6',
                              minHeight: '400px',
                              backgroundColor: '#272822',
                              color: '#f8f8f2',
                              caretColor: '#f8f8f0'
                            }}
                            textareaClassName="code-editor-textarea"
                          />
                        </Box>
                      </Box>
                      <FormHelperText sx={{ px: 2, py: 1 }}>
                        The HTML content to be served when this route is accessed
                      </FormHelperText>
                    </Box>
                  ) : (
                    <TextField
                      label="Content"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      fullWidth
                      required
                      multiline
                      rows={15}
                      helperText="The content to be served when this route is accessed"
                      disabled={loading}
                      variant="outlined"
                      InputProps={{
                        sx: { 
                          borderRadius: '8px',
                          fontFamily: 'monospace',
                          fontSize: '0.9rem'
                        }
                      }}
                    />
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                    <Button 
                      variant="outlined" 
                      onClick={() => navigate(config.adminRoutes.home)}
                      disabled={loading}
                      sx={{ 
                        borderRadius: '8px', 
                        textTransform: 'none',
                        borderColor: '#1976d2',
                        color: '#1976d2',
                        '&:hover': {
                          borderColor: '#1976d2',
                          bgcolor: 'rgba(25, 118, 210, 0.04)'
                        }
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      color="primary"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      sx={{ 
                        borderRadius: '8px', 
                        textTransform: 'none', 
                        py: 1, 
                        px: 3,
                        bgcolor: '#1976d2',
                        '&:hover': {
                          bgcolor: '#1565c0'
                        }
                      }}
                    >
                      {loading ? 'Saving...' : (isEditMode ? 'Update' : 'Create Route')}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
};

export default RouteForm;
