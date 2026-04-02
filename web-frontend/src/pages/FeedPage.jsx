import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../api/axios';
import CreatePost from '../components/feed/CreatePost';
import PostCard from '../components/feed/PostCard';
import FeedTabs from '../components/feed/FeedTabs';
import FeedSkeleton from '../components/feed/FeedSkeleton';
import { mockPosts } from '../data/mockData';

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  // Alert / Snackbar state
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  const showAlert = (message, severity = 'error') => {
    setAlert({ open: true, message, severity });
  };

  const fetchPosts = useCallback(async (pageNum = 1, filter = activeTab) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await api.get(`/posts?filter=${filter}&page=${pageNum}&limit=10`);
      const newPosts = res.data.posts;

      if (pageNum === 1) {
        if (newPosts.length === 0) {
          // No real posts yet -- fall back to mock data
          setPosts(mockPosts);
          setUsingMockData(true);
          setHasMore(false);
        } else {
          setPosts(newPosts);
          setUsingMockData(false);
        }
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      if (newPosts.length > 0) {
        setHasMore(res.data.pagination?.hasMore ?? false);
      }
    } catch (err) {
      console.error('Feed fetch error:', err);
      // On API failure, show mock data so the UI is never empty
      if (pageNum === 1) {
        setPosts(mockPosts);
        setUsingMockData(true);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, activeTab);
  }, [activeTab]);

  // Infinite scroll
  useEffect(() => {
    if (usingMockData) return; // No infinite scroll with mock data

    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500 &&
        hasMore &&
        !loadingMore
      ) {
        setPage((prev) => {
          const next = prev + 1;
          fetchPosts(next, activeTab);
          return next;
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, activeTab, fetchPosts, usingMockData]);

  // Create post
  const handleCreatePost = async (formData) => {
    if (usingMockData) {
      showAlert('Sign up and start posting! Mock data is shown for preview.', 'info');
      return;
    }
    try {
      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPosts((prev) => [res.data.post, ...prev]);
      showAlert('Post published successfully!', 'success');
    } catch (err) {
      console.error('Create post error:', err);
      const message = err.response?.data?.message || 'Failed to create post. Please try again.';
      showAlert(message);
      throw err;
    }
  };

  // Optimistic like
  const handleLike = async (postId) => {
    const user = JSON.parse(localStorage.getItem('kyro_user'));

    setPosts((prev) =>
      prev.map((post) => {
        if (post._id !== postId) return post;
        const alreadyLiked = post.likes?.some((l) => l.username === user?.username);
        return {
          ...post,
          likeCount: alreadyLiked ? post.likeCount - 1 : post.likeCount + 1,
          likes: alreadyLiked
            ? post.likes.filter((l) => l.username !== user?.username)
            : [...(post.likes || []), { username: user?.username, userId: user?.id }],
        };
      })
    );

    if (usingMockData) return; // Don't call API for mock data

    try {
      await api.put(`/posts/${postId}/like`);
    } catch (err) {
      // Revert on error
      fetchPosts(1, activeTab);
    }
  };

  // Optimistic comment
  const handleComment = async (postId, text) => {
    if (!text.trim()) {
      showAlert('Comment cannot be empty.', 'warning');
      return;
    }

    const user = JSON.parse(localStorage.getItem('kyro_user'));
    const tempComment = {
      _id: Date.now().toString(),
      userId: user?.id,
      username: user?.username || 'you',
      userName: user?.name || 'You',
      userAvatar: user?.profilePicture,
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

    if (usingMockData) return; // Don't call API for mock data

    try {
      await api.post(`/posts/${postId}/comment`, { text });
    } catch (err) {
      fetchPosts(1, activeTab);
      showAlert('Failed to add comment. Please try again.');
    }
  };

  return (
    <Box>
      <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <CreatePost onSubmit={handleCreatePost} />

      {/* Mock data banner */}
      {usingMockData && (
        <Alert
          severity="info"
          sx={{
            mb: 2,
            borderRadius: 3,
            fontSize: '0.82rem',
            '& .MuiAlert-icon': { fontSize: 20 },
          }}
          id="mock-data-alert"
        >
          Showing sample posts for preview. Create your first post to get started!
        </Alert>
      )}

      {loading ? (
        <FeedSkeleton count={3} />
      ) : posts.length === 0 ? (
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{ textAlign: 'center', py: 8 }}
        >
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            No posts yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Be the first to share something!
          </Typography>
        </Box>
      ) : (
        <Box>
          {posts.map((post, index) => (
            <PostCard
              key={post._id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              index={index}
            />
          ))}
        </Box>
      )}

      {loadingMore && <FeedSkeleton count={1} />}

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 90, md: 24 } }}
      >
        <Alert
          onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
          severity={alert.severity}
          variant="filled"
          sx={{ borderRadius: 3, fontWeight: 600, fontSize: '0.85rem' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FeedPage;
