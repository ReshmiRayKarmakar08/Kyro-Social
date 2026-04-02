const express = require('express');
const router = express.Router();

const {
  getMe,
  getProfile,
  updateProfile,
  toggleFollow,
  searchUsers,
  getFollowers,
  getFollowing,
  getNotifications,
  markNotificationsRead,
  getSettings,
  updateSettings,
  getFollowSuggestions,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateProfileSchema, updateSettingsSchema } = require('../validations/schemas');
const upload = require('../middleware/upload');

router.get('/me', protect, getMe);
router.get('/settings', protect, getSettings);
router.put('/settings', protect, validate(updateSettingsSchema), updateSettings);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);
router.get('/suggestions/follow', protect, getFollowSuggestions);
router.get('/search', protect, searchUsers);
router.put(
  '/profile',
  protect,
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'coverPhoto', maxCount: 1 },
  ]),
  validate(updateProfileSchema),
  updateProfile
);
router.put('/follow/:username', protect, toggleFollow);
router.get('/:username/followers', getFollowers);
router.get('/:username/following', getFollowing);
router.get('/:username', getProfile);

module.exports = router;
