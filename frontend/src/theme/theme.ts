import { createTheme, alpha } from '@mui/material/styles';

// ─── Color palette ────────────────────────────────────────────────────────────
const PRIMARY = '#1976d2';    // Medical blue
const SECONDARY = '#00897b';  // Teal (medical green)

// ─── Light theme ─────────────────────────────────────────────────────────────
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: PRIMARY },
    secondary: { main: SECONDARY },
    background: {
      default: '#f4f6f9',
      paper: '#ffffff',
    },
    error:   { main: '#d32f2f' },
    warning: { main: '#f57c00' },
    success: { main: '#2e7d32' },
    info:    { main: '#0288d1' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.9375rem',
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${PRIMARY} 0%, #1565c0 100%)`,
          boxShadow: `0 4px 14px 0 ${alpha(PRIMARY, 0.4)}`,
          '&:hover': {
            background: `linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)`,
            boxShadow: `0 6px 20px 0 ${alpha(PRIMARY, 0.5)}`,
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'medium' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#0f2942',
          color: '#fff',
        },
      },
    },
  },
});

// ─── Dark theme ───────────────────────────────────────────────────────────────
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#42a5f5' },
    secondary: { main: '#26a69a' },
    background: {
      default: '#0a1929',
      paper: '#102a43',
    },
  },
  typography: lightTheme.typography,
  shape: lightTheme.shape,
  components: {
    ...lightTheme.components,
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: '10px 24px', textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#071829',
          color: '#fff',
        },
      },
    },
  },
});
