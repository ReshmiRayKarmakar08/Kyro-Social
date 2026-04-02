const express = require('express');
const router = express.Router();
const {
  createPost,
  getFeed,
  getPost,
  toggleLike,
  addComment,
  deletePost,
  getUserPosts,
} = require('../controllers/postController');
const { auth, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public (with optional auth for personalized feed)
router.get('/', optionalAuth, getFeed);
router.get('/user/:username', getUserPosts);
router.get('/:id', getPost);

// Protected
router.post('/', auth, upload.single('image'), createPost);
router.put('/:id/like', auth, toggleLike);
router.post('/:id/comment', auth, addComment);
router.delete('/:id', auth, deletePost);

module.exports = router;
