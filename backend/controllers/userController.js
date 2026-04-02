const User = require('../models/User');
const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');
const { uploadImage } = require('../utils/cloudinary');
const { pushNotification } = require('../utils/notifications');
const { sendActivityEmail, sendProfileUpdatedEmail } = require('../utils/email');

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

const shouldSendNotification = (user, key) => Boolean(user?.settings?.notifications?.[key] ?? true);
const shouldSendEmailNotification = (user, key) => Boolean(user?.settings?.emailNotifications?.[key] ?? false);
const toDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const sendUserActivityNotification = async ({
  targetUser,
  type,
  settingKey,
  fromUsername,
  postId,
  text,
}) => {
  if (!targetUser || !settingKey) return;
  if (String(targetUser.username).toLowerCase() === String(fromUsername || '').toLowerCase()) return;

  if (shouldSendNotification(targetUser, settingKey)) {
    await pushNotification({
      toUsername: targetUser.username,
      type,
      fromUsername,
      postId,
      text,
    });
  }

  if (shouldSendEmailNotification(targetUser, settingKey) && targetUser.email) {
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    try {
      await sendActivityEmail(targetUser.email, targetUser.name, {
        title: 'New activity on your Kyro profile',
        message: text,
        ctaUrl: `${frontendBase}/notifications`,
      });
    } catch {
      // Non-blocking
    }
  }
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
  const changedFields = [];

  if (req.body.name && req.body.name !== user.name) {
    user.name = req.body.name;
    changedFields.push('Name');
  }
  if (typeof req.body.bio === 'string' && req.body.bio !== user.bio) {
    user.bio = req.body.bio;
    changedFields.push('Bio');
  }
  if (typeof req.body.website === 'string' && req.body.website.trim() !== user.website) {
    user.website = req.body.website.trim();
    changedFields.push('Website');
  }
  if (typeof req.body.headline === 'string' && req.body.headline.trim() !== user.headline) {
    user.headline = req.body.headline.trim();
    changedFields.push('Headline');
  }
  if (typeof req.body.location === 'string' && req.body.location.trim() !== user.location) {
    user.location = req.body.location.trim();
    changedFields.push('Location');
  }

  if (req.body.username && req.body.username !== user.username) {
    const usernameExists = await User.exists({ username: req.body.username });
    if (usernameExists) {
      return res.status(409).json({ message: 'Username already in use' });
    }
    user.username = req.body.username;
    changedFields.push('Username');
  }

  const profilePictureFile = req.files?.profilePicture?.[0];
  const coverPhotoFile = req.files?.coverPhoto?.[0];

  if (profilePictureFile) {
    const image = await uploadImage(profilePictureFile.buffer, 'kyro-social/profile-pictures');
    user.profilePicture = image.url;
    changedFields.push('Profile picture');
  }

  if (coverPhotoFile) {
    const image = await uploadImage(coverPhotoFile.buffer, 'kyro-social/cover-photos');
    user.coverPhoto = image.url;
    changedFields.push('Cover photo');
  }

  await user.save();

  if (user.email && changedFields.length > 0) {
    try {
      await sendProfileUpdatedEmail(user.email, user.name, { changedFields });
    } catch {
      // non-blocking
    }
  }

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
    User.findById(req.user._id).select('username following'),
    User.findOne({ username: targetUsername }).select('username followers email name settings'),
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
    await sendUserActivityNotification({
      targetUser,
      type: 'follow',
      settingKey: 'follows',
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

exports.getFollowSuggestions = asyncHandler(async (req, res) => {
  const me = await User.findById(req.user._id).select('username following followers settings email name mailMeta');
  const excluded = new Set([me.username, ...(me.following || [])]);

  const suggestions = await User.find({
    username: { $nin: [...excluded] },
  })
    .select('name username profilePicture headline followers')
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  const hydrated = suggestions.map((user) => ({
    id: user._id,
    name: user.name,
    username: user.username,
    profilePicture: user.profilePicture || '',
    headline: user.headline || '',
    mutualFollowers: (user.followers || []).filter((follower) => (me.following || []).includes(follower)).length,
    followerCount: (user.followers || []).length,
  }));

  const todayKey = toDateKey();
  const currentMailMeta = me.mailMeta?.toObject?.() || me.mailMeta || {};
  const isSameDay = currentMailMeta.suggestionWindowDate === todayKey;
  const currentCount = isSameDay ? (currentMailMeta.suggestionMailCount || 0) : 0;
  const canSendSuggestionMail = currentCount < 2;

  const shouldNotify = hydrated.length >= 3 && shouldSendNotification(req.user, 'suggestions');
  if (shouldNotify) {
    await pushNotification({
      toUsername: req.user.username,
      type: 'suggestion_follow',
      text: `Discover ${hydrated.length} people you may want to follow`,
    });

    const suggestionEmailFeatureEnabled = process.env.ENABLE_SUGGESTION_EMAIL === 'true';
    if (suggestionEmailFeatureEnabled && shouldSendEmailNotification(me, 'suggestions') && me.email && canSendSuggestionMail) {
      const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
      try {
        await sendActivityEmail(me.email, me.name, {
          title: 'New people to follow on Kyro',
          message: `We found ${hydrated.length} users you might like to follow.`,
          ctaUrl: `${frontendBase}/explore`,
        });
        me.mailMeta = {
          ...currentMailMeta,
          suggestionWindowDate: todayKey,
          suggestionMailCount: currentCount + 1,
        };
        await me.save();
      } catch {
        // Non-blocking
      }
    }
  }

  res.status(200).json({ users: hydrated });
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
