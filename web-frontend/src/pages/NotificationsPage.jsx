import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import logo from '../assets/logo.png';

const formatWhen = (value) => {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '';
  }
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    notifications,
    unreadNotifications,
    fetchNotifications,
    markNotificationsRead,
  } = useAuth();
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await api.get('/users/suggestions/follow');
        setSuggestions(res.data?.users || []);
      } catch {
        setSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [isAuthenticated]);

  const mappedNotifications = useMemo(() => notifications.map((n) => {
    if (n.text) return n;
    const actor = n.fromUsername || 'Someone';
    const textByType = {
      like: `${actor} liked your post`,
      comment: `${actor} commented on your post`,
      mention: `${actor} mentioned you`,
      follow: `${actor} started following you`,
      suggestion_follow: 'You have new people to follow',
      message: `${actor} sent you a message`,
    };
    return { ...n, text: textByType[n.type] || `${actor} sent a ${n.type} notification` };
  }), [notifications]);

  if (!isAuthenticated) {
    return (
      <Card sx={{ borderRadius: 3, p: 3 }}>
        <Typography variant="h6" fontWeight={800}>Sign in to view notifications</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Live notifications are available for logged-in users.
        </Typography>
        <Button variant="contained" sx={{ mt: 2, borderRadius: 50 }} onClick={() => navigate('/auth')}>
          Go to Auth
        </Button>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3, p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={800}>Notifications</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={`${unreadNotifications || 0} unread`} color={(unreadNotifications || 0) > 0 ? 'error' : 'default'} />
          <Button size="small" onClick={markNotificationsRead}>Mark all read</Button>
        </Box>
      </Box>

      {notifications.length === 0 ? (
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">No notifications yet.</Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {mappedNotifications.map((n, idx) => (
            <ListItemButton
              key={n._id || `${n.type}-${idx}`}
              onClick={() => {
                if (n.postId) navigate('/');
                else if (n.fromUsername) navigate(`/profile/${n.fromUsername}`);
              }}
              sx={{
                mb: 1,
                borderRadius: 2,
                bgcolor: n.isRead ? 'transparent' : 'rgba(255,97,84,0.08)',
              }}
            >
              <ListItemText
                primary={n.text || `${n.fromUsername || 'Someone'} sent a ${n.type} notification`}
                secondary={formatWhen(n.createdAt)}
                primaryTypographyProps={{ fontWeight: n.isRead ? 500 : 700 }}
              />
            </ListItemButton>
          ))}
        </List>
      )}

      {suggestions.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
            People you may want to follow
          </Typography>
          <List sx={{ p: 0 }}>
            {suggestions.map((user) => (
              <ListItemButton
                key={user.username}
                onClick={() => navigate(`/profile/${user.username}`)}
                sx={{ mb: 1, borderRadius: 2 }}
              >
                <Avatar src={user.profilePicture || logo} sx={{ width: 36, height: 36, mr: 1.5 }} />
                <ListItemText
                  primary={user.name}
                  secondary={`@${user.username}${user.headline ? ` • ${user.headline}` : ''}`}
                  primaryTypographyProps={{ fontWeight: 700 }}
                />
              </ListItemButton>
            ))}
          </List>
        </>
      )}
    </Card>
  );
};

export default NotificationsPage;
