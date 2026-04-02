import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Alert, Snackbar, Card, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { io } from 'socket.io-client';
import CreatePost from '../components/feed/CreatePost';
import PostCard from '../components/feed/PostCard';
import FeedSkeleton from '../components/feed/FeedSkeleton';
import { useAuth } from '../context/AuthContext';
import { getSocketOptions, getSocketUrl } from '../utils/socket';

const PAGE_LIMIT = 10;

const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [filterType, setFilterType] = useState('all');

  const stripDeletedComments = (comments = [], commentId) => {
    const toDelete = new Set([String(commentId)]);
    let changed = true;
    while (changed) {
      changed = false;
      comments.forEach((item) => {
        const parentId = item.parentCommentId ? String(item.parentCommentId) : null;
        if (parentId && toDelete.has(parentId) && !toDelete.has(String(item._id))) {
          toDelete.add(String(item._id));
          changed = true;
        }
      });
    }
    return comments.filter((item) => !toDelete.has(String(item._id)));
  };

  const showAlert = (message, severity = 'error') => setAlert({ open: true, message, severity });

  const fetchPosts = useCallback(async (pageNum = 1, filter = activeTab) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await api.get(`/posts?filter=${filter}&type=${filterType}&page=${pageNum}&limit=${PAGE_LIMIT}`);
      const newPosts = res.data?.posts || [];

      if (pageNum === 1) setPosts(newPosts);
      else setPosts((prev) => [...prev, ...newPosts]);

      setHasMore(Boolean(res.data?.pagination?.hasMore));
    } catch (err) {
      if (pageNum === 1) setPosts([]);
      setHasMore(false);
      showAlert(err.response?.data?.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, activeTab);
  }, [activeTab, filterType, fetchPosts]);

  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 400 &&
        hasMore &&
        !loadingMore &&
        !loading
      ) {
        setPage((prev) => {
          const next = prev + 1;
          fetchPosts(next, activeTab);
          return next;
        });
      }
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasMore, loadingMore, loading, fetchPosts, activeTab]);

  useEffect(() => {
    const socket = io(getSocketUrl(), getSocketOptions(user?.username || ''));

    socket.on('post:liked', ({ postId, likeCount }) => {
      setPosts((prev) => prev.map((p) => (
        p._id === postId ? { ...p, likeCount } : p
      )));
    });

    socket.on('post:commented', ({ postId, commentCount, comment }) => {
      setPosts((prev) => prev.map((p) => (
        p._id === postId
          ? {
            ...p,
            commentCount,
            comments: (p.comments || []).some((item) => String(item._id) === String(comment?._id))
              ? (p.comments || [])
              : [...(p.comments || []), comment],
          }
          : p
      )));
    });

    socket.on('post:commentDeleted', ({ postId, deletedCommentIds, commentCount }) => {
      const deleteSet = new Set((deletedCommentIds || []).map((id) => String(id)));
      setPosts((prev) => prev.map((p) => (
        p._id === postId
          ? {
            ...p,
            commentCount: typeof commentCount === 'number' ? commentCount : Math.max(0, (p.commentCount || 0) - 1),
            comments: (p.comments || []).filter((item) => !deleteSet.has(String(item._id))),
          }
          : p
      )));
    });

    return () => socket.disconnect();
  }, [user?.username]);

  const handleCreatePost = async (formData) => {
    try {
      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPosts((prev) => [res.data.post, ...prev]);
      showAlert('Post published successfully!', 'success');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create post. Please try again.';
      showAlert(message);
      throw err;
    }
  };

  const handleLike = async (postId) => {
    const currentUser = JSON.parse(localStorage.getItem('kyro_user') || '{}');

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
      fetchPosts(1, activeTab);
    }
  };

  const handleComment = async (postId, text, parentCommentId = null) => {
    const message = text.trim();
    if (!message) {
      showAlert('Comment cannot be empty.', 'warning');
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('kyro_user') || '{}');
    const optimisticComment = {
      _id: `temp-${Date.now()}`,
      userId: currentUser?.id,
      username: currentUser?.username || 'you',
      userName: currentUser?.name || 'You',
      userAvatar: currentUser?.profilePicture,
      text: message,
      parentCommentId: parentCommentId || null,
      mentionUsernames: [],
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) => prev.map((post) => {
      if (post._id !== postId) return post;
      return {
        ...post,
        comments: [...(post.comments || []), optimisticComment],
        commentCount: (post.commentCount || 0) + 1,
      };
    }));

    try {
      const res = await api.post(`/posts/${postId}/comment`, {
        text: message,
        parentCommentId: parentCommentId || undefined,
      });
      const savedComment = res.data?.comment;
      if (savedComment) {
        setPosts((prev) => prev.map((post) => {
          if (post._id !== postId) return post;
          return {
            ...post,
            comments: (post.comments || []).map((item) => (
              item._id === optimisticComment._id ? { ...item, ...savedComment } : item
            )),
          };
        }));
      }
    } catch {
      fetchPosts(1, activeTab);
      showAlert('Failed to add comment. Please try again.');
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((post) => post._id !== postId));
      showAlert('Post deleted successfully!', 'success');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to delete post. Please try again.');
    }
  };

  const handleToggleSave = async (postId) => {
    setPosts((prev) => prev.map((post) => (
      post._id === postId ? { ...post, isSaved: !post.isSaved } : post
    )));

    try {
      const res = await api.put(`/posts/${postId}/save`);
      const saved = Boolean(res.data?.saved);
      setPosts((prev) => prev.map((post) => (
        post._id === postId ? { ...post, isSaved: saved } : post
      )));
      showAlert(saved ? 'Post saved' : 'Removed from saved posts', 'success');
    } catch {
      fetchPosts(1, activeTab);
      showAlert('Failed to update saved post');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    setPosts((prev) => prev.map((post) => {
      if (post._id !== postId) return post;
      const nextComments = stripDeletedComments(post.comments || [], commentId);
      return {
        ...post,
        comments: nextComments,
        commentCount: nextComments.length,
      };
    }));

    try {
      await api.delete(`/posts/${postId}/comment/${commentId}`);
    } catch {
      fetchPosts(1, activeTab);
      showAlert('Failed to delete comment');
    }
  };

  return (
    <Box>
      <Card
        sx={{
          mb: 1.5,
          p: 1.2,
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          boxShadow: (theme) => theme.palette.mode === 'light' ? '0 2px 10px rgba(0,0,0,0.02)' : 'none',
          display: 'flex',
          gap: 0.8,
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: '#All Post', filter: 'all', type: 'all' },
          { label: '#For You', filter: 'foryou', type: 'all' },
          { label: '#Most Liked', filter: 'mostliked', type: 'all' },
          { label: '#Most Commented', filter: 'mostcommented', type: 'all' },
          { label: '#Most Shared', filter: 'mostshared', type: 'all' },
          { label: '#Promotions', filter: 'all', type: 'promo' },
        ].map((item) => {
          const isActive = activeTab === item.filter && filterType === item.type;
          return (
            <Chip
              key={item.label}
              label={item.label}
              size="small"
              onClick={() => {
                setActiveTab(item.filter);
                setFilterType(item.type);
              }}
              sx={{
                borderRadius: '999px',
                fontWeight: 700,
                bgcolor: isActive ? '#FF6154' : 'rgba(255,97,84,0.08)',
                color: isActive ? '#FFFFFF' : '#FF6154',
                '&:hover': {
                  bgcolor: isActive ? '#FF6154' : 'rgba(255,97,84,0.15)',
                },
              }}
            />
          );
        })}
      </Card>

      <CreatePost onSubmit={handleCreatePost} />

      {loading ? (
        <FeedSkeleton count={3} />
      ) : posts.length === 0 ? (
        <Box component={motion.div} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" fontWeight={700}>
            No posts found. Be the first to share your journey!
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
              onDeleteComment={handleDeleteComment}
              onDelete={handleDeletePost}
              onSave={handleToggleSave}
              index={index}
            />
          ))}
        </Box>
      )}

      {loadingMore && <FeedSkeleton count={1} />}

      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 90, md: 32 } }}
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
