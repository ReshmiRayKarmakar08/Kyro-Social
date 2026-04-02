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
} from '@mui/material';
import {
  CalendarTodayRounded,
  EditRounded,
  CameraAltRounded,
  LinkRounded,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import PostCard from '../components/feed/PostCard';
import FeedSkeleton from '../components/feed/FeedSkeleton';
import { useAuth } from '../context/AuthContext';
import { formatJoinedDate } from '../utils/formatDate';
import logo from '../assets/logo.png';
import { mockPosts, mockUsers } from '../data/mockData';

const ProfileSkeleton = () => (
  <Card sx={{ mb: 2, overflow: 'visible' }}>
    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '20px 20px 0 0' }} animation="wave" />
    <Box sx={{ px: 3, pb: 3, pt: 0, position: 'relative' }}>
      <Skeleton variant="circular" width={100} height={100} sx={{ mt: -6, border: '4px solid #fff' }} animation="wave" />
      <Skeleton variant="text" width="50%" height={32} sx={{ mt: 1.5 }} animation="wave" />
      <Skeleton variant="text" width="30%" height={20} animation="wave" />
      <Skeleton variant="text" width="80%" height={18} sx={{ mt: 1 }} animation="wave" />
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
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/users/${username}`),
          api.get(`/posts/user/${username}?type=posts`),
        ]);
        setProfile(profileRes.data.user);
        setPosts(postsRes.data.posts);
        setIsFollowing(profileRes.data.user.followers?.includes(currentUser?.username));
        setUsingMock(false);
      } catch (err) {
        console.error('Profile fetch error:', err);
        // Fallback to mock data
        const mockUser = mockUsers.find((u) => u.username === username) || mockUsers[0];
        const mockUserPosts = mockPosts.filter((p) => p.authorUsername === username || p.authorUsername === mockUser.username);
        setProfile(mockUser);
        setPosts(mockUserPosts.length > 0 ? mockUserPosts : mockPosts.slice(0, 2));
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username, currentUser?.username]);

  const handleTabChange = async (_, value) => {
    setActiveTab(value);
    if (usingMock) return;
    setPostsLoading(true);
    try {
      const res = await api.get(`/posts/user/${username}?type=${value}`);
      setPosts(res.data.posts);
    } catch (err) {
      console.error('Tab fetch error:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollow = async () => {
    setIsFollowing(!isFollowing);
    setProfile((prev) => ({
      ...prev,
      followers: isFollowing
        ? (prev.followers || []).filter((u) => u !== currentUser?.username)
        : [...(prev.followers || []), currentUser?.username],
    }));

    if (usingMock) return;

    try {
      const res = await api.put(`/users/follow/${username}`);
      setIsFollowing(res.data.isFollowing);
    } catch (err) {
      // Revert
      setIsFollowing(isFollowing);
      setAlert({ open: true, message: 'Failed to update follow status.', severity: 'error' });
    }
  };

  const handleLike = async (postId) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post._id !== postId) return post;
        const alreadyLiked = post.likes?.some((l) => l.username === currentUser?.username);
        return {
          ...post,
          likeCount: alreadyLiked ? post.likeCount - 1 : post.likeCount + 1,
          likes: alreadyLiked
            ? post.likes.filter((l) => l.username !== currentUser?.username)
            : [...(post.likes || []), { username: currentUser?.username, userId: currentUser?.id }],
        };
      })
    );
    if (usingMock) return;
    try {
      await api.put(`/posts/${postId}/like`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (postId, text) => {
    const tempComment = {
      _id: Date.now().toString(),
      userId: currentUser?.id,
      username: currentUser?.username || 'you',
      userName: currentUser?.name || 'You',
      userAvatar: currentUser?.profilePicture,
      text,
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? {
              ...post,
              comments: [...(post.comments || []), tempComment],
              commentCount: (post.commentCount || 0) + 1,
            }
          : post
      )
    );

    if (usingMock) return;
    try {
      await api.post(`/posts/${postId}/comment`, { text });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <ProfileSkeleton />
        <FeedSkeleton count={2} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h5" fontWeight={700}>User not found</Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 2, borderRadius: 50 }}
        >
          Go Home
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Cover Photo */}
      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{ mb: 2, overflow: 'visible', position: 'relative' }}
      >
        <Box
          sx={{
            height: { xs: 160, sm: 210 },
            background: profile.coverPhoto
              ? `url(${profile.coverPhoto}) center/cover`
              : 'linear-gradient(135deg, #FF6154 0%, #FF8A65 40%, #FFD4C8 100%)',
            borderRadius: '20px 20px 0 0',
            position: 'relative',
          }}
        >
          {isOwnProfile && (
            <IconButton
              component={motion.button}
              whileTap={{ scale: 0.9 }}
              sx={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                backgroundColor: 'rgba(0,0,0,0.45)',
                color: '#fff',
                backdropFilter: 'blur(8px)',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.65)' },
              }}
              size="small"
            >
              <CameraAltRounded fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Profile Info */}
        <Box sx={{ px: 3, pb: 3, pt: 0, position: 'relative' }}>
          {/* Avatar - overlapping cover */}
          <Avatar
            src={profile.profilePicture || logo}
            component={motion.div}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            sx={{
              width: 100,
              height: 100,
              border: '4px solid #fff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              position: 'relative',
              mt: -6,
              bgcolor: '#FF6154',
              fontSize: '2rem',
              fontWeight: 700,
            }}
          >
            {profile.name?.charAt(0)}
          </Avatar>

          {/* Action Buttons */}
          <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
            {isOwnProfile ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditRounded />}
                component={motion.button}
                whileTap={{ scale: 0.95 }}
                sx={{
                  borderRadius: 50,
                  borderColor: 'rgba(0,0,0,0.15)',
                  color: '#374151',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                variant={isFollowing ? 'outlined' : 'contained'}
                size="small"
                onClick={handleFollow}
                component={motion.button}
                whileTap={{ scale: 0.95 }}
                sx={{
                  borderRadius: 50,
                  fontWeight: 700,
                  px: 3,
                  ...(isFollowing && {
                    borderColor: 'rgba(0,0,0,0.15)',
                    color: '#6B7280',
                    '&:hover': { borderColor: '#EF4444', color: '#EF4444', background: 'rgba(239,68,68,0.04)' },
                  }),
                }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </Box>

          {/* Name & Username */}
          <Typography variant="h5" fontWeight={800} sx={{ mt: 1.5, color: '#1A1A2E' }}>
            {profile.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            @{profile.username}
          </Typography>

          {/* Bio */}
          {profile.bio && (
            <Typography variant="body1" sx={{ mb: 1.5, color: '#374151', lineHeight: 1.6 }}>
              {profile.bio}
            </Typography>
          )}

          {/* Website Link */}
          {profile.website && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <LinkRounded sx={{ fontSize: 16, color: '#FF6154' }} />
              <Typography
                variant="body2"
                component="a"
                href={profile.website}
                target="_blank"
                sx={{ color: '#FF6154', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {profile.website.replace(/^https?:\/\//, '')}
              </Typography>
            </Box>
          )}

          {/* Joined Date */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
            <CalendarTodayRounded sx={{ fontSize: 16, color: '#9CA3AF' }} />
            <Typography variant="caption" color="text.secondary">
              {formatJoinedDate(profile.joinedDate || profile.createdAt)}
            </Typography>
          </Box>

          {/* Stats Row */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            sx={{ display: 'flex', gap: 3 }}
          >
            <Box sx={{ cursor: 'pointer', '&:hover span': { color: '#FF6154' } }}>
              <Typography component="span" variant="subtitle2" fontWeight={800}>
                {profile.following?.length || 0}
              </Typography>
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                Following
              </Typography>
            </Box>
            <Box sx={{ cursor: 'pointer', '&:hover span': { color: '#FF6154' } }}>
              <Typography component="span" variant="subtitle2" fontWeight={800}>
                {profile.followers?.length || 0}
              </Typography>
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                Followers
              </Typography>
            </Box>
            <Box>
              <Typography component="span" variant="subtitle2" fontWeight={800}>
                {posts.length}
              </Typography>
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                Posts
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          TabIndicatorProps={{
            sx: { backgroundColor: '#FF6154', height: 3, borderRadius: '3px 3px 0 0' },
          }}
          sx={{
            borderTop: '1px solid rgba(0,0,0,0.06)',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              color: '#9CA3AF',
              transition: 'color 0.2s',
              '&.Mui-selected': { color: '#FF6154' },
            },
          }}
        >
          <Tab label="My Posts" value="posts" id="profile-tab-posts" />
          <Tab label="Liked" value="liked" id="profile-tab-liked" />
          <Tab label="Commented" value="commented" id="profile-tab-commented" />
        </Tabs>
      </Card>

      {/* Posts */}
      {postsLoading ? (
        <FeedSkeleton count={2} />
      ) : (
        <AnimatePresence>
          {posts.length === 0 ? (
            <Box
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              sx={{ textAlign: 'center', py: 6 }}
            >
              <Typography color="text.secondary">No posts to show</Typography>
            </Box>
          ) : (
            posts.map((post, index) => (
              <PostCard
                key={post._id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                index={index}
              />
            ))
          )}
        </AnimatePresence>
      )}

      {/* Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={3000}
        onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={alert.severity} variant="filled" sx={{ borderRadius: 3 }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage;
