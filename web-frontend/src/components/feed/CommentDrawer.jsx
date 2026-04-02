import { useState } from 'react';
import {
  SwipeableDrawer,
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Divider,
  List,
  ListItem,
  Button,
  Tooltip,
} from '@mui/material';
import { SendRounded, CloseRounded, DeleteOutlineRounded } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { timeAgo } from '../../utils/formatDate';
import logo from '../../assets/logo.png';

const CommentDrawer = ({
  open,
  onClose,
  comments = [],
  onAddComment,
  onDeleteComment,
  canModerateComments = false,
  postId,
}) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const sortedComments = [...comments].sort(
    (a, b) => new Date(a.createdAt || a.timestamp || Date.now()) - new Date(b.createdAt || b.timestamp || Date.now())
  );

  const rootComments = sortedComments.filter((comment) => !comment.parentCommentId);
  const repliesByParent = sortedComments.reduce((acc, comment) => {
    if (!comment.parentCommentId) return acc;
    const parentId = String(comment.parentCommentId);
    if (!acc[parentId]) acc[parentId] = [];
    acc[parentId].push(comment);
    return acc;
  }, {});

  const renderWithMentions = (value = '') => {
    const tokens = String(value).split(/(@[a-z0-9_]{3,30})/gi);
    return tokens.map((token, idx) => {
      if (/^@[a-z0-9_]{3,30}$/i.test(token)) {
        return (
          <Box
            key={`${token}-${idx}`}
            component="span"
            sx={{ color: '#FF6154', fontWeight: 700, cursor: 'pointer' }}
          >
            {token}
          </Box>
        );
      }
      return <span key={`${token}-${idx}`}>{token}</span>;
    });
  };

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAddComment(postId, text.trim(), replyTo?._id || null);
      setText('');
      setReplyTo(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleReply = (comment) => {
    setReplyTo(comment);
    setText((prev) => {
      const mentionPrefix = `@${comment.username} `;
      if (prev.trim().startsWith(`@${comment.username}`)) return prev;
      return `${mentionPrefix}${prev}`.trimStart();
    });
  };

  const handleDeleteComment = async (comment) => {
    if (!comment?._id || !onDeleteComment || submitting) return;
    setSubmitting(true);
    try {
      await onDeleteComment(postId, comment._id);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCommentRow = (comment, index, depth = 0) => (
    <motion.div
      key={comment._id || `${comment.username}-${index}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <ListItem
        alignItems="flex-start"
        sx={{ px: 0, py: 1.5, ml: depth ? 5 : 0 }}
        disableGutters
      >
        <Avatar
          src={comment.userAvatar || logo}
          sx={{
            width: depth ? 28 : 34,
            height: depth ? 28 : 34,
            mr: 1.5,
            mt: 0.3,
            bgcolor: '#FF6154',
            fontSize: '0.8rem',
          }}
        >
          {(comment.userName || comment.username || '?').charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2" fontWeight={700} fontSize="0.85rem">
              {comment.userName || comment.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @{comment.username}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {timeAgo(comment.createdAt || comment.timestamp)}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{ mt: 0.3, color: 'text.primary', lineHeight: 1.5, wordBreak: 'break-word' }}
          >
            {renderWithMentions(comment.text)}
          </Typography>
          <Box sx={{ mt: 0.3, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Button
              size="small"
              onClick={() => handleReply(comment)}
              sx={{
                minWidth: 'auto',
                px: 0.5,
                py: 0,
                textTransform: 'none',
                color: '#FF6154',
                fontWeight: 700,
                fontSize: '0.72rem',
              }}
            >
              Reply
            </Button>
            {(user?.username === comment.username || canModerateComments) && (
              <Tooltip title="Delete comment">
                <IconButton
                  size="small"
                  onClick={() => handleDeleteComment(comment)}
                  sx={{ color: 'text.secondary', '&:hover': { color: '#EF4444' } }}
                >
                  <DeleteOutlineRounded sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </ListItem>
      {(repliesByParent[String(comment._id)] || []).map((reply, replyIndex) => (
        <Box key={reply._id || `${reply.username}-${replyIndex}`}>
          {renderCommentRow(reply, replyIndex, 1)}
        </Box>
      ))}
      {index < rootComments.length - 1 && depth === 0 && <Divider sx={{ ml: 6 }} />}
    </motion.div>
  );

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          maxHeight: '75vh',
          borderRadius: '24px 24px 0 0',
          overflow: 'hidden',
          bgcolor: 'background.paper',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 2,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" fontWeight={700} fontSize="1rem">
          Comments ({comments.length})
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseRounded />
        </IconButton>
      </Box>

      {/* Drag handle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
        <Box
          sx={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'text.disabled',
          }}
        />
      </Box>

      {/* Comments List */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, pb: 1, minHeight: 200 }}>
        {comments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary" fontSize="0.9rem">
              No comments yet. Be the first to share your thoughts!
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            <AnimatePresence>
              {rootComments.map((comment, index) => renderCommentRow(comment, index))}
            </AnimatePresence>
          </List>
        )}
      </Box>

      {/* Input */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.5,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: (theme) => theme.palette.mode === 'light' ? '#FAFAFA' : 'background.default',
        }}
      >
        <Avatar
          src={user?.profilePicture || logo}
          sx={{ width: 32, height: 32, bgcolor: '#FF6154', fontSize: '0.75rem' }}
        >
          {user?.name?.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          {replyTo && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.6, px: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Replying to <Box component="span" sx={{ color: '#FF6154', fontWeight: 700 }}>@{replyTo.username}</Box>
              </Typography>
              <Button
                size="small"
                onClick={() => setReplyTo(null)}
                sx={{ minWidth: 'auto', px: 0.5, textTransform: 'none', fontWeight: 700 }}
              >
                Cancel
              </Button>
            </Box>
          )}
        <TextField
          fullWidth
          size="small"
          placeholder={replyTo ? `Reply to @${replyTo.username}...` : 'Write a comment... (Use @username to tag)'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          multiline
          maxRows={3}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              bgcolor: 'background.paper',
              fontSize: '0.875rem',
            },
          }}
          id="comment-input"
        />
        </Box>
        <IconButton
          onClick={handleSubmit}
          disabled={!text.trim() || submitting}
          sx={{
            color: text.trim() ? '#FF6154' : '#D1D5DB',
            transition: 'all 0.2s',
          }}
          id="comment-submit"
        >
          <SendRounded sx={{ fontSize: 22 }} />
        </IconButton>
      </Box>
    </SwipeableDrawer>
  );
};

export default CommentDrawer;
