import { useState } from 'react';
import {
  Card,
  Box,
  Avatar,
  Typography,
  IconButton,
  Button,
  CardMedia,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
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
  DeleteRounded,
  SendRounded,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import LikeButton from './LikeButton';
import CommentDrawer from './CommentDrawer';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';
import api from '../../api/axios';

const PostCard = ({ post, onLike, onComment, onDelete, onSave, onDeleteComment, index = 0 }) => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [commentOpen, setCommentOpen] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  const [likers, setLikers] = useState([]);
  const [loadingLikers, setLoadingLikers] = useState(false);

  const isLiked = (post.likes || []).some((like) => like.username === user?.username);
  const isOwnPost = post.authorUsername === user?.username;
  const likeCount = Number(post.likeCount || 0);
  const commentCount = Number(post.commentCount || 0);
  const shareCount = Number(post.shareCount || 0);
  const isSaved = Boolean(post.isSaved);
  const isFollowing = Boolean(user?.following?.includes?.(post.authorUsername));

  const handleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);

    const wasFollowing = isFollowing;
    const nextFollowing = wasFollowing
      ? (user?.following || []).filter((u) => u !== post.authorUsername)
      : [...new Set([...(user?.following || []), post.authorUsername])];

    updateUser({ following: nextFollowing });

    try {
      const res = await api.put(`/users/follow/${post.authorUsername}`);
      if (typeof res.data?.isFollowing === 'boolean') {
        const correctedFollowing = res.data.isFollowing
          ? [...new Set([...(user?.following || []).filter((u) => u !== post.authorUsername), post.authorUsername])]
          : (user?.following || []).filter((u) => u !== post.authorUsername);
        updateUser({ following: correctedFollowing });
      }
    } catch {
      updateUser({ following: user?.following || [] });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleFetchLikers = async () => {
    setLikesDialogOpen(true);
    setLoadingLikers(true);
    try {
      const res = await api.get(`/posts/${post._id}/likes`);
      setLikers(res.data?.users || res.data?.likes || []);
    } catch {
      // error handling
    } finally {
      setLoadingLikers(false);
    }
  };

  const handleShare = async () => {
    try {
      await api.post(`/posts/${post._id}/share`);
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${post.authorName}`,
          text: post.content?.substring(0, 100),
          url: window.location.href,
        });
      }
    } catch {

    }
  };

  const handleDeleteClick = () => {
    setMenuAnchor(null);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setDeleteConfirmOpen(false);
    onDelete(post._id);
  };

  return (
    <>
      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.04 }}
        sx={{
          mb: 2,
          borderRadius: '16px',
          bgcolor: 'background.paper',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          boxShadow: (theme) => theme.palette.mode === 'light' ? '0 3px 14px rgba(0,0,0,0.02)' : 'none',
          overflow: 'hidden',
          '&:hover': { 
            borderColor: (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)' 
          },
        }}
      >
        <Box sx={{ p: 2.2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.6 }}>
            <Avatar
              src={post.authorAvatar || logo}
              onClick={() => navigate(`/profile/${post.authorUsername}`)}
              sx={{ width: 42, height: 42, bgcolor: '#FF6154', cursor: 'pointer' }}
            >
              {post.authorName?.charAt(0)}
            </Avatar>

            <Box sx={{ ml: 1.4, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ cursor: 'pointer', color: 'text.primary' }} onClick={() => navigate(`/profile/${post.authorUsername}`)}>
                  {post.authorName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  @{post.authorUsername}
                </Typography>
                {post.type === 'promo' && (
                  <Box sx={{ bgcolor: 'rgba(255,97,84,0.1)', color: '#FF6154', px: 1, py: 0.1, borderRadius: '4px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
                    Promotion
                  </Box>
                )}
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.8, fontWeight: 500 }}>
                {formatDate(post.createdAt)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {!isOwnPost && (
                <>
                  <Button
                    variant={isFollowing ? 'outlined' : 'text'}
                    size="small"
                    onClick={handleFollow}
                    disabled={followLoading}
                    sx={{ borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'none' }}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (!isFollowing) {
                        window.alert('Follow this user first to start messaging.');
                      } else {
                        navigate(`/messages?user=${post.authorUsername}`);
                      }
                    }}
                    sx={{ color: isFollowing ? '#FF6154' : 'text.disabled', '&:hover': { color: '#FF6154' } }}
                  >
                    <SendRounded sx={{ fontSize: 18, transform: 'rotate(-45deg)', mt: '-2px', ml: '2px' }} />
                  </IconButton>
                </>
              )}

              <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
                <MoreHorizRounded fontSize="small" />
              </IconButton>
            </Box>

            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              PaperProps={{ sx: { borderRadius: '12px', minWidth: 180 } }}
            >
              <MenuItem onClick={() => { handleShare(); setMenuAnchor(null); }}>
                <ListItemIcon><LinkRounded fontSize="small" /></ListItemIcon>
                Copy post link
              </MenuItem>

              {isOwnPost && (
                <MenuItem onClick={handleDeleteClick} sx={{ color: '#EF4444' }}>
                  <ListItemIcon><DeleteRounded fontSize="small" sx={{ color: '#EF4444' }} /></ListItemIcon>
                  Delete post
                </MenuItem>
              )}

              {!isOwnPost && (
                <MenuItem onClick={() => setMenuAnchor(null)}>
                  <ListItemIcon><PersonRemoveRounded fontSize="small" /></ListItemIcon>
                  Unfollow user
                </MenuItem>
              )}
              <MenuItem onClick={() => setMenuAnchor(null)} sx={{ color: '#EF4444' }}>
                <ListItemIcon><FlagRounded fontSize="small" sx={{ color: '#EF4444' }} /></ListItemIcon>
                Report post
              </MenuItem>
            </Menu>
          </Box>

          {post.content && (
            <Typography variant="body1" sx={{ mb: post.image ? 1.6 : 1, color: 'text.primary', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {post.content}
            </Typography>
          )}

          {post.image && (
            <Box sx={{ borderRadius: '12px', overflow: 'hidden', mb: 1.2 }}>
              <CardMedia
                component="img"
                image={post.image}
                alt="Post content"
                sx={{ maxHeight: 520, objectFit: 'cover', width: '100%', display: 'block' }}
              />
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, pt: 1.2, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LikeButton liked={isLiked} count={post.likeCount} onToggle={() => onLike(post._id)} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <IconButton size="medium" onClick={() => setCommentOpen(true)} id="comment-button">
                  <ChatBubbleOutlineRounded sx={{ fontSize: 21 }} />
                </IconButton>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  {post.commentCount || ''}
                </Typography>
              </Box>

              <IconButton size="medium" onClick={handleShare}>
                <ShareRounded sx={{ fontSize: 21 }} />
              </IconButton>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, ml: -0.8 }}>
                {shareCount}
              </Typography>
            </Box>

            <IconButton
              size="medium"
              onClick={() => onSave?.(post._id)}
              sx={{ color: isSaved ? '#FF6154' : 'text.secondary' }}
            >
              {isSaved ? <BookmarkRounded sx={{ fontSize: 21 }} /> : <BookmarkBorderRounded sx={{ fontSize: 21 }} />}
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.6, mt: 1.1 }}>
            <Typography 
              variant="caption" 
              sx={{ color: 'text.secondary', fontWeight: 700, cursor: 'pointer', '&:hover': { color: '#FF6154' } }}
              onClick={handleFetchLikers}
            >
              {likeCount} {likeCount === 1 ? 'like' : 'likes'}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', fontWeight: 700, cursor: 'pointer', '&:hover': { color: '#FF6154' } }}
              onClick={() => setCommentOpen(true)}
            >
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              {shareCount} shares
            </Typography>
          </Box>
        </Box>
      </Card>

      <CommentDrawer
        open={commentOpen}
        onClose={() => setCommentOpen(false)}
        comments={post.comments || []}
        onAddComment={onComment}
        onDeleteComment={onDeleteComment}
        canModerateComments={isOwnPost}
        postId={post._id}
      />

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: { borderRadius: '16px', p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Post?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone. This post will be permanently removed from your profile and the feed.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 2.5 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, color: '#6B7280' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={likesDialogOpen}
        onClose={() => setLikesDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, bgcolor: 'background.paper' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Likes</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {loadingLikers ? (
              <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
            ) : likers.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="body2" color="text.secondary">No likes yet</Typography></Box>
            ) : (
              <List>
                {likers.map((u) => (
                  <ListItemButton
                    key={u.username}
                    onClick={() => { setLikesDialogOpen(false); navigate(`/profile/${u.username}`); }}
                    sx={{ px: 2.5, py: 1.2 }}
                  >
                    <ListItemAvatar>
                      <Avatar src={u.profilePicture || logo} sx={{ width: 40, height: 40 }} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={u.name || u.username}
                      secondary={u.headline || `@${u.username}`}
                      primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}
                      secondaryTypographyProps={{ fontSize: '0.8rem', color: 'text.secondary' }}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={() => setLikesDialogOpen(false)} fullWidth sx={{ fontWeight: 700 }}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PostCard;
