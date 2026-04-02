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
} from '@mui/material';
import {
  HomeRounded,
  ExploreRounded,
  NotificationsNoneRounded,
  PersonOutlineRounded,
  BookmarkBorderRounded,
  SettingsRounded,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Feed', icon: <HomeRounded />, path: '/' },
  { label: 'Explore', icon: <ExploreRounded />, path: '/explore' },
  { label: 'Notifications', icon: <NotificationsNoneRounded />, path: '/notifications' },
  { label: 'Saved', icon: <BookmarkBorderRounded />, path: '/saved' },
  { label: 'Settings', icon: <SettingsRounded />, path: '/settings' },
];

const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
        },
      }}
    >
      <Box sx={{ p: 2.5 }}>
        {/* User Card */}
        <Box
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
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              @{user?.username}
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
          const isActive = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.label}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 3,
                mb: 0.5,
                py: 1.2,
                backgroundColor: isActive ? 'rgba(255, 97, 84, 0.08)' : 'transparent',
                color: isActive ? '#FF6154' : '#4B5563',
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

      {/* Profile Link */}
      <Box sx={{ mt: 'auto', px: 1.5, pb: 2 }}>
        <ListItemButton
          onClick={() => navigate(`/profile/${user?.username}`)}
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
