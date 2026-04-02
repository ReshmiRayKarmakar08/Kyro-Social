export const getThemeConfig = (mode) => ({
  palette: {
    mode,
    primary: {
      main: '#FF6154',
      light: '#FF8A80',
      dark: '#E8451C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: mode === 'light' ? '#2D3142' : '#94A3B8',
      light: '#4F5D75',
      dark: '#1B1F2E',
      contrastText: '#FFFFFF',
    },
    background: {
      default: mode === 'light' ? '#F5F5F7' : '#0F172A',
      paper: mode === 'light' ? '#FFFFFF' : '#1E293B',
    },
    text: {
      primary: mode === 'light' ? '#1A1A2E' : '#F1F5F9',
      secondary: mode === 'light' ? '#6B7280' : '#94A3B8',
    },
    success: {
      main: '#10B981',
    },
    warning: {
      main: '#F59E0B',
    },
    error: {
      main: '#EF4444',
    },
    divider: mode === 'light' ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.1)',
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Inter", "Plus Jakarta Sans", "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.5rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.1rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.85rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: '0.75rem',
      color: mode === 'light' ? '#9CA3AF' : '#64748B',
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 16,
          padding: '10px 24px',
          fontSize: '0.9rem',
          boxShadow: 'none',
          textTransform: 'none',
          fontWeight: 700,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: 'none',
            transform: 'scale(0.98)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #FF6154 0%, #FF8A65 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #E8451C 0%, #FF6154 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: mode === 'light' ? '0 20px 40px rgba(45, 49, 66, 0.06)' : '0 20px 40px rgba(0, 0, 0, 0.25)',
          border: mode === 'light' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: mode === 'light' ? '0 25px 50px rgba(45, 49, 66, 0.1)' : '0 25px 50px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 16,
            backgroundColor: mode === 'light' ? '#F3F4F6' : '#334155',
            '& fieldset': {
              border: 'none',
            },
            '&:hover fieldset': {
              border: '1px solid rgba(255, 97, 84, 0.5)',
            },
            '&.Mui-focused fieldset': {
              border: '1px solid #FF6154',
            },
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: mode === 'light' ? '2px solid #FFFFFF' : '2px solid #1E293B',
          boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          fontWeight: 600,
          backgroundColor: mode === 'light' ? undefined : '#334155',
          color: mode === 'light' ? undefined : '#F1F5F9',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9rem',
          minHeight: 48,
          borderRadius: 50,
          marginRight: 8,
          transition: 'all 0.3s ease',
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 97, 84, 0.1)',
            color: '#FF6154',
            padding: '8px 24px',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          display: 'none',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(24px)',
          borderRadius: 50,
          height: 70,
          boxShadow: mode === 'light' ? '0 -10px 30px rgba(45,49,66,0.05)' : '0 -10px 30px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: '24px 24px 0 0',
          backgroundColor: mode === 'light' ? '#FFFFFF' : '#1E293B',
        },
      },
    },
  },
});

import { createTheme } from '@mui/material/styles';
const theme = createTheme(getThemeConfig('light'));
export default theme;
