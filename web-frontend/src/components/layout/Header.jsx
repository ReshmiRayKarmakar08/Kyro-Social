import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  InputBase,
  IconButton,
  Badge,
  Avatar,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Paper,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  NotificationsNoneRounded as NotifIcon,
  PersonOutlineRounded as ProfileIcon,
  LogoutRounded as LogoutIcon,
  SettingsRounded as SettingsIcon,
  DarkModeRounded as MoonIcon,
  LightModeRounded as SunIcon,
} from '@mui/icons-material';
import { useThemeContext } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import logo from '../../assets/logo.png';

const Header = () => {
  const { user, logout, unreadNotifications } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const { mode, toggleTheme } = useThemeContext();
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const query = searchValue.trim();
    if (!query) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await api.get(`/search?q=${encodeURIComponent(query)}&limit=8`);
        setSearchResults(res.data?.users || []);
        setSearchOpen(true);
      } catch {
        setSearchResults([]);
        setSearchOpen(true);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleProfileMenu = (e) => setAnchorEl(e.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout();
    navigate('/auth');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: mode === 'light' ? 'rgba(255, 255, 255, 0.82)' : 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: mode === 'light' ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 1300,
        color: 'text.primary',
      }}
    >
      <Toolbar
        sx={{
          maxWidth: 1280,
          width: '100%',
          mx: 'auto',
          px: { xs: 1.5, sm: 3 },
          gap: { xs: 1, sm: 2 },
          minHeight: { xs: 60, sm: 72 },
        }}
      >
        <Box
          component={motion.div}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Avatar src={logo} sx={{ width: 38, height: 38, borderRadius: '12px', bgcolor: 'transparent' }} variant="rounded" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 900,
              color: mode === 'light' ? '#1A1A2E' : '#F1F5F9',
              fontSize: '1.25rem',
              letterSpacing: '-0.03em',
              display: { xs: 'none', sm: 'block' },
              lineHeight: 1,
            }}
          >
            Kyro
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', flex: 1, maxWidth: { xs: '100%', sm: 480 }, mx: 'auto' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.035)',
              borderRadius: '12px',
              px: 2,
              py: 0.8,
              border: '1px solid transparent',
              transition: 'all 0.2s ease',
              '&:focus-within': {
                backgroundColor: '#fff',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                borderColor: 'rgba(255, 97, 84, 0.3)',
              },
            }}
          >
            <SearchIcon sx={{ color: '#9CA3AF', mr: 1, fontSize: 18 }} />
            <InputBase
              placeholder="Search network..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => searchValue.trim() && setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              sx={{
                flex: 1,
                fontSize: '0.9rem',
                fontWeight: 500,
                '& input::placeholder': { color: '#9CA3AF', opacity: 1 },
              }}
              id="header-search-input"
            />
          </Box>

          {searchOpen && (
            <Paper
              elevation={6}
              sx={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.06)',
                zIndex: 1400,
              }}
            >
              <List dense disablePadding>
                {searchLoading && (
                  <ListItemButton disabled>
                    <ListItemText primary="Searching..." />
                  </ListItemButton>
                )}

                {!searchLoading && searchResults.length === 0 && (
                  <ListItemButton
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
                      setSearchOpen(false);
                    }}
                  >
                    <ListItemText primary={`Search for "${searchValue.trim()}"`} secondary="No quick matches" />
                  </ListItemButton>
                )}

                {!searchLoading && searchResults.map((u) => (
                  <ListItemButton
                    key={u._id || u.username}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      navigate(`/profile/${u.username}`);
                      setSearchOpen(false);
                      setSearchValue('');
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={u.profilePicture || logo} sx={{ width: 30, height: 30 }} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={u.name}
                      secondary={`@${u.username}`}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                      secondaryTypographyProps={{ fontSize: '0.8rem' }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            onClick={toggleTheme}
            component={motion.button}
            whileTap={{ scale: 0.9 }}
            sx={{ color: mode === 'light' ? '#6B7280' : '#94A3B8' }}
          >
            {mode === 'light' ? <MoonIcon /> : <SunIcon />}
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <IconButton
            component={motion.button}
            whileTap={{ scale: 0.9 }}
            sx={{ color: '#6B7280' }}
            id="notification-bell"
            onClick={() => navigate('/notifications')}
          >
            <Badge
              badgeContent={unreadNotifications || 0}
              color="error"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 18, height: 18 } }}
            >
              <NotifIcon />
            </Badge>
          </IconButton>

          <IconButton onClick={handleProfileMenu} component={motion.button} whileTap={{ scale: 0.9 }} sx={{ p: 0.5 }} id="user-avatar-button">
            <Avatar src={user?.profilePicture || logo} sx={{ width: 34, height: 34, bgcolor: '#FF6154', fontSize: '0.85rem', fontWeight: 700 }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            PaperProps={{
              sx: {
                mt: 1.5,
                borderRadius: 3,
                minWidth: 200,
                boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                border: '1px solid rgba(0,0,0,0.06)',
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary">@{user?.username}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { handleCloseMenu(); navigate(`/profile/${user?.username}`); }} id="menu-profile-link">
              <ListItemIcon><ProfileIcon fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { handleCloseMenu(); navigate('/settings'); }}>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }} id="menu-logout">
              <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
