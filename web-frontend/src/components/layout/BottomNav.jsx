import { useMemo } from 'react';
import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import {
  HomeRounded,
  SearchRounded,
  NotificationsNoneRounded,
  PersonOutlineRounded,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const paths = useMemo(() => [
    '/',
    '/search',
    '/notifications',
    user?.username ? `/profile/${user.username}` : '/auth',
  ], [user?.username]);

  const value = useMemo(() => {
    if (location.pathname.startsWith('/profile/')) return 3;
    if (location.pathname.startsWith('/search') || location.pathname.startsWith('/explore')) return 1;
    if (location.pathname.startsWith('/notifications')) return 2;
    return 0;
  }, [location.pathname]);

  const handleChange = (e, newValue) => {
    const target = paths[newValue] || '/';
    navigate(target);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 420,
        display: { xs: 'block', md: 'none' },
        zIndex: 1205,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: '24px',
          background: (theme) => theme.palette.mode === 'light' 
            ? 'rgba(255, 255, 255, 0.75)' 
            : 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          boxShadow: (theme) => theme.palette.mode === 'light' 
            ? '0 12px 40px rgba(0,0,0,0.12)' 
            : '0 12px 40px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
      >
        <BottomNavigation
          value={value}
          onChange={handleChange}
          showLabels={false}
          sx={{
            height: 68,
            background: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              color: 'text.secondary',
              minWidth: 'auto',
              flex: 1,
              transition: 'all 0.3s ease',
              '&.Mui-selected': {
                color: '#FF6154',
                '& .nav-icon-container': {
                  background: 'rgba(255, 97, 84, 0.08)',
                  borderRadius: '16px',
                  transform: 'translateY(-2px)',
                },
              },
            },
          }}
        >
          {[
            { label: 'Home', icon: <HomeRounded />, id: 'nav-home' },
            { label: 'Explore', icon: <SearchRounded />, id: 'nav-search' },
            { label: 'Notifications', icon: <NotificationsNoneRounded />, id: 'nav-notifications' },
            { label: 'Profile', icon: <PersonOutlineRounded />, id: 'nav-profile' },
          ].map((item, i) => (
            <BottomNavigationAction
              key={item.id}
              id={item.id}
              icon={
                <Box
                  className="nav-icon-container"
                  sx={{
                    width: 44,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <motion.div
                    whileTap={{ scale: 0.85, rotate: i % 2 === 0 ? 5 : -5 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    {item.icon}
                  </motion.div>
                </Box>
              }
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default BottomNav;
