import { useState, useRef } from 'react';
import {
  Box,
  Avatar,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Collapse,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  ImageRounded,
  CloseRounded,
  EmojiEmotionsOutlined,
  FormatListBulletedRounded,
  CampaignRounded,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

const CreatePost = ({ onSubmit }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const [postMode, setPostMode] = useState('all');
  const fileRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB.');
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if ((!content.trim() && !image) || loading) {
      if (!content.trim() && !image) setError('Write something or add an image to post.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      if (content.trim()) formData.append('content', content.trim());
      if (image) formData.append('image', image);
      formData.append('type', postMode);
      await onSubmit(formData);
      setContent('');
      removeImage();
      setFocused(false);
      setPostMode('all');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to publish post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        mb: 2,
        bgcolor: 'background.paper',
        borderRadius: '16px',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        p: 2.25,
        transition: 'all 0.3s ease',
        position: 'relative',
        zIndex: focused ? 10 : 1,
        boxShadow: focused ? '0 16px 36px rgba(0,0,0,0.08)' : '0 3px 14px rgba(0,0,0,0.02)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.4 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary' }}>
          Create Post
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={postMode}
          onChange={(_, val) => val && setPostMode(val)}
          sx={{
            bgcolor: (theme) => theme.palette.mode === 'light' ? '#F3F4F6' : 'rgba(255,255,255,0.06)',
            borderRadius: '999px',
            p: '2px',
            '& .MuiToggleButton-root': {
              border: 'none',
              borderRadius: '999px',
              px: 1.4,
              py: 0.45,
              color: 'text.secondary',
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'none',
            },
            '& .MuiToggleButton-root.Mui-selected': {
              bgcolor: '#FF6154',
              color: '#fff',
              '&:hover': { bgcolor: '#FF6154' },
            },
          }}
        >
          <ToggleButton value="all">All Posts</ToggleButton>
          <ToggleButton value="promo">Promotions</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Avatar src={user?.profilePicture || logo} sx={{ width: 44, height: 44, bgcolor: '#FF6154', flexShrink: 0 }}>
          {user?.name?.charAt(0)}
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={12}
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => { setContent(e.target.value); setError(''); }}
            onFocus={() => setFocused(true)}
            onBlur={() => !content && !image && setFocused(false)}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: '1rem',
                lineHeight: 1.6,
                color: 'text.primary',
                pt: 0.2,
                '&::placeholder': { color: 'text.secondary', opacity: 0.7 },
              },
            }}
            id="create-post-input"
          />

          <Collapse in={!!error}>
            <Alert
              severity="warning"
              variant="outlined"
              onClose={() => setError('')}
              sx={{ mt: 1.3, borderRadius: '10px', fontSize: '0.82rem' }}
            >
              {error}
            </Alert>
          </Collapse>

          <AnimatePresence>
            {preview && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                <Box sx={{ position: 'relative', mt: 1.6, borderRadius: '12px', overflow: 'hidden', maxHeight: 380 }}>
                  <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 380, objectFit: 'cover', display: 'block' }} />
                  <IconButton
                    onClick={removeImage}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: '#fff',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.72)' },
                    }}
                  >
                    <CloseRounded fontSize="small" />
                  </IconButton>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mt: focused || content || preview ? 1.6 : 0.8,
              pt: focused || content || preview ? 1.4 : 0,
              borderTop: focused || content || preview ? (theme) => `1px solid ${theme.palette.divider}` : 'none',
            }}
          >
            <Box sx={{ display: 'flex', gap: 0.8 }}>
              <input type="file" accept="image/*" hidden ref={fileRef} onChange={handleImageSelect} />
              <IconButton onClick={() => fileRef.current?.click()} sx={{ color: '#FF6154' }} id="image-upload-button">
                <ImageRounded sx={{ fontSize: 22 }} />
              </IconButton>
              <IconButton sx={{ color: 'text.secondary' }}>
                <EmojiEmotionsOutlined sx={{ fontSize: 22 }} />
              </IconButton>
              <IconButton sx={{ color: 'text.secondary' }}>
                <FormatListBulletedRounded sx={{ fontSize: 21 }} />
              </IconButton>
              <Button
                size="small"
                startIcon={<CampaignRounded sx={{ fontSize: 18 }} />}
                onClick={() => {
                  setContent((prev) => `${prev}${prev ? ' ' : ''}#Promote`);
                  setPostMode('promo');
                }}
                sx={{
                  borderRadius: '999px',
                  textTransform: 'none',
                  fontWeight: 700,
                  color: '#FF6154',
                  px: 1,
                  minWidth: 0,
                  bgcolor: postMode === 'promo' ? 'rgba(255,97,84,0.1)' : 'transparent',
                }}
              >
                Promote
              </Button>
            </Box>

            <Button
              variant="contained"
              disableElevation
              onClick={handleSubmit}
              disabled={(!content.trim() && !image) || loading}
              sx={{
                borderRadius: '999px',
                px: 3,
                py: 0.9,
                fontSize: '0.88rem',
                fontWeight: 700,
                textTransform: 'none',
                bgcolor: (!content.trim() && !image) ? '#E5E7EB' : undefined,
                color: (!content.trim() && !image) ? '#9CA3AF' : undefined,
              }}
              id="post-submit-button"
            >
              {loading ? <CircularProgress size={18} sx={{ color: 'rgba(0,0,0,0.25)' }} /> : 'Publish Post'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CreatePost;
