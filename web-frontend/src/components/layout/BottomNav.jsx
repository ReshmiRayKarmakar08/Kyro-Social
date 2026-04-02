import { useState, useEffect } from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import {
  HomeRounded,
  ExploreRounded,
  AddCircleRounded,
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

  const pathToValue = {
    '/': 0,
    '/explore': 1,
    '/create': 2,
    '/notifications': 3,
  };

  const [value, setValue] = useState(pathToValue[location.pathname] || 0);

  useEffect(() => {
    if (location.pathname.startsWith('/profile')) {
      setValue(4);
    } else {
      setValue(pathToValue[location.pathname] ?? 0);
    }
  }, [location.pathname]);

  const handleChange = (e, newValue) => {
    setValue(newValue);
    const paths = ['/', '/explore', '/create', '/notifications', `/profile/${user?.username}`];
    navigate(paths[newValue]);
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        right: 24,
        display: { xs: 'block', md: 'none' },
        zIndex: 1200,
        borderRadius: 50,
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 10px 40px rgba(45, 49, 66, 0.08)',
      }}
      elevation={0}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels={false}
        sx={{
          height: 70,
          background: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            color: '#9CA3AF',
            minWidth: 'auto',
            '&.Mui-selected': {
              color: '#FF6154',
            },
          },
        }}
      >
        <BottomNavigationAction
          icon={
            <motion.div whileTap={{ scale: 0.8 }}>
              <HomeRounded />
            </motion.div>
          }
        />
        <BottomNavigationAction
          icon={
            <motion.div whileTap={{ scale: 0.8 }}>
              <ExploreRounded />
            </motion.div>
          }
        />
        <BottomNavigationAction
          icon={
            <motion.div whileTap={{ scale: 0.75 }}>
              <AddCircleRounded sx={{ fontSize: 34, color: '#FF6154' }} />
            </motion.div>
          }
        />
        <BottomNavigationAction
          icon={
            <motion.div whileTap={{ scale: 0.8 }}>
              <NotificationsNoneRounded />
            </motion.div>
          }
        />
        <BottomNavigationAction
          icon={
            <motion.div whileTap={{ scale: 0.8 }}>
              <PersonOutlineRounded />
            </motion.div>
          }
        />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
