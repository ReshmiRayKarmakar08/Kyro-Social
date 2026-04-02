const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const { uploadImage, deleteImage } = require('../utils/cloudinary');
const asyncHandler = require('../utils/asyncHandler');
const { pushNotification } = require('../utils/notifications');
const { getIO } = require('../utils/socket');

const clampNumber = (value, defaultValue, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return defaultValue;
  return Math.max(min, Math.min(max, parsed));
};

const normalizeFilter = (value = 'all') => value.toLowerCase().replace(/[\s_]+/g, '');

const buildFeedSort = (filter) => {
  switch (normalizeFilter(filter)) {
    case 'mostliked':
      return { likesCount: -1, createdAt: -1 };
    case 'mostcommented':
      return { commentsCount: -1, createdAt: -1 };
    case 'mostshared':
      return { shareCount: -1, createdAt: -1 };
    case 'foryou':
      return { score: -1, createdAt: -1 };
    default:
      return { createdAt: -1 };
  }
};

const toObjectId = (value) => new mongoose.Types.ObjectId(value);

const withCompatPostShape = (post) => {
  const author = post.author || {};
  const likes = Array.isArray(post.likes)
    ? post.likes.map((like) => (typeof like === 'string' ? { username: like } : like))
    : [];

  const comments = Array.isArray(post.comments)
    ? post.comments.map((comment) => ({
        ...comment,
        createdAt: comment.createdAt || comment.timestamp || post.createdAt,
      }))
    : [];

  return {
    ...post,
    author,
    // Preferred fields
    textContent: post.textContent || '',
    imageUrl: post.imageUrl || '',
    // Frontend compatibility fields
    content: post.textContent || '',
    image: post.imageUrl || '',
    authorUsername: author.username || post.authorUsername || '',
    authorName: author.name || post.authorName || '',
    authorAvatar: author.profilePicture || post.authorAvatar || '',
    likes,
    comments,
    likeCount: typeof post.likeCount === 'number' ? post.likeCount : likes.length,
    commentCount: typeof post.commentCount === 'number' ? post.commentCount : comments.length,
    shareCount: post.shareCount || 0,
    type: post.type || 'all',
  };
};

exports.createPost = asyncHandler(async (req, res) => {
  const textContent = (req.body.textContent || req.body.content || '').trim();
  let imageResult = null;

  if (req.file) {
    imageResult = await uploadImage(req.file.buffer, 'kyro-social/posts');
  }

  if (!textContent && !imageResult) {
    return res.status(400).json({ message: 'Post requires textContent or an image' });
  }

  const post = await Post.create({
    author: req.user._id,
    textContent,
    imageUrl: imageResult?.url || '',
    imagePublicId: imageResult?.publicId || '',
    likes: [],
    comments: [],
    type: req.body.type === 'promo' ? 'promo' : 'all',
  });

  const compatPost = withCompatPostShape({
    ...post.toObject(),
    author: {
      _id: req.user._id,
      username: req.user.username,
      name: req.user.name,
      profilePicture: req.user.profilePicture,
      isVerified: req.user.isVerified,
    },
  });

  res.status(201).json({
    message: 'Post created successfully',
    post: compatPost,
  });
});

exports.getFeed = asyncHandler(async (req, res) => {
  const filter = normalizeFilter(req.query.filter || 'all');
  const limit = clampNumber(req.query.limit, 10, 1, 50);
  const cursor = req.query.cursor ? new Date(req.query.cursor) : null;
  const useCursor = cursor && !Number.isNaN(cursor.getTime());

  const page = clampNumber(req.query.page, 1, 1, 1000000);
  const offsetFromPage = (page - 1) * limit;
  const offset = req.query.offset !== undefined
    ? clampNumber(req.query.offset, 0, 0, 1000000)
    : offsetFromPage;

  const pipeline = [];

  if (useCursor) {
    pipeline.push({
      $match: {
        createdAt: { $lt: cursor },
      },
    });
  }

  pipeline.push(
    {
      $addFields: {
        likesCount: { $size: '$likes' },
        commentsCount: { $size: '$comments' },
      },
    }
  );
  
  if (req.query.type === 'promo') {
    pipeline.push({ $match: { type: 'promo' } });
  } else if (req.query.type === 'all') {
    pipeline.push({ $match: { type: 'all' } });
  }

  if (filter === 'foryou') {
    if (req.user) {
      pipeline.push({
        $addFields: {
          score: {
            $add: [
              { $multiply: [{ $size: '$likes' }, 2] },
              { $multiply: [{ $size: '$comments' }, 3] },
              {
                $cond: [
                  {
                    $in: [req.user.username, '$likes'],
                  },
                  4,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $in: [
                      req.user.username,
                      {
                        $map: {
                          input: '$comments',
                          as: 'comment',
                          in: '$$comment.username',
                        },
                      },
                    ],
                  },
                  4,
                  0,
                ],
              },
            ],
          },
        },
      });
    } else {
      pipeline.push({
        $addFields: {
          score: {
            $add: [
              { $multiply: [{ $size: '$likes' }, 2] },
              { $multiply: [{ $size: '$comments' }, 3] },
            ],
          },
        },
      });
    }
  }

  pipeline.push({ $sort: buildFeedSort(filter) });

  const totalResult = useCursor
    ? [{ count: null }]
    : await Post.aggregate([...pipeline, { $count: 'count' }]);
  const total = totalResult[0]?.count || 0;

  if (!useCursor) {
    pipeline.push({ $skip: offset });
  }
  pipeline.push({ $limit: limit });
  pipeline.push(
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'authorData',
      },
    },
    {
      $unwind: '$authorData',
    },
    {
      $project: {
        textContent: 1,
        imageUrl: 1,
        likes: {
          $map: {
            input: '$likes',
            as: 'username',
            in: { username: '$$username' },
          },
        },
        comments: {
          $map: {
            input: '$comments',
            as: 'comment',
            in: {
              username: '$$comment.username',
              text: '$$comment.text',
              timestamp: '$$comment.timestamp',
              createdAt: '$$comment.timestamp',
            },
          },
        },
        createdAt: 1,
        updatedAt: 1,
        shareCount: 1,
        type: 1,
        likeCount: '$likesCount',
        commentCount: '$commentsCount',
        author: {
          _id: '$authorData._id',
          username: '$authorData.username',
          name: '$authorData.name',
          profilePicture: '$authorData.profilePicture',
          isVerified: '$authorData.isVerified',
        },
      },
    }
  );

  const posts = await Post.aggregate(pipeline);
  const nextCursor = posts.length ? posts[posts.length - 1].createdAt : null;

  res.status(200).json({
    posts: posts.map(withCompatPostShape),
    pagination: {
      limit,
      offset,
      total,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: useCursor ? posts.length === limit : offset + posts.length < total,
      nextCursor,
      mode: useCursor ? 'cursor' : 'offset',
    },
  });
});

exports.getPost = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post id' });
  }

  const [post] = await Post.aggregate([
    { $match: { _id: toObjectId(req.params.id) } },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'authorData',
      },
    },
    { $unwind: '$authorData' },
    {
      $addFields: {
        likesCount: { $size: '$likes' },
        commentsCount: { $size: '$comments' },
      },
    },
    {
      $project: {
        textContent: 1,
        imageUrl: 1,
        likes: {
          $map: { input: '$likes', as: 'username', in: { username: '$$username' } },
        },
        comments: {
          $map: {
            input: '$comments',
            as: 'comment',
            in: {
              username: '$$comment.username',
              text: '$$comment.text',
              timestamp: '$$comment.timestamp',
              createdAt: '$$comment.timestamp',
            },
          },
        },
        createdAt: 1,
        updatedAt: 1,
        likeCount: '$likesCount',
        commentCount: '$commentsCount',
        author: {
          _id: '$authorData._id',
          username: '$authorData.username',
          name: '$authorData.name',
          profilePicture: '$authorData.profilePicture',
          isVerified: '$authorData.isVerified',
        },
        shareCount: 1,
        type: 1,
      },
    },
  ]);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  res.status(200).json({ post: withCompatPostShape(post) });
});

exports.toggleLike = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post id' });
  }

  const post = await Post.findById(req.params.id).select('+imagePublicId');
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const username = req.user.username;
  const alreadyLiked = post.likes.includes(username);

  if (alreadyLiked) {
    post.likes = post.likes.filter((item) => item !== username);
  } else {
    post.likes.push(username);
  }

  await post.save();

  if (!alreadyLiked) {
    const io = getIO();
    if (io) {
      io.emit('post:liked', {
        postId: String(post._id),
        by: username,
        likeCount: post.likes.length,
      });
    }

    const author = await User.findById(post.author).select('username');
    if (author?.username) {
      await pushNotification({
        toUsername: author.username,
        type: 'like',
        fromUsername: username,
        postId: post._id,
        text: `${username} liked your post`,
      });
    }
  }

  res.status(200).json({
    message: alreadyLiked ? 'Post unliked' : 'Post liked',
    likeCount: post.likes.length,
    likes: post.likes.map((u) => ({ username: u })),
  });
});

exports.addComment = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post id' });
  }

  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const comment = {
    username: req.user.username,
    text: req.body.text.trim(),
    timestamp: new Date(),
  };

  post.comments.push(comment);
  await post.save();

  const io = getIO();
  if (io) {
    io.emit('post:commented', {
      postId: String(post._id),
      by: req.user.username,
      commentCount: post.comments.length,
      comment,
    });
  }

  const author = await User.findById(post.author).select('username');
  if (author?.username) {
    await pushNotification({
      toUsername: author.username,
      type: 'comment',
      fromUsername: req.user.username,
      postId: post._id,
      text: `${req.user.username} commented: "${comment.text}"`,
    });
  }

  res.status(201).json({
    message: 'Comment added',
    comment: {
      ...comment,
      createdAt: comment.timestamp,
    },
    commentCount: post.comments.length,
  });
});

exports.deletePost = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post id' });
  }

  const post = await Post.findById(req.params.id).select('+imagePublicId');
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  if (post.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only delete your own posts' });
  }

  if (post.imagePublicId) {
    await deleteImage(post.imagePublicId);
  }

  await Post.deleteOne({ _id: post._id });

  res.status(200).json({ message: 'Post deleted successfully' });
});

exports.getUserPosts = asyncHandler(async (req, res) => {
  const limit = clampNumber(req.query.limit, 10, 1, 50);
  const offset = clampNumber(req.query.offset, 0, 0, 1000000);
  const queryType = (req.query.type || 'posts').toLowerCase();
  const username = req.params.username.toLowerCase();

  const pipeline = [
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'authorData',
      },
    },
    { $unwind: '$authorData' },
  ];

  if (queryType === 'liked') {
    pipeline.push({ $match: { likes: username } });
  } else if (queryType === 'commented') {
    pipeline.push({ $match: { 'comments.username': username } });
  } else {
    pipeline.push({ $match: { 'authorData.username': username } });
  }

  pipeline.push({ $sort: { createdAt: -1 } });

  const totalResult = await Post.aggregate([...pipeline, { $count: 'count' }]);
  const total = totalResult[0]?.count || 0;

  pipeline.push(
    { $skip: offset },
    { $limit: limit },
    {
      $addFields: {
        likeCount: { $size: '$likes' },
        commentCount: { $size: '$comments' },
      },
    },
    {
      $project: {
        textContent: 1,
        imageUrl: 1,
        likes: {
          $map: { input: '$likes', as: 'username', in: { username: '$$username' } },
        },
        comments: {
          $map: {
            input: '$comments',
            as: 'comment',
            in: {
              username: '$$comment.username',
              text: '$$comment.text',
              timestamp: '$$comment.timestamp',
              createdAt: '$$comment.timestamp',
            },
          },
        },
        createdAt: 1,
        updatedAt: 1,
        likeCount: 1,
        commentCount: 1,
        author: {
          _id: '$authorData._id',
          username: '$authorData.username',
          name: '$authorData.name',
          profilePicture: '$authorData.profilePicture',
          isVerified: '$authorData.isVerified',
        },
      },
    }
  );

  const posts = await Post.aggregate(pipeline);

  res.status(200).json({
    posts: posts.map(withCompatPostShape),
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + posts.length < total,
    },
  });
});

exports.getPostLikes = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post id' });
  }

  const post = await Post.findById(req.params.id).select('likes');
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  res.status(200).json({
    likes: (post.likes || []).map((username) => ({ username })),
    likeCount: (post.likes || []).length,
  });
});

exports.incrementShare = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post id' });
  }

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { shareCount: 1 } },
    { new: true, runValidators: false }
  ).select('shareCount');

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const io = getIO();
  if (io) {
    io.emit('post:shared', {
      postId: req.params.id,
      shareCount: post.shareCount || 0,
    });
  }

  res.status(200).json({
    message: 'Share count updated',
    shareCount: post.shareCount || 0,
  });
});
