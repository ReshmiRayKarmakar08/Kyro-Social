import { useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Button,
  Tabs,
  Tab,
  Card,
  CircularProgress,
  IconButton,
  Chip,
} from '@mui/material';
import {
  CalendarTodayRounded,
  EditRounded,
  CameraAltRounded,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import PostCard from '../components/feed/PostCard';
import { useAuth } from '../context/AuthContext';
import { formatJoinedDate } from '../utils/formatDate';
import logo from '../assets/logo.png';

const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
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
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username, currentUser?.username]);

  const handleTabChange = async (_, value) => {
    setActiveTab(value);
    try {
      const res = await api.get(`/posts/user/${username}?type=${value}`);
      setPosts(res.data.posts);
    } catch (err) {
      console.error('Tab fetch error:', err);
    }
  };

  const handleFollow = async () => {
    try {
      const res = await api.put(`/users/follow/${username}`);
      setIsFollowing(res.data.isFollowing);
      setProfile((prev) => ({
        ...prev,
        followerCount: res.data.followerCount,
        followers: res.data.isFollowing
          ? [...(prev.followers || []), currentUser.username]
          : (prev.followers || []).filter((u) => u !== currentUser.username),
      }));
    } catch (err) {
      console.error('Follow error:', err);
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
    try {
      await api.put(`/posts/${postId}/like`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (postId, text) => {
    try {
      await api.post(`/posts/${postId}/comment`, { text });
      const res = await api.get(`/posts/user/${username}?type=${activeTab}`);
      setPosts(res.data.posts);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress sx={{ color: '#FF6154' }} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h5" fontWeight={700}>User not found</Typography>
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
        sx={{ mb: 2, overflow: 'visible', position: 'relative' }}
      >
        <Box
          sx={{
            height: { xs: 160, sm: 200 },
            background: profile.coverPhoto
              ? `url(${profile.coverPhoto}) center/cover`
              : 'linear-gradient(135deg, #FF6154 0%, #FFB199 50%, #FFF0EE 100%)',
            borderRadius: '20px 20px 0 0',
            position: 'relative',
          }}
        >
          {isOwnProfile && (
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: '#fff',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
              }}
              size="small"
            >
              <CameraAltRounded fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Profile Info */}
        <Box sx={{ px: 3, pb: 3, pt: 0, position: 'relative' }}>
          {/* Avatar */}
          <Avatar
            src={profile.profilePicture || logo}
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
          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
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

          {/* Joined Date */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
            <CalendarTodayRounded sx={{ fontSize: 16, color: '#9CA3AF' }} />
            <Typography variant="caption" color="text.secondary">
              {formatJoinedDate(profile.joinedDate)}
            </Typography>
          </Box>

          {/* Stats */}
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box sx={{ cursor: 'pointer' }}>
              <Typography component="span" variant="subtitle2" fontWeight={800}>
                {profile.following?.length || 0}
              </Typography>
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                Following
              </Typography>
            </Box>
            <Box sx={{ cursor: 'pointer' }}>
              <Typography component="span" variant="subtitle2" fontWeight={800}>
                {profile.followers?.length || 0}
              </Typography>
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                Followers
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
              '&.Mui-selected': { color: '#FF6154' },
            },
          }}
        >
          <Tab label="My Posts" value="posts" />
          <Tab label="Liked" value="liked" />
          <Tab label="Commented" value="commented" />
        </Tabs>
      </Card>

      {/* Posts */}
      <AnimatePresence>
        {posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
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
    </Box>
  );
};

export default ProfilePage;
