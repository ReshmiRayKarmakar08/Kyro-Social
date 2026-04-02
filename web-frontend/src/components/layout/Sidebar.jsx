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
  SettingsRounded,
  EditRounded,
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
          borderRight: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: 0,
          top: 64,
          height: 'calc(100% - 64px)',
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ p: 2.5 }}>
        {/* User Card */}
        <Box
          component={motion.div}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/profile/${user?.username}`)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 3,
            cursor: 'pointer',
            transition: 'background 0.2s',
            '&:hover': { backgroundColor: '#F9FAFB' },
          }}
        >
          <Avatar
            src={user?.profilePicture || logo}
            sx={{ width: 44, height: 44, bgcolor: '#FF6154' }}
          >
            {user?.name?.charAt(0)}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {user?.name || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              @{user?.username || 'username'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, px: 1.5, mt: 1 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {user?.following?.length || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Following
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {user?.followers?.length || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Followers
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mx: 2 }} />

      {/* Navigation */}
      <List sx={{ px: 1.5, py: 1 }}>
        {navItems.map((item) => {
          const itemPath = item.path === '/profile' && user ? `/profile/${user.username}` : item.path;
          const isActive = location.pathname === itemPath || (item.path === '/profile' && location.pathname.startsWith('/profile/'));
          return (
            <ListItemButton
              key={item.label}
              onClick={() => navigate(itemPath)}
              component={motion.div}
              whileTap={{ scale: 0.97 }}
              sx={{
                borderRadius: 3,
                mb: 0.5,
                py: 1.2,
                backgroundColor: isActive ? 'rgba(255, 97, 84, 0.08)' : 'transparent',
                color: isActive ? '#FF6154' : '#4B5563',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: isActive ? 'rgba(255, 97, 84, 0.12)' : '#F9FAFB',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isActive ? '#FF6154' : '#9CA3AF',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.9rem',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Create Post FAB */}
      <Box sx={{ px: 2, mt: 2 }}>
        <Fab
          variant="extended"
          color="primary"
          onClick={handleCreatePost}
          component={motion.button}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          sx={{
            width: '100%',
            borderRadius: 50,
            boxShadow: '0 8px 24px rgba(255, 97, 84, 0.3)',
            background: 'linear-gradient(135deg, #FF6154 0%, #FF8A65 100%)',
            fontWeight: 700,
            fontSize: '0.9rem',
            textTransform: 'none',
            py: 3,
            '&:hover': {
              background: 'linear-gradient(135deg, #E8451C 0%, #FF6154 100%)',
              boxShadow: '0 12px 32px rgba(255, 97, 84, 0.4)',
            },
          }}
          id="sidebar-create-post"
        >
          <EditRounded sx={{ mr: 1 }} />
          Create Post
        </Fab>
      </Box>

      {/* Profile Link */}
      <Box sx={{ mt: 'auto', px: 1.5, pb: 2 }}>
        <ListItemButton
          onClick={() => navigate(`/profile/${user?.username}`)}
          component={motion.div}
          whileTap={{ scale: 0.97 }}
          sx={{
            borderRadius: 3,
            py: 1.2,
            '&:hover': { backgroundColor: '#F9FAFB' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: '#9CA3AF' }}>
            <PersonOutlineRounded />
          </ListItemIcon>
          <ListItemText
            primary="My Profile"
            primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
};

export { DRAWER_WIDTH };
export default Sidebar;
