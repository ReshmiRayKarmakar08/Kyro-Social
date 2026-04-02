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
  getPostLikes,
  incrementShare,
} = require('../controllers/postController');
const { protect, optionalProtect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createPostSchema, addCommentSchema } = require('../validations/schemas');
const upload = require('../middleware/upload');

const optionalImageUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return upload.single('image')(req, res, next);
  }
  return next();
};

router.get('/', optionalProtect, getFeed);
router.get('/user/:username', getUserPosts);
router.get('/:id', getPost);

router.get('/:id/likes', optionalProtect, getPostLikes);
router.post('/:id/share', optionalProtect, incrementShare);

router.post('/', protect, optionalImageUpload, validate(createPostSchema), createPost);
router.put('/:id/like', protect, toggleLike);
router.post('/:id/comment', protect, validate(addCommentSchema), addComment);
router.delete('/:id', protect, deletePost);

module.exports = router;
