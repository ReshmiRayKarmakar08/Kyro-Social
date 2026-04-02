import { useState, useEffect } from 'react';
import { BottomNavigation, BottomNavigationAction, Paper, Badge } from '@mui/material';
import {
  HomeRounded,
  SearchRounded,
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
    '/search': 1,
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
    const paths = ['/', '/search', null, '/notifications', `/profile/${user?.username}`];
    if (paths[newValue]) {
      navigate(paths[newValue]);
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        display: { xs: 'block', md: 'none' },
        zIndex: 1200,
        borderRadius: '28px',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 8px 32px rgba(45, 49, 66, 0.1), 0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid rgba(255,255,255,0.6)',
      }}
      elevation={0}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels={false}
        sx={{
          height: 64,
          background: 'transparent',
          '& .MuiBottomNavigationAction-root': {
            color: '#9CA3AF',
            minWidth: 'auto',
            padding: '6px 0',
            transition: 'color 0.2s',
            '&.Mui-selected': {
              color: '#FF6154',
            },
          },
        }}
      >
        <BottomNavigationAction
          icon={
            <motion.div whileTap={{ scale: 0.75 }}>
              <HomeRounded sx={{ fontSize: 26 }} />
            </motion.div>
          }
          id="nav-home"
        />
        <BottomNavigationAction
          icon={
            <motion.div whileTap={{ scale: 0.75 }}>
              <SearchRounded sx={{ fontSize: 26 }} />
            </motion.div>
          }
          id="nav-search"
        />
        {/* Center Create Button */}
        <BottomNavigationAction
          icon={
            <motion.div
              whileTap={{ scale: 0.8, rotate: 90 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <AddCircleRounded sx={{ fontSize: 40, color: '#FF6154' }} />
            </motion.div>
          }
          sx={{
            '&.Mui-selected': { color: '#FF6154' },
          }}
          id="nav-create"
          onClick={(e) => {
            e.stopPropagation();
            // Scroll to create post and focus
            const createInput = document.getElementById('create-post-input');
            if (createInput) {
              createInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => createInput.focus(), 400);
            } else {
              navigate('/');
            }
          }}
        />
        <BottomNavigationAction
          icon={
            <motion.div whileTap={{ scale: 0.75 }}>
              <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
                <NotificationsNoneRounded sx={{ fontSize: 26 }} />
              </Badge>
            </motion.div>
          }
          id="nav-notifications"
        />
        <BottomNavigationAction
          icon={
            <motion.div whileTap={{ scale: 0.75 }}>
              <PersonOutlineRounded sx={{ fontSize: 26 }} />
            </motion.div>
          }
          id="nav-profile"
        />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
