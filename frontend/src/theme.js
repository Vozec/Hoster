import { createTheme, alpha } from '@mui/material/styles';

const palette = {
  bg: '#0a0a0f',
  paper: '#111118',
  elevated: '#1a1a24',
  border: '#2a2a3a',
  primary: '#6366f1',
  primaryHover: '#818cf8',
  secondary: '#22d3ee',
  success: '#4ade80',
  error: '#f87171',
  warning: '#fbbf24',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: palette.primary,
      light: palette.primaryHover,
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: palette.secondary,
      contrastText: '#0a0a0f',
    },
    success: { main: palette.success },
    error: { main: palette.error },
    warning: { main: palette.warning },
    background: {
      default: palette.bg,
      paper: palette.paper,
    },
    text: {
      primary: palette.textPrimary,
      secondary: palette.textSecondary,
      disabled: palette.textMuted,
    },
    divider: palette.border,
    action: {
      hover: alpha(palette.primary, 0.08),
      selected: alpha(palette.primary, 0.12),
      disabledBackground: alpha('#ffffff', 0.06),
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'system-ui',
      'sans-serif',
    ].join(','),
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 500, color: palette.textSecondary },
    subtitle2: { fontWeight: 500, color: palette.textSecondary },
    body2: { color: palette.textSecondary },
    caption: { color: palette.textMuted },
    button: { fontWeight: 500, letterSpacing: '0' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: palette.bg,
          scrollbarWidth: 'thin',
          scrollbarColor: `${palette.border} transparent`,
        },
        '*::-webkit-scrollbar': {
          width: '6px',
          height: '6px',
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          background: palette.border,
          borderRadius: '3px',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: '#3a3a4a',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.875rem',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          background: `linear-gradient(135deg, ${palette.primary} 0%, #4f46e5 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${palette.primaryHover} 0%, ${palette.primary} 100%)`,
          },
        },
        outlined: {
          borderColor: palette.border,
          '&:hover': {
            borderColor: palette.primary,
            background: alpha(palette.primary, 0.06),
          },
        },
        text: {
          '&:hover': { background: alpha(palette.primary, 0.06) },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: palette.paper,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: palette.paper,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          boxShadow: 'none',
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: palette.paper,
          borderBottom: `1px solid ${palette.border}`,
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.paper,
          border: 'none',
          borderRight: `1px solid ${palette.border}`,
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: palette.border },
            '&:hover fieldset': { borderColor: '#3a3a4a' },
            '&.Mui-focused fieldset': { borderColor: palette.primary, borderWidth: 1 },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: palette.primary },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.border },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3a3a4a' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.primary,
            borderWidth: 1,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
        filled: {
          background: palette.elevated,
          border: `1px solid ${palette.border}`,
          '&:hover': { background: '#22223a' },
        },
        colorPrimary: {
          background: alpha(palette.primary, 0.15),
          color: palette.primaryHover,
          border: `1px solid ${alpha(palette.primary, 0.3)}`,
        },
        colorSecondary: {
          background: alpha(palette.secondary, 0.12),
          color: palette.secondary,
          border: `1px solid ${alpha(palette.secondary, 0.25)}`,
        },
        colorSuccess: {
          background: alpha(palette.success, 0.12),
          color: palette.success,
          border: `1px solid ${alpha(palette.success, 0.25)}`,
        },
        colorWarning: {
          background: alpha(palette.warning, 0.12),
          color: palette.warning,
          border: `1px solid ${alpha(palette.warning, 0.25)}`,
        },
        colorError: {
          background: alpha(palette.error, 0.12),
          color: palette.error,
          border: `1px solid ${alpha(palette.error, 0.25)}`,
        },
        colorInfo: {
          background: alpha('#38bdf8', 0.12),
          color: '#38bdf8',
          border: `1px solid ${alpha('#38bdf8', 0.25)}`,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: { borderCollapse: 'separate', borderSpacing: 0 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: palette.elevated,
            color: palette.textSecondary,
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            borderBottom: `1px solid ${palette.border}`,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: alpha(palette.primary, 0.04) },
          '& .MuiTableCell-root': {
            borderBottom: `1px solid ${palette.border}`,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '10px 16px',
          color: palette.textPrimary,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.paper,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid',
          fontSize: '0.875rem',
        },
        standardError: {
          backgroundColor: alpha(palette.error, 0.08),
          borderColor: alpha(palette.error, 0.25),
          color: palette.error,
        },
        standardSuccess: {
          backgroundColor: alpha(palette.success, 0.08),
          borderColor: alpha(palette.success, 0.25),
          color: palette.success,
        },
        standardWarning: {
          backgroundColor: alpha(palette.warning, 0.08),
          borderColor: alpha(palette.warning, 0.25),
          color: palette.warning,
        },
        standardInfo: {
          backgroundColor: alpha(palette.secondary, 0.08),
          borderColor: alpha(palette.secondary, 0.25),
          color: palette.secondary,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-track': { backgroundColor: '#3a3a4a' },
        },
        colorPrimary: {
          '&.Mui-checked': {
            '& + .MuiSwitch-track': { backgroundColor: alpha(palette.primary, 0.5) },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          padding: '8px 12px',
          '&:hover': {
            backgroundColor: alpha(palette.primary, 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(palette.primary, 0.12),
            borderLeft: `3px solid ${palette.primary}`,
            paddingLeft: '9px',
            '&:hover': { backgroundColor: alpha(palette.primary, 0.16) },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1e1e2e',
          border: `1px solid ${palette.border}`,
          fontSize: '0.75rem',
          borderRadius: 6,
        },
        arrow: {
          color: '#1e1e2e',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: palette.border },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover': { backgroundColor: alpha(palette.primary, 0.08) },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: palette.elevated,
          borderRadius: 4,
          height: 6,
        },
        bar: { borderRadius: 4 },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.elevated,
          border: `1px solid ${palette.border}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        },
        option: {
          '&:hover': { backgroundColor: alpha(palette.primary, 0.08) },
          '&[aria-selected="true"]': { backgroundColor: alpha(palette.primary, 0.12) },
        },
      },
    },
  },
});

export default theme;
