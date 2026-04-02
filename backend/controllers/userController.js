const User = require('../models/User');
const { uploadImage } = require('../utils/cloudinary');

/**
 * GET /api/users/me
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

/**
 * GET /api/users/:username
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        profilePicture: user.profilePicture,
        coverPhoto: user.coverPhoto,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        joinedDate: user.joinedDate,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

/**
 * PUT /api/users/profile
 * Update profile (with optional profile picture and cover photo uploads)
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, username } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;

    if (username && username !== user.username) {
      const existing = await User.findOne({ username: username.toLowerCase() });
      if (existing) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      user.username = username.toLowerCase();
    }

    // Handle profile picture upload
    if (req.files && req.files.profilePicture) {
      const result = await uploadImage(req.files.profilePicture[0].buffer, 'kyro-social/profiles');
      user.profilePicture = result.url;
    }

    // Handle cover photo upload
    if (req.files && req.files.coverPhoto) {
      const result = await uploadImage(req.files.coverPhoto[0].buffer, 'kyro-social/covers');
      user.coverPhoto = result.url;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        coverPhoto: user.coverPhoto,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
        joinedDate: user.joinedDate,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

/**
 * PUT /api/users/follow/:username
 */
exports.toggleFollow = async (req, res) => {
  try {
    const targetUsername = req.params.username.toLowerCase();

    if (targetUsername === req.user.username) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findOne({ username: targetUsername });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(req.user._id);
    const isFollowing = currentUser.following.includes(targetUsername);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter((u) => u !== targetUsername);
      targetUser.followers = targetUser.followers.filter((u) => u !== currentUser.username);
    } else {
      // Follow
      currentUser.following.push(targetUsername);
      targetUser.followers.push(currentUser.username);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      message: isFollowing ? 'Unfollowed' : 'Following',
      isFollowing: !isFollowing,
      followerCount: targetUser.followers.length,
    });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ message: 'Failed to update follow status' });
  }
};

/**
 * GET /api/users/search?q=
 */
exports.searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 1) {
      return res.json({ users: [] });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find({
      $or: [{ name: searchRegex }, { username: searchRegex }],
    })
      .select('name username profilePicture bio')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ users });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
};
