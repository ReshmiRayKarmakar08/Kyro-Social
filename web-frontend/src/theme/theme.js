import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FF6154',
      light: '#FF8A80',
      dark: '#E8451C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2D3142',
      light: '#4F5D75',
      dark: '#1B1F2E',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5F7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A2E',
      secondary: '#6B7280',
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
    divider: 'rgba(0, 0, 0, 0.06)',
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
      color: '#9CA3AF',
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true, // Remove standard shadows
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
          boxShadow: '0 20px 40px rgba(45, 49, 66, 0.06)',
          border: 'none',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: '0 25px 50px rgba(45, 49, 66, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 16,
            backgroundColor: '#F3F4F6',
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
          border: '2px solid #FFFFFF',
          boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 50,
          fontWeight: 600,
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
          display: 'none', // We are using pill backgrounds instead of underline
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(24px)',
          borderRadius: 50,
          height: 70,
          boxShadow: '0 -10px 30px rgba(45,49,66,0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: '24px 24px 0 0',
        },
      },
    },
  },
});

export default theme;
