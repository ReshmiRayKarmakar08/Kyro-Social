import { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Avatar,
  Typography,
  IconButton,
  Button,
  CardMedia,
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import {
  ChatBubbleOutlineRounded,
  ShareRounded,
  BookmarkBorderRounded,
  BookmarkRounded,
  MoreHorizRounded,
  FlagRounded,
  PersonRemoveRounded,
  LinkRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LikeButton from './LikeButton';
import CommentDrawer from './CommentDrawer';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import api from '../../api/axios';

const PostCard = ({ post, onLike, onComment, index = 0 }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [commentOpen, setCommentOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const isLiked = post.likes?.some(
    (like) => like.username === user?.username
  );
  const isOwnPost = post.authorUsername === user?.username;

  const handleFollow = async () => {
    setIsFollowing(!isFollowing);
    try {
      await api.put(`/users/follow/${post.authorUsername}`);
    } catch (err) {
      setIsFollowing(!isFollowing); // revert
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.authorName}`,
          text: post.content?.substring(0, 100),
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <>
      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
        sx={{ mb: 2, overflow: 'visible' }}
      >
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2 } }}>
          {/* Author Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <Avatar
              src={post.authorAvatar || logo}
              onClick={() => navigate(`/profile/${post.authorUsername}`)}
              sx={{
                width: 42,
                height: 42,
                bgcolor: '#FF6154',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.08)' },
              }}
            >
              {post.authorName?.charAt(0)}
            </Avatar>
            <Box sx={{ ml: 1.5, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  sx={{ cursor: 'pointer', '&:hover': { color: '#FF6154' }, transition: 'color 0.2s' }}
                  onClick={() => navigate(`/profile/${post.authorUsername}`)}
                >
                  {post.authorName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  @{post.authorUsername}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                {formatDate(post.createdAt)}
              </Typography>
            </Box>

            {!isOwnPost && (
              <Button
                variant={isFollowing ? 'outlined' : 'contained'}
                size="small"
                onClick={handleFollow}
                component={motion.button}
                whileTap={{ scale: 0.92 }}
                sx={{
                  borderRadius: 50,
                  px: 2,
                  py: 0.4,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  minWidth: 'auto',
                  ...(isFollowing && {
                    borderColor: 'rgba(0,0,0,0.12)',
                    color: '#6B7280',
                    '&:hover': { borderColor: '#EF4444', color: '#EF4444', background: 'rgba(239,68,68,0.04)' },
                  }),
                }}
                id="follow-button"
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}

            <IconButton
              size="small"
              sx={{ ml: 0.5, color: '#9CA3AF' }}
              onClick={(e) => setMenuAnchor(e.currentTarget)}
            >
              <MoreHorizRounded fontSize="small" />
            </IconButton>

            {/* Post Options Menu */}
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  minWidth: 180,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  border: '1px solid rgba(0,0,0,0.06)',
                },
              }}
            >
              <MenuItem onClick={() => { handleShare(); setMenuAnchor(null); }}>
                <ListItemIcon><LinkRounded fontSize="small" /></ListItemIcon>
                Copy Link
              </MenuItem>
              {!isOwnPost && (
                <MenuItem onClick={() => setMenuAnchor(null)}>
                  <ListItemIcon><PersonRemoveRounded fontSize="small" /></ListItemIcon>
                  Unfollow
                </MenuItem>
              )}
              <MenuItem onClick={() => setMenuAnchor(null)} sx={{ color: 'error.main' }}>
                <ListItemIcon><FlagRounded fontSize="small" color="error" /></ListItemIcon>
                Report
              </MenuItem>
            </Menu>
          </Box>

          {/* Content */}
          {post.content && (
            <Typography
              variant="body1"
              sx={{
                mb: post.image ? 1.5 : 0.5,
                color: '#1F2937',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {post.content}
            </Typography>
          )}

          {/* Image */}
          {post.image && (
            <Box
              component={motion.div}
              whileHover={{ scale: 1.005 }}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                mb: 1,
                mx: -0.5,
              }}
            >
              <CardMedia
                component="img"
                image={post.image}
                alt="Post image"
                sx={{
                  maxHeight: 420,
                  objectFit: 'cover',
                  width: '100%',
                  borderRadius: 3,
                  cursor: 'pointer',
                }}
              />
            </Box>
          )}

          {/* Action Bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mt: 1,
              pt: 1,
              borderTop: '1px solid rgba(0,0,0,0.04)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LikeButton
                liked={isLiked}
                count={post.likeCount}
                onToggle={() => onLike(post._id)}
              />

              <motion.div
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                whileTap={{ scale: 0.8 }}
              >
                <IconButton
                  size="small"
                  onClick={() => setCommentOpen(true)}
                  sx={{ color: '#9CA3AF', '&:hover': { color: '#FF6154' }, transition: 'color 0.2s' }}
                  id="comment-button"
                >
                  <ChatBubbleOutlineRounded sx={{ fontSize: 20 }} />
                </IconButton>
                <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600 }}>
                  {post.commentCount || ''}
                </Typography>
              </motion.div>

              <motion.div whileTap={{ scale: 0.8 }}>
                <IconButton
                  size="small"
                  onClick={handleShare}
                  sx={{ color: '#9CA3AF', '&:hover': { color: '#FF6154' }, transition: 'color 0.2s' }}
                >
                  <ShareRounded sx={{ fontSize: 20 }} />
                </IconButton>
              </motion.div>
            </Box>

            <motion.div whileTap={{ scale: 0.8 }}>
              <IconButton
                size="small"
                onClick={() => setSaved(!saved)}
                sx={{
                  color: saved ? '#FF6154' : '#9CA3AF',
                  transition: 'color 0.2s',
                }}
              >
                {saved ? (
                  <BookmarkRounded sx={{ fontSize: 20 }} />
                ) : (
                  <BookmarkBorderRounded sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </motion.div>
          </Box>

          {/* Engagement summary */}
          {(post.likeCount > 0 || post.commentCount > 0) && (
            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
              {post.likeCount > 0 && (
                <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, fontSize: '0.76rem' }}>
                  {post.likeCount} {post.likeCount === 1 ? 'Like' : 'Likes'}
                </Typography>
              )}
              {post.commentCount > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#6B7280',
                    fontWeight: 600,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    '&:hover': { color: '#FF6154' },
                  }}
                  onClick={() => setCommentOpen(true)}
                >
                  {post.commentCount} {post.commentCount === 1 ? 'Comment' : 'Comments'}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <CommentDrawer
        open={commentOpen}
        onClose={() => setCommentOpen(false)}
        comments={post.comments || []}
        onAddComment={onComment}
        postId={post._id}
      />
    </>
  );
};

export default PostCard;
