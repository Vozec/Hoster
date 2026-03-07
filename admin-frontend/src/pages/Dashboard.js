import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Route as RouteIcon,
  Visibility as VisibilityIcon,
  AccessTime as AccessTimeIcon,
  Today as TodayIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
import config from '../config';
import { alpha } from '@mui/material/styles';

const PALETTE = {
  primary: '#6366f1',
  secondary: '#22d3ee',
  success: '#4ade80',
  warning: '#fbbf24',
};

const StatCard = ({ label, value, icon, color, subtitle }) => (
  <Card
    sx={{
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: color,
      },
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: alpha(color, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { sx: { color, fontSize: 20 } })}
        </Box>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
        {value != null ? value.toLocaleString() : '—'}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {label}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', mt: 0.25 }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          bgcolor: '#1a1a24',
          border: '1px solid #2a2a3a',
          borderRadius: 1,
          px: 1.5,
          py: 1,
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ color: PALETTE.primary, fontWeight: 600 }}>
          {payload[0].value} requests
        </Typography>
      </Box>
    );
  }
  return null;
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(config.apiRoutes.stats);
      setStats(response.data);
    } catch (err) {
      setError('Unable to load statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const maxVisits =
    stats?.topRoutes?.length > 0 ? Math.max(...stats.topRoutes.map((r) => r.visits)) : 1;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  };

  const formatTime = (ts) => {
    return new Date(ts).toLocaleString('en', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      {}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.25 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of your hosted routes and traffic
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton
            onClick={fetchStats}
            disabled={loading}
            size="small"
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <StatCard
                label="Total Routes"
                value={stats?.totalRoutes ?? 0}
                icon={<RouteIcon />}
                color={PALETTE.primary}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard
                label="Total Requests"
                value={stats?.totalLogs ?? 0}
                icon={<VisibilityIcon />}
                color={PALETTE.secondary}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard
                label="Temporary Routes"
                value={stats?.temporaryRoutes ?? 0}
                icon={<ScheduleIcon />}
                color={PALETTE.warning}
                subtitle={`${stats?.totalRoutes ? Math.round((stats.temporaryRoutes / stats.totalRoutes) * 100) : 0}% of total`}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard
                label="Requests Today"
                value={stats?.todayLogs ?? 0}
                icon={<TodayIcon />}
                color={PALETTE.success}
              />
            </Grid>
          </Grid>

          {}
          {stats?.activityData && stats.activityData.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <TrendingUpIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  Request Activity — Last 7 Days
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={stats.activityData}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: alpha(PALETTE.primary, 0.06) }}
                  />
                  <Bar
                    dataKey="count"
                    fill={PALETTE.primary}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          )}

          <Grid container spacing={3}>
            {}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                  <TrendingUpIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                  <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                    Most Visited Routes
                  </Typography>
                </Box>
                {stats?.topRoutes?.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {stats.topRoutes.map((route, i) => (
                      <Box key={route.routeId}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500, fontSize: '0.85rem' }}
                            >
                              {route.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ fontFamily: 'monospace', color: 'text.disabled' }}
                            >
                              {route.path}
                            </Typography>
                          </Box>
                          <Chip
                            label={route.visits}
                            size="small"
                            color="primary"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(route.visits / maxVisits) * 100}
                          sx={{ height: 4 }}
                        />
                        {i < stats.topRoutes.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.disabled">
                      No data yet
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                  <AccessTimeIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                  <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                    Recent Requests
                  </Typography>
                </Box>
                {stats?.recentLogs?.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {stats.recentLogs.map((log, i) => (
                      <Box key={log._id}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 1,
                          }}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                              <Chip
                                label={log.method || 'GET'}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  fontFamily: 'monospace',
                                  bgcolor:
                                    log.method === 'POST'
                                      ? alpha('#22d3ee', 0.12)
                                      : alpha('#6366f1', 0.12),
                                  color: log.method === 'POST' ? '#22d3ee' : '#818cf8',
                                  border: 'none',
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: 'monospace',
                                  color: 'text.primary',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  fontSize: '0.8rem',
                                }}
                              >
                                {log.routeId?.path || 'Unknown route'}
                              </Typography>
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{ color: 'text.disabled', fontSize: '0.72rem' }}
                            >
                              {log.ip} · {formatTime(log.timestamp)}
                            </Typography>
                          </Box>
                        </Box>
                        {i < stats.recentLogs.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.disabled">
                      No recent requests
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
