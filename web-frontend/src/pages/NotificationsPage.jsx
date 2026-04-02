import { useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

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
          {notifications.map((n, idx) => (
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
    </Card>
  );
};

export default NotificationsPage;
