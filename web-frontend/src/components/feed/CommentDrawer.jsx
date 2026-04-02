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
} from '@mui/material';
import { SendRounded, CloseRounded } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { timeAgo } from '../../utils/formatDate';
import logo from '../../assets/logo.png';

const CommentDrawer = ({ open, onClose, comments = [], onAddComment, postId }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAddComment(postId, text.trim());
      setText('');
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
              {comments.map((comment, index) => (
                <motion.div
                  key={comment._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ListItem
                    alignItems="flex-start"
                    sx={{ px: 0, py: 1.5 }}
                    disableGutters
                  >
                    <Avatar
                      src={comment.userAvatar || logo}
                      sx={{
                        width: 34,
                        height: 34,
                        mr: 1.5,
                        mt: 0.3,
                        bgcolor: '#FF6154',
                        fontSize: '0.8rem',
                      }}
                    >
                      {comment.userName?.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} fontSize="0.85rem">
                          {comment.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          @{comment.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                          {timeAgo(comment.createdAt)}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ mt: 0.3, color: 'text.primary', lineHeight: 1.5 }}
                      >
                        {comment.text}
                      </Typography>
                    </Box>
                  </ListItem>
                  {index < comments.length - 1 && <Divider sx={{ ml: 6 }} />}
                </motion.div>
              ))}
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
        <TextField
          fullWidth
          size="small"
          placeholder="Write a comment..."
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
