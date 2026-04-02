const User = require('../models/User');
const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');
const { uploadImage } = require('../utils/cloudinary');
const { pushNotification } = require('../utils/notifications');

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  googleId: user.googleId || null,
  profilePicture: user.profilePicture,
  coverPhoto: user.coverPhoto,
  website: user.website,
  headline: user.headline,
  location: user.location,
  bio: user.bio,
  isVerified: user.isVerified,
  followers: user.followers || [],
  following: user.following || [],
  settings: user.settings || {},
  joinedDate: user.joinedDate || user.createdAt,
  createdAt: user.createdAt,
});

const deepMergeSettings = (target = {}, source = {}) => {
  const output = { ...target };
  Object.keys(source || {}).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = target?.[key];
    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      output[key] = deepMergeSettings(targetValue, sourceValue);
    } else {
      output[key] = sourceValue;
    }
  });
  return output;
};

const buildProfileStats = async (userId) => {
  const [stats] = await Post.aggregate([
    { $match: { author: userId } },
    {
      $group: {
        _id: null,
        postsCount: { $sum: 1 },
        likesReceived: { $sum: { $size: '$likes' } },
        commentsReceived: { $sum: { $size: '$comments' } },
      },
    },
  ]);

  return {
    postsCount: stats?.postsCount || 0,
    likesReceived: stats?.likesReceived || 0,
    commentsReceived: stats?.commentsReceived || 0,
  };
};

const resolveUsersByUsernames = async (usernames) => {
  if (!Array.isArray(usernames) || usernames.length === 0) return [];

  const users = await User.find({
    username: { $in: usernames.map((u) => u.toLowerCase()) },
  }).select('name username profilePicture headline isVerified');

  const map = new Map(users.map((u) => [u.username, u]));
  return usernames
    .map((username) => map.get((username || '').toLowerCase()))
    .filter(Boolean)
    .map((u) => ({
      id: u._id,
      name: u.name,
      username: u.username,
      profilePicture: u.profilePicture,
      headline: u.headline || '',
      isVerified: !!u.isVerified,
    }));
};

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ user: sanitizeUser(user) });
});

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const stats = await buildProfileStats(user._id);
  res.status(200).json({ user: sanitizeUser(user), stats });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (req.body.name) user.name = req.body.name;
  if (typeof req.body.bio === 'string') user.bio = req.body.bio;
  if (typeof req.body.website === 'string') user.website = req.body.website.trim();
  if (typeof req.body.headline === 'string') user.headline = req.body.headline.trim();
  if (typeof req.body.location === 'string') user.location = req.body.location.trim();

  if (req.body.username && req.body.username !== user.username) {
    const usernameExists = await User.exists({ username: req.body.username });
    if (usernameExists) {
      return res.status(409).json({ message: 'Username already in use' });
    }
    user.username = req.body.username;
  }

  const profilePictureFile = req.files?.profilePicture?.[0];
  const coverPhotoFile = req.files?.coverPhoto?.[0];

  if (profilePictureFile) {
    const image = await uploadImage(profilePictureFile.buffer, 'kyro-social/profile-pictures');
    user.profilePicture = image.url;
  }

  if (coverPhotoFile) {
    const image = await uploadImage(coverPhotoFile.buffer, 'kyro-social/cover-photos');
    user.coverPhoto = image.url;
  }

  await user.save();

  res.status(200).json({
    message: 'Profile updated successfully',
    user: sanitizeUser(user),
  });
});

exports.getFollowers = asyncHandler(async (req, res) => {
  const target = await User.findOne({ username: req.params.username.toLowerCase() }).select('followers');
  if (!target) {
    return res.status(404).json({ message: 'User not found' });
  }

  const followers = await resolveUsersByUsernames(target.followers || []);
  res.status(200).json({ users: followers, total: followers.length });
});

exports.getFollowing = asyncHandler(async (req, res) => {
  const target = await User.findOne({ username: req.params.username.toLowerCase() }).select('following');
  if (!target) {
    return res.status(404).json({ message: 'User not found' });
  }

  const following = await resolveUsersByUsernames(target.following || []);
  res.status(200).json({ users: following, total: following.length });
});

exports.toggleFollow = asyncHandler(async (req, res) => {
  const targetUsername = req.params.username.toLowerCase();
  const currentUsername = req.user.username.toLowerCase();

  if (targetUsername === currentUsername) {
    return res.status(400).json({ message: 'You cannot follow yourself' });
  }

  const [currentUser, targetUser] = await Promise.all([
    User.findById(req.user._id),
    User.findOne({ username: targetUsername }),
  ]);

  if (!targetUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  const alreadyFollowing = (currentUser.following || []).includes(targetUsername);

  if (alreadyFollowing) {
    currentUser.following = (currentUser.following || []).filter((u) => u !== targetUsername);
    targetUser.followers = (targetUser.followers || []).filter((u) => u !== currentUsername);
  } else {
    currentUser.following = [...new Set([...(currentUser.following || []), targetUsername])];
    targetUser.followers = [...new Set([...(targetUser.followers || []), currentUsername])];
  }

  await Promise.all([currentUser.save(), targetUser.save()]);

  if (!alreadyFollowing) {
    await pushNotification({
      toUsername: targetUser.username,
      type: 'follow',
      fromUsername: currentUser.username,
      text: `${currentUser.username} started following you`,
    });
  }

  res.status(200).json({
    message: alreadyFollowing ? 'Unfollowed' : 'Following',
    isFollowing: !alreadyFollowing,
    followerCount: targetUser.followers.length,
  });
});

exports.getNotifications = asyncHandler(async (req, res) => {
  const limit = Number.parseInt(req.query.limit || '30', 10);
  const safeLimit = Number.isNaN(limit) ? 30 : Math.max(1, Math.min(limit, 100));
  const notifications = (req.user.notifications || []).slice(0, safeLimit);
  const unreadCount = (req.user.notifications || []).filter((n) => !n.isRead).length;
  res.status(200).json({ notifications, unreadCount });
});

exports.markNotificationsRead = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.notifications = (user.notifications || []).map((n) => ({ ...n.toObject(), isRead: true }));
  await user.save();
  res.status(200).json({ message: 'Notifications marked as read', unreadCount: 0 });
});

exports.getSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('settings');
  res.status(200).json({ settings: user?.settings || {} });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('settings');
  const merged = deepMergeSettings(user.settings?.toObject?.() || user.settings || {}, req.body || {});
  user.settings = merged;
  await user.save();
  res.status(200).json({ message: 'Settings updated successfully', settings: user.settings });
});

exports.searchUsers = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.status(200).json({ users: [] });
  }

  const regex = new RegExp(q, 'i');
  const users = await User.find({
    $or: [{ name: regex }, { username: regex }],
  })
    .limit(15)
    .select('name username profilePicture bio isVerified');

  res.status(200).json({ users });
});
