import { useState } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  NotificationsNoneRounded as NotifIcon,
  PersonOutlineRounded as ProfileIcon,
  LogoutRounded as LogoutIcon,
  SettingsRounded as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  const handleProfileMenu = (e) => setAnchorEl(e.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout();
    navigate('/auth');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        zIndex: 1200,
      }}
    >
      <Toolbar
        sx={{
          maxWidth: 1200,
          width: '100%',
          mx: 'auto',
          px: { xs: 1.5, sm: 3 },
          gap: 1.5,
          minHeight: { xs: 56, sm: 64 },
        }}
      >
        {/* Logo + Brand */}
        <Box
          component={motion.div}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Avatar
            src={logo}
            sx={{ width: 34, height: 34, borderRadius: '10px', border: 'none', boxShadow: 'none' }}
            variant="rounded"
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              color: '#1A1A2E',
              fontSize: '1.15rem',
              letterSpacing: '-0.02em',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Kyro Social
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box
          sx={{
            flex: 1,
            maxWidth: 480,
            mx: 'auto',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#F3F4F6',
            borderRadius: '50px',
            px: 2,
            py: 0.5,
            transition: 'all 0.2s ease',
            '&:focus-within': {
              backgroundColor: '#fff',
              boxShadow: '0 0 0 2px rgba(255, 97, 84, 0.2)',
            },
          }}
        >
          <SearchIcon sx={{ color: '#9CA3AF', mr: 1, fontSize: 20 }} />
          <InputBase
            placeholder="Search promotions, users, posts..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearch}
            sx={{
              flex: 1,
              fontSize: '0.875rem',
              '& input::placeholder': { color: '#9CA3AF', opacity: 1 },
            }}
            id="header-search-input"
          />
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <IconButton
            component={motion.button}
            whileTap={{ scale: 0.85 }}
            sx={{ color: '#6B7280' }}
            id="notification-bell"
          >
            <Badge
              badgeContent={3}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.65rem',
                  minWidth: 18,
                  height: 18,
                },
              }}
            >
              <NotifIcon />
            </Badge>
          </IconButton>

          <IconButton
            onClick={handleProfileMenu}
            component={motion.button}
            whileTap={{ scale: 0.9 }}
            sx={{ p: 0.5 }}
            id="user-avatar-button"
          >
            <Avatar
              src={user?.profilePicture || logo}
              sx={{
                width: 34,
                height: 34,
                bgcolor: '#FF6154',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
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
              <Typography variant="subtitle2" fontWeight={700}>
                {user?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                @{user?.username}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => { handleCloseMenu(); navigate(`/profile/${user?.username}`); }}
              id="menu-profile-link"
            >
              <ListItemIcon><ProfileIcon fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleCloseMenu}>
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
