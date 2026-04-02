const express = require('express');
const router = express.Router();
const {
  getMe,
  getProfile,
  updateProfile,
  toggleFollow,
  searchUsers,
} = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Protected routes
router.get('/me', auth, getMe);
router.get('/search', auth, searchUsers);
router.put(
  '/profile',
  auth,
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'coverPhoto', maxCount: 1 },
  ]),
  updateProfile
);
router.put('/follow/:username', auth, toggleFollow);

// Public routes
router.get('/:username', getProfile);

module.exports = router;
