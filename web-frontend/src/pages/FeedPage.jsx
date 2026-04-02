import { useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import CreatePost from '../components/feed/CreatePost';
import PostCard from '../components/feed/PostCard';
import FeedTabs from '../components/feed/FeedTabs';

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = useCallback(async (pageNum = 1, filter = activeTab) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await api.get(`/posts?filter=${filter}&page=${pageNum}&limit=10`);
      const newPosts = res.data.posts;

      if (pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setHasMore(res.data.pagination.hasMore);
    } catch (err) {
      console.error('Feed fetch error:', err);
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
  }, [hasMore, loadingMore, activeTab, fetchPosts]);

  // Create post
  const handleCreatePost = async (formData) => {
    try {
      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPosts((prev) => [res.data.post, ...prev]);
    } catch (err) {
      console.error('Create post error:', err);
      throw err;
    }
  };

  // Optimistic like
  const handleLike = async (postId) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post._id !== postId) return post;
        const user = JSON.parse(localStorage.getItem('kyro_user'));
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

    try {
      await api.put(`/posts/${postId}/like`);
    } catch (err) {
      // Revert on error
      fetchPosts(1, activeTab);
    }
  };

  // Optimistic comment
  const handleComment = async (postId, text) => {
    const user = JSON.parse(localStorage.getItem('kyro_user'));
    const tempComment = {
      _id: Date.now().toString(),
      userId: user?.id,
      username: user?.username,
      userName: user?.name,
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

    try {
      await api.post(`/posts/${postId}/comment`, { text });
    } catch (err) {
      fetchPosts(1, activeTab);
    }
  };

  return (
    <Box>
      <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <CreatePost onSubmit={handleCreatePost} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#FF6154' }} />
        </Box>
      ) : posts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            No posts yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Be the first to share something!
          </Typography>
        </Box>
      ) : (
        <AnimatePresence>
          {posts.map((post, index) => (
            <PostCard
              key={post._id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              index={index}
            />
          ))}
        </AnimatePresence>
      )}

      {loadingMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} sx={{ color: '#FF6154' }} />
        </Box>
      )}
    </Box>
  );
};

export default FeedPage;
