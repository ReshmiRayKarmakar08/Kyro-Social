import { useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Button,
  Tabs,
  Tab,
  Card,
  IconButton,
  Skeleton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  CalendarTodayRounded,
  EditRounded,
  CameraAltRounded,
  LinkRounded,
  LocationOnRounded,
  FavoriteRounded,
  ChatBubbleRounded,
  PhotoCameraRounded,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import PostCard from '../components/feed/PostCard';
import FeedSkeleton from '../components/feed/FeedSkeleton';
import { useAuth } from '../context/AuthContext';
import { formatJoinedDate } from '../utils/formatDate';
import logo from '../assets/logo.png';

const ProfileSkeleton = () => (
  <Card sx={{ mb: 2, overflow: 'visible', borderRadius: 2, bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}` }}>
    <Skeleton variant="rectangular" height={220} animation="wave" />
    <Box sx={{ px: 3, pb: 3, pt: 0, position: 'relative' }}>
      <Skeleton variant="circular" width={110} height={110} sx={{ mt: -7, border: (theme) => `4px solid ${theme.palette.background.paper}` }} animation="wave" />
      <Skeleton variant="text" width="45%" height={32} sx={{ mt: 1.5 }} animation="wave" />
      <Skeleton variant="text" width="28%" height={20} animation="wave" />
      <Skeleton variant="text" width="75%" height={18} sx={{ mt: 1 }} animation="wave" />
      <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
        <Skeleton variant="text" width={80} height={20} animation="wave" />
        <Skeleton variant="text" width={80} height={20} animation="wave" />
        <Skeleton variant="text" width={80} height={20} animation="wave" />
      </Box>
    </Box>
  </Card>
);

const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ postsCount: 0, likesReceived: 0, commentsReceived: 0 });
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [listTitle, setListTitle] = useState('Followers');
  const [listData, setListData] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [form, setForm] = useState({
    name: '',
    username: '',
    headline: '',
    bio: '',
    website: '',
    location: '',
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/users/${username}`),
          api.get(`/posts/user/${username}?type=posts`),
        ]);

        setProfile(profileRes.data.user);
        setStats(profileRes.data.stats || { postsCount: 0, likesReceived: 0, commentsReceived: 0 });
        setPosts(postsRes.data.posts || []);
        setIsFollowing((profileRes.data.user.followers || []).includes(currentUser?.username));
        setForm({
          name: profileRes.data.user.name || '',
          username: profileRes.data.user.username || '',
          headline: profileRes.data.user.headline || '',
          bio: profileRes.data.user.bio || '',
          website: profileRes.data.user.website || '',
          location: profileRes.data.user.location || '',
        });
      } catch (err) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username, currentUser?.username]);

  const handleTabChange = async (_, value) => {
    setActiveTab(value);
    setPostsLoading(true);
    try {
      const res = await api.get(`/posts/user/${username}?type=${value}`);
      setPosts(res.data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollow = async () => {
    setIsFollowing((prev) => !prev);
    setProfile((prev) => {
      if (!prev) return prev;
      const followers = prev.followers || [];
      const updatedFollowers = isFollowing
        ? followers.filter((u) => u !== currentUser?.username)
        : [...followers, currentUser?.username];
      return { ...prev, followers: updatedFollowers };
    });

    try {
      const res = await api.put(`/users/follow/${username}`);
      setIsFollowing(res.data.isFollowing);
    } catch {
      setIsFollowing((prev) => !prev);
      setAlert({ open: true, message: 'Failed to update follow status.', severity: 'error' });
    }
  };

  const openUserList = async (mode) => {
    setListOpen(true);
    setListTitle(mode === 'followers' ? 'Followers' : 'Following');
    setListLoading(true);
    try {
      const res = await api.get(`/users/${username}/${mode}`);
      setListData(res.data.users || []);
    } catch {
      setListData([]);
    } finally {
      setListLoading(false);
    }
  };

  const handleEditProfile = async () => {
    setSavingProfile(true);
    try {
      const payload = new FormData();
      payload.append('name', form.name.trim());
      payload.append('username', form.username.trim().toLowerCase());
      payload.append('headline', form.headline.trim());
      payload.append('bio', form.bio.trim());
      payload.append('website', form.website.trim());
      payload.append('location', form.location.trim());
      if (profilePictureFile) payload.append('profilePicture', profilePictureFile);
      if (coverPhotoFile) payload.append('coverPhoto', coverPhotoFile);

      const res = await api.put('/users/profile', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedUser = res.data.user;
      setProfile((prev) => ({ ...prev, ...updatedUser }));
      if (currentUser?.id === updatedUser.id) {
        updateUser(updatedUser);
      }

      setEditOpen(false);
      setProfilePictureFile(null);
      setCoverPhotoFile(null);
      setAlert({ open: true, message: 'Profile updated successfully.', severity: 'success' });
      if (updatedUser.username !== username) {
        navigate(`/profile/${updatedUser.username}`, { replace: true });
      }
    } catch (err) {
      setAlert({
        open: true,
        message: err.response?.data?.message || 'Failed to update profile.',
        severity: 'error',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLike = async (postId) => {
    setPosts((prev) => prev.map((post) => {
      if (post._id !== postId) return post;
      const alreadyLiked = (post.likes || []).some((l) => l.username === currentUser?.username);
      return {
        ...post,
        likeCount: alreadyLiked ? Math.max(0, (post.likeCount || 0) - 1) : (post.likeCount || 0) + 1,
        likes: alreadyLiked
          ? (post.likes || []).filter((l) => l.username !== currentUser?.username)
          : [...(post.likes || []), { username: currentUser?.username, userId: currentUser?.id }],
      };
    }));

    try {
      await api.put(`/posts/${postId}/like`);
    } catch {
      const res = await api.get(`/posts/user/${username}?type=${activeTab}`);
      setPosts(res.data.posts || []);
    }
  };

  const handleComment = async (postId, text) => {
    const optimisticComment = {
      _id: `temp-${Date.now()}`,
      username: currentUser?.username || 'you',
      text,
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) => prev.map((post) => (
      post._id === postId
        ? { ...post, comments: [...(post.comments || []), optimisticComment], commentCount: (post.commentCount || 0) + 1 }
        : post
    )));

    try {
      await api.post(`/posts/${postId}/comment`, { text });
    } catch {
      const res = await api.get(`/posts/user/${username}?type=${activeTab}`);
      setPosts(res.data.posts || []);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setStats((prev) => ({
        ...prev,
        postsCount: Math.max(0, (prev.postsCount || 0) - 1),
      }));
      setAlert({ open: true, message: 'Post deleted successfully.', severity: 'success' });
    } catch (err) {
      setAlert({
        open: true,
        message: err.response?.data?.message || 'Failed to delete post.',
        severity: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <ProfileSkeleton />
        <FeedSkeleton count={2} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h5" fontWeight={700}>User not found</Typography>
        <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2, borderRadius: 50 }}>
          Go Home
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Card component={motion.div} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} sx={{ mb: 2, overflow: 'hidden', borderRadius: 2, bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Box
          sx={{
            height: { xs: 170, sm: 230 },
            background: profile.coverPhoto
              ? `url(${profile.coverPhoto}) center/cover`
              : 'linear-gradient(135deg, #FF6154 0%, #FF9B7A 50%, #FFD7CC 100%)',
            position: 'relative',
          }}
        />

        <Box sx={{ px: 3, pb: 3, position: 'relative' }}>
          <Avatar
            src={profile.profilePicture || logo}
            sx={{
              width: 110,
              height: 110,
              mt: -6.5,
              border: (theme) => `4px solid ${theme.palette.background.paper}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
              bgcolor: '#FF6154',
              fontSize: '2rem',
              fontWeight: 700,
            }}
          >
            {profile.name?.charAt(0)}
          </Avatar>

          <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
            {isOwnProfile ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditRounded />}
                onClick={() => setEditOpen(true)}
                sx={{ borderRadius: 50, textTransform: 'none', fontWeight: 700 }}
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                variant={isFollowing ? 'outlined' : 'contained'}
                size="small"
                onClick={handleFollow}
                sx={{ borderRadius: 50, textTransform: 'none', fontWeight: 700, px: 2.5 }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </Box>

          <Typography variant="h5" fontWeight={800} sx={{ mt: 1.5, color: 'text.primary' }}>{profile.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>@{profile.username}</Typography>
          {!!profile.headline && <Typography variant="body2" sx={{ color: 'text.primary', mb: 1 }}>{profile.headline}</Typography>}

          {profile.bio && <Typography variant="body1" sx={{ mb: 1.5, color: 'text.primary', lineHeight: 1.6, opacity: 0.9 }}>{profile.bio}</Typography>}

          {profile.website && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <LinkRounded sx={{ fontSize: 16, color: '#FF6154' }} />
              <Typography variant="body2" component="a" href={profile.website} target="_blank" sx={{ color: '#FF6154', fontWeight: 600, textDecoration: 'none' }}>
                {profile.website.replace(/^https?:\/\//, '')}
              </Typography>
            </Box>
          )}

          {profile.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <LocationOnRounded sx={{ fontSize: 16, color: '#9CA3AF' }} />
              <Typography variant="body2" color="text.secondary">{profile.location}</Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
            <CalendarTodayRounded sx={{ fontSize: 16, color: '#9CA3AF' }} />
            <Typography variant="caption" color="text.secondary">{formatJoinedDate(profile.joinedDate || profile.createdAt)}</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
            <Chip
              label={`${profile.following?.length || 0} Following`}
              onClick={() => openUserList('following')}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label={`${profile.followers?.length || 0} Followers`}
              onClick={() => openUserList('followers')}
              sx={{ fontWeight: 700 }}
            />
            <Chip label={`${stats.postsCount || 0} Posts`} sx={{ fontWeight: 700 }} />
            <Chip icon={<FavoriteRounded fontSize="small" />} label={`${stats.likesReceived || 0} Likes`} sx={{ fontWeight: 700 }} />
            <Chip icon={<ChatBubbleRounded fontSize="small" />} label={`${stats.commentsReceived || 0} Comments`} sx={{ fontWeight: 700 }} />
          </Box>
        </Box>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          TabIndicatorProps={{ sx: { backgroundColor: '#FF6154', height: 3 } }}
          sx={{
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              color: 'text.secondary',
              '&.Mui-selected': { color: '#FF6154' },
            },
          }}
        >
          <Tab label="My Posts" value="posts" />
          <Tab label="Liked" value="liked" />
          <Tab label="Commented" value="commented" />
        </Tabs>
      </Card>

      {postsLoading ? (
        <FeedSkeleton count={2} />
      ) : (
        <AnimatePresence>
          {posts.length === 0 ? (
            <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">No posts found. Be the first to share your journey!</Typography>
            </Box>
          ) : (
            posts.map((post, index) => (
              <PostCard key={post._id} post={post} onLike={handleLike} onComment={handleComment} onDelete={handleDeletePost} index={index} />
            ))
          )}
        </AnimatePresence>
      )}

      <Snackbar
        open={alert.open}
        autoHideDuration={3000}
        onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={alert.severity} variant="filled" sx={{ borderRadius: 3 }}>{alert.message}</Alert>
      </Snackbar>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value.toLowerCase() }))}
              fullWidth
            />
            <TextField
              label="Headline"
              value={form.headline}
              onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Bio"
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
              fullWidth
              multiline
              minRows={3}
            />
            <TextField
              label="Website (https://...)"
              value={form.website}
              onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Location"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button component="label" variant="outlined" startIcon={<PhotoCameraRounded />}>
                Change Profile Photo
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePictureFile(e.target.files?.[0] || null)}
                />
              </Button>
              <Button component="label" variant="outlined" startIcon={<PhotoCameraRounded />}>
                Change Cover Photo
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverPhotoFile(e.target.files?.[0] || null)}
                />
              </Button>
            </Stack>

            {(profilePictureFile || coverPhotoFile) && (
              <Typography variant="caption" color="text.secondary">
                {profilePictureFile ? `Profile: ${profilePictureFile.name}` : ''}
                {profilePictureFile && coverPhotoFile ? ' | ' : ''}
                {coverPhotoFile ? `Cover: ${coverPhotoFile.name}` : ''}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleEditProfile}
            disabled={savingProfile}
          >
            {savingProfile ? <CircularProgress size={18} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={listOpen} onClose={() => setListOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{listTitle}</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {listLoading ? (
            <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : listData.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No users found.</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {listData.map((u) => (
                <ListItemButton
                  key={u.username}
                  onClick={() => {
                    setListOpen(false);
                    navigate(`/profile/${u.username}`);
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={u.profilePicture || logo} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={u.name}
                    secondary={`@${u.username}${u.headline ? ` • ${u.headline}` : ''}`}
                    primaryTypographyProps={{ fontWeight: 700 }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;
