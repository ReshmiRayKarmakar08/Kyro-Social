import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Box,
  Typography,
  Divider,
  Fab,
} from '@mui/material';
import {
  HomeRounded,
  SearchRounded,
  NotificationsNoneRounded,
  PersonOutlineRounded,
  BookmarkBorderRounded,
  EditRounded,
  SettingsRounded,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Home', icon: <HomeRounded />, path: '/' },
  { label: 'Explore', icon: <SearchRounded />, path: '/search' },
  { label: 'Notifications', icon: <NotificationsNoneRounded />, path: '/notifications' },
  { label: 'Profile', icon: <PersonOutlineRounded />, path: '/profile' },
  { label: 'Settings', icon: <SettingsRounded />, path: '/settings' },
];

const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleCreatePost = () => {
    navigate('/');
    setTimeout(() => {
      const createInput = document.getElementById('create-post-input');
      if (createInput) {
        createInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => createInput.focus(), 400);
      }
    }, 100);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(0, 0, 0, 0.04)',
          borderRadius: 0,
          top: 72, // Match new header height
          height: 'calc(100% - 72px)',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          px: 2,
        },
      }}
    >
      <Box sx={{ py: 3, px: 1 }}>
        {/* User Card - More Premium */}
        <Box
          component={motion.div}
          whileHover={{ x: 4 }}
          onClick={() => navigate(`/profile/${user?.username}`)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            borderRadius: '16px',
            cursor: 'pointer',
            background: 'rgba(255,255,255,0.4)',
            border: '1px solid rgba(0,0,0,0.03)',
            mb: 3,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': { background: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' },
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={user?.profilePicture || logo}
              sx={{ width: 44, height: 44, bgcolor: '#FF6154', fontSize: '1rem', fontWeight: 700 }}
            >
              {user?.name?.charAt(0)}
            </Avatar>
            <Box
              sx={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 14,
                height: 14,
                bgcolor: '#10B981',
                borderRadius: '50%',
                border: '2px solid #fff',
              }}
            />
          </Box>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#1A1A2E', lineHeight: 1.2 }}>
              {user?.name || 'Kyro User'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600 }}>
              @{user?.username || 'user'}
            </Typography>
          </Box>
        </Box>

        {/* Navigation */}
        <List sx={{ p: 0 }}>
          {navItems.map((item) => {
            const itemPath = item.path === '/profile'
              ? (user ? `/profile/${user.username}` : '/auth')
              : item.path;
            const isActive = location.pathname === itemPath || (item.path === '/profile' && location.pathname.startsWith('/profile/'));
            return (
              <ListItemButton
                key={item.label}
                onClick={() => navigate(itemPath)}
                component={motion.div}
                whileTap={{ scale: 0.96 }}
                sx={{
                  borderRadius: '14px',
                  mb: 1,
                  py: 1.4,
                  px: 2,
                  backgroundColor: 'transparent',
                  color: isActive ? '#FF6154' : '#6B7280',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    color: '#FF6154',
                    '& .nav-icon': { transform: 'translateX(4px)' }
                  },
                }}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <Box
                    component={motion.div}
                    layoutId="active-nav-indicator"
                    sx={{
                      position: 'absolute',
                      left: -2,
                      width: 4,
                      height: 24,
                      bgcolor: '#FF6154',
                      borderRadius: '0 4px 4px 0',
                    }}
                  />
                )}
                
                <ListItemIcon
                  className="nav-icon"
                  sx={{
                    minWidth: 38,
                    color: isActive ? '#FF6154' : '#9CA3AF',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isActive ? item.icon : item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '0.95rem',
                    letterSpacing: '-0.01em',
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <Box sx={{ mt: 2 }}>
          <Fab
            variant="extended"
            color="primary"
            onClick={handleCreatePost}
            component={motion.button}
            whileHover={{ scale: 1.03, boxShadow: '0 12px 30px rgba(255, 97, 84, 0.4)' }}
            whileTap={{ scale: 0.96 }}
            sx={{
              width: '100%',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(255, 97, 84, 0.2)',
              background: 'linear-gradient(135deg, #FF6154 0%, #FF8A65 100%)',
              fontWeight: 800,
              fontSize: '0.9rem',
              textTransform: 'none',
              height: 54,
              '&:hover': {
                background: 'linear-gradient(135deg, #E8451C 0%, #FF6154 100%)',
              },
            }}
            id="sidebar-create-post"
          >
            <EditRounded sx={{ mr: 1, fontSize: 20 }} />
            Post
          </Fab>
        </Box>
      </Box>

      <Box sx={{ mt: 'auto', pb: 4, px: 1 }}>
        <Divider sx={{ mb: 2, opacity: 0.5 }} />
        <ListItemButton
          onClick={handleCreatePost}
          sx={{
            borderRadius: '14px',
            color: '#9CA3AF',
            py: 1.2,
            '&:hover': { color: '#FF6154', backgroundColor: 'rgba(0,0,0,0.02)' }
          }}
        >
          <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
            <BookmarkBorderRounded />
          </ListItemIcon>
          <ListItemText
            primary="Saved"
            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
};

export { DRAWER_WIDTH };
export default Sidebar;
