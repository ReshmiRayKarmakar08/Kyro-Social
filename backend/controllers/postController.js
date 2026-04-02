const Post = require('../models/Post');
const User = require('../models/User');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

/**
 * POST /api/posts
 */
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    let imageData = null;

    // Upload image if provided
    if (req.file) {
      imageData = await uploadImage(req.file.buffer, 'kyro-social/posts');
    }

    if (!content && !imageData) {
      return res.status(400).json({ message: 'Post must have either text or an image' });
    }

    const post = await Post.create({
      author: req.user._id,
      authorUsername: req.user.username,
      authorName: req.user.name,
      authorAvatar: req.user.profilePicture || '',
      content: content || '',
      image: imageData ? imageData.url : '',
      imagePublicId: imageData ? imageData.publicId : '',
    });

    res.status(201).json({
      message: 'Post created successfully',
      post,
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
};

/**
 * GET /api/posts
 * Query: ?filter=all|forYou|mostLiked|mostCommented&page=1&limit=10
 */
exports.getFeed = async (req, res) => {
  try {
    const { filter = 'all', page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};
    let sort = { createdAt: -1 };

    switch (filter) {
      case 'forYou':
        if (req.user) {
          // Hybrid: posts from followed users + top engaging posts
          const currentUser = await User.findById(req.user._id);
          const followingList = currentUser.following || [];

          if (followingList.length > 0) {
            query = {
              $or: [
                { authorUsername: { $in: followingList } },
                { likeCount: { $gte: 3 } }, // Posts with 3+ likes
              ],
            };
          } else {
            // No following? Show engagement-based
            sort = { likeCount: -1, commentCount: -1, createdAt: -1 };
          }
        } else {
          sort = { likeCount: -1, commentCount: -1, createdAt: -1 };
        }
        break;

      case 'mostLiked':
        sort = { likeCount: -1, createdAt: -1 };
        break;

      case 'mostCommented':
        sort = { commentCount: -1, createdAt: -1 };
        break;

      default: // 'all'
        sort = { createdAt: -1 };
        break;
    }

    const [posts, total] = await Promise.all([
      Post.find(query).sort(sort).skip(skip).limit(parseInt(limit)),
      Post.countDocuments(query),
    ]);

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPosts: total,
        hasMore: skip + posts.length < total,
      },
    });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ message: 'Failed to fetch feed' });
  }
};

/**
 * GET /api/posts/:id
 */
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch post' });
  }
};

/**
 * PUT /api/posts/:id/like
 */
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id.toString();
    const username = req.user.username;
    const existingLikeIndex = post.likes.findIndex(
      (like) => like.userId.toString() === userId
    );

    if (existingLikeIndex > -1) {
      // Unlike
      post.likes.splice(existingLikeIndex, 1);
      post.likeCount = Math.max(0, post.likeCount - 1);
      // Remove from interactedUsers if no other interactions
      const hasCommented = post.comments.some((c) => c.userId.toString() === userId);
      if (!hasCommented) {
        post.interactedUsers = post.interactedUsers.filter((u) => u !== username);
      }
    } else {
      // Like
      post.likes.push({ userId: req.user._id, username, likedAt: new Date() });
      post.likeCount = post.likes.length;
      if (!post.interactedUsers.includes(username)) {
        post.interactedUsers.push(username);
      }
    }

    await post.save();

    res.json({
      message: existingLikeIndex > -1 ? 'Post unliked' : 'Post liked',
      post,
    });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: 'Failed to update like' });
  }
};

/**
 * POST /api/posts/:id/comment
 */
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      userId: req.user._id,
      username: req.user.username,
      userName: req.user.name,
      userAvatar: req.user.profilePicture || '',
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments.push(comment);
    post.commentCount = post.comments.length;

    if (!post.interactedUsers.includes(req.user.username)) {
      post.interactedUsers.push(req.user.username);
    }

    await post.save();

    res.status(201).json({
      message: 'Comment added',
      comment: post.comments[post.comments.length - 1],
      commentCount: post.commentCount,
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};

/**
 * DELETE /api/posts/:id
 */
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    // Delete image from Cloudinary
    if (post.imagePublicId) {
      await deleteImage(post.imagePublicId);
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
};

/**
 * GET /api/posts/user/:username
 */
exports.getUserPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, type = 'posts' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};
    let sort = { createdAt: -1 };

    switch (type) {
      case 'liked':
        query = { 'likes.username': req.params.username };
        break;
      case 'commented':
        query = { 'comments.username': req.params.username };
        break;
      default:
        query = { authorUsername: req.params.username };
        break;
    }

    const [posts, total] = await Promise.all([
      Post.find(query).sort(sort).skip(skip).limit(parseInt(limit)),
      Post.countDocuments(query),
    ]);

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPosts: total,
        hasMore: skip + posts.length < total,
      },
    });
  } catch (error) {
    console.error('User posts error:', error);
    res.status(500).json({ message: 'Failed to fetch user posts' });
  }
};
