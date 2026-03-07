import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Route as RouteIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { alpha } from '@mui/material/styles';

const SIDEBAR_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 64;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'Routes', icon: <RouteIcon />, path: '/routes' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const Layout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed && !isMobile ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleNav = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const SidebarContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', py: 1 }}>
      {}
      <Box
        sx={{
          px: collapsed ? 1 : 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 56,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <RouteIcon sx={{ color: '#fff', fontSize: 16 }} />
            </Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '0.95rem',
                letterSpacing: '-0.01em',
                color: 'text.primary',
              }}
            >
              Hoster
            </Typography>
          </Box>
        )}
        {collapsed && (
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RouteIcon sx={{ color: '#fff', fontSize: 16 }} />
          </Box>
        )}
        {!isMobile && !collapsed && (
          <IconButton
            size="small"
            onClick={() => setCollapsed(true)}
            sx={{ color: 'text.secondary', p: 0.5 }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        )}
        {!isMobile && collapsed && (
          <IconButton
            size="small"
            onClick={() => setCollapsed(false)}
            sx={{ color: 'text.secondary', p: 0.5, mt: 1 }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ mx: 1, mb: 1 }} />

      {}
      <List sx={{ px: 0.5, flex: 1 }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Tooltip key={item.path} title={collapsed ? item.label : ''} placement="right">
              <ListItemButton
                onClick={() => handleNav(item.path)}
                selected={active}
                sx={{
                  minHeight: 40,
                  borderRadius: '8px !important',
                  mx: '4px !important',
                  mb: 0.5,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1 : 1.5,
                  ...(active && {
                    borderLeft: `3px solid ${theme.palette.primary.main}`,
                    pl: collapsed ? 1 : '9px',
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) },
                  }),
                  ...(!active && {
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                  }),
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 'auto' : 36,
                    color: active ? 'primary.main' : 'text.secondary',
                    mr: collapsed ? 0 : 0,
                  }}
                >
                  {React.cloneElement(item.icon, { fontSize: 'small' })}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: active ? 600 : 400,
                      color: active ? 'text.primary' : 'text.secondary',
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      <Divider sx={{ mx: 1, mb: 1 }} />

      {}
      <Box
        sx={{
          px: collapsed ? 0.5 : 1.5,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 1,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Avatar
              sx={{
                width: 28,
                height: 28,
                fontSize: '0.75rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)',
                flexShrink: 0,
              }}
            >
              {currentUser?.username?.[0]?.toUpperCase() || 'A'}
            </Avatar>
            <Typography
              sx={{
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'text.secondary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentUser?.username || 'admin'}
            </Typography>
          </Box>
        )}
        <Tooltip title="Logout" placement="right">
          <IconButton
            size="small"
            onClick={logout}
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'error.main', bgcolor: alpha('#f87171', 0.08) },
              flexShrink: 0,
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {}
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar variant="dense">
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Hoster
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box' } }}
        >
          <SidebarContent />
        </Drawer>
      )}

      {}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            transition: 'width 0.2s ease',
            '& .MuiDrawer-paper': {
              width: sidebarWidth,
              boxSizing: 'border-box',
              transition: 'width 0.2s ease',
              overflowX: 'hidden',
            },
          }}
        >
          <SidebarContent />
        </Drawer>
      )}

      {}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          pt: isMobile ? '48px' : 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3 }, flex: 1, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
