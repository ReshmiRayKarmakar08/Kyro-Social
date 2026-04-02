import { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  Box,
  Avatar,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
} from '@mui/material';
import {
  ImageRounded,
  CloseRounded,
  SendRounded,
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
  const fileRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if ((!content.trim() && !image) || loading) return;
    setLoading(true);
    try {
      const formData = new FormData();
      if (content.trim()) formData.append('content', content.trim());
      if (image) formData.append('image', image);
      await onSubmit(formData);
      setContent('');
      removeImage();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{ mb: 2, overflow: 'visible' }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Avatar
            src={user?.profilePicture || logo}
            sx={{ width: 42, height: 42, bgcolor: '#FF6154', flexShrink: 0 }}
          >
            {user?.name?.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={6}
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: { fontSize: '0.95rem', lineHeight: 1.5, py: 0.5 },
              }}
              id="create-post-input"
            />

            {/* Image Preview */}
            <AnimatePresence>
              {preview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      mt: 1.5,
                      borderRadius: 3,
                      overflow: 'hidden',
                      maxHeight: 300,
                    }}
                  >
                    <img
                      src={preview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        maxHeight: 300,
                        objectFit: 'cover',
                        borderRadius: 12,
                      }}
                    />
                    <IconButton
                      onClick={removeImage}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' },
                      }}
                    >
                      <CloseRounded fontSize="small" />
                    </IconButton>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mt: 1.5,
                pt: 1,
              }}
            >
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={fileRef}
                  onChange={handleImageSelect}
                />
                <IconButton
                  onClick={() => fileRef.current?.click()}
                  size="small"
                  sx={{ color: '#FF6154' }}
                  id="image-upload-button"
                >
                  <ImageRounded sx={{ fontSize: 22 }} />
                </IconButton>
                {image && (
                  <Chip
                    label="1 image"
                    size="small"
                    onDelete={removeImage}
                    sx={{ fontSize: '0.75rem', height: 26 }}
                  />
                )}
              </Box>
              <Button
                variant="contained"
                size="small"
                onClick={handleSubmit}
                disabled={(!content.trim() && !image) || loading}
                component={motion.button}
                whileTap={{ scale: 0.92 }}
                endIcon={<SendRounded sx={{ fontSize: '16px !important' }} />}
                sx={{
                  borderRadius: 50,
                  px: 2.5,
                  py: 0.7,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
                id="post-submit-button"
              >
                {loading ? 'Posting...' : 'Post'}
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreatePost;
