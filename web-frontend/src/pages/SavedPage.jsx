import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { motion } from 'framer-motion';
import api from '../api/axios';
import PostCard from '../components/feed/PostCard';
import FeedSkeleton from '../components/feed/FeedSkeleton';
import { useAuth } from '../context/AuthContext';

const SavedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  const showAlert = (message, severity = 'error') => setAlert({ open: true, message, severity });

  const fetchSavedPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts/saved/me');
      setPosts(res.data?.posts || []);
    } catch (err) {
      setPosts([]);
      showAlert(err.response?.data?.message || 'Failed to fetch saved posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedPosts();
  }, [fetchSavedPosts]);

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

  const handleLike = async (postId) => {
    setPosts((prev) => prev.map((post) => {
      if (post._id !== postId) return post;
      const alreadyLiked = (post.likes || []).some((l) => l.username === user?.username);
      return {
        ...post,
        likeCount: alreadyLiked ? Math.max(0, (post.likeCount || 0) - 1) : (post.likeCount || 0) + 1,
        likes: alreadyLiked
          ? (post.likes || []).filter((l) => l.username !== user?.username)
          : [...(post.likes || []), { username: user?.username, userId: user?.id }],
      };
    }));

    try {
      await api.put(`/posts/${postId}/like`);
    } catch {
      fetchSavedPosts();
    }
  };

  const handleComment = async (postId, text, parentCommentId = null) => {
    const message = text.trim();
    if (!message) return;

    const optimisticComment = {
      _id: `temp-${Date.now()}`,
      userId: user?.id,
      username: user?.username || 'you',
      userName: user?.name || 'You',
      userAvatar: user?.profilePicture,
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
      fetchSavedPosts();
      showAlert('Failed to add comment. Please try again.');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    setPosts((prev) => prev.map((post) => {
      if (post._id !== postId) return post;
      const nextComments = stripDeletedComments(post.comments || [], commentId);
      return { ...post, comments: nextComments, commentCount: nextComments.length };
    }));

    try {
      await api.delete(`/posts/${postId}/comment/${commentId}`);
    } catch {
      fetchSavedPosts();
      showAlert('Failed to delete comment');
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
    setPosts((prev) => prev.filter((post) => post._id !== postId));
    try {
      await api.put(`/posts/${postId}/save`);
      showAlert('Removed from saved posts', 'success');
    } catch {
      fetchSavedPosts();
      showAlert('Failed to update saved post');
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 800, color: 'text.primary' }}>
        Saved Posts
      </Typography>

      {loading ? (
        <FeedSkeleton count={2} />
      ) : posts.length === 0 ? (
        <Box component={motion.div} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" fontWeight={700}>
            You have no saved posts yet.
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

      <Snackbar
        open={alert.open}
        autoHideDuration={3000}
        onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
          severity={alert.severity}
          variant="filled"
          sx={{ borderRadius: 3 }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SavedPage;

