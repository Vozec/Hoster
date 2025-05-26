import React, { useState, useEffect } from 'react';
import { 
  Typography, Grid, Paper, Box, Card, CardContent, 
  List, ListItem, ListItemText, Divider, CircularProgress 
} from '@mui/material';
import axios from 'axios';
import config from '../config';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Use the complete URL from the configuration
        const response = await axios.get(config.apiRoutes.stats);
        setStats(response.data);
      } catch (err) {
        console.error('Error retrieving statistics:', err);
        setError('Unable to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography color="error" variant="h6">{error}</Typography>
      </Box>
    );
  }

  return (
    <div className="dashboard-stats">
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">Routes</Typography>
            <Typography variant="h3">{stats?.totalRoutes || 0}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">Accès</Typography>
            <Typography variant="h3">{stats?.totalLogs || 0}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Routes les plus visitées
              </Typography>
              {stats?.topRoutes && stats.topRoutes.length > 0 ? (
                <List>
                  {stats.topRoutes.map((route, index) => (
                    <React.Fragment key={route.routeId}>
                      <ListItem>
                        <ListItemText 
                          primary={route.name} 
                          secondary={`${route.path} - ${route.visits} visites`} 
                        />
                      </ListItem>
                      {index < stats.topRoutes.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Aucune donnée disponible
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Derniers accès
              </Typography>
              {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                <List>
                  {stats.recentLogs.map((log, index) => (
                    <React.Fragment key={log._id}>
                      <ListItem>
                        <ListItemText 
                          primary={log.routeId?.path || 'Route inconnue'} 
                          secondary={`${new Date(log.timestamp).toLocaleString()} - ${log.ip} - ${log.method}`} 
                        />
                      </ListItem>
                      {index < stats.recentLogs.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Aucun log récent
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;
