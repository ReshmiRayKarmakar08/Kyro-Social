const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const { uploadImage, deleteImage } = require('../utils/cloudinary');
const asyncHandler = require('../utils/asyncHandler');
const { pushNotification } = require('../utils/notifications');
const { getIO } = require('../utils/socket');
const { sendActivityEmail } = require('../utils/email');

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
const mentionRegex = /(^|\s)@([a-z0-9_]{3,30})\b/gi;

const extractMentionUsernames = (text = '') => {
  const usernames = new Set();
  mentionRegex.lastIndex = 0;
  let match = mentionRegex.exec(text);
  while (match) {
    usernames.add(String(match[2] || '').toLowerCase());
    match = mentionRegex.exec(text);
  }
  return [...usernames];
};

const shouldSendNotification = (user, key) => Boolean(user?.settings?.notifications?.[key] ?? true);
const shouldSendEmailNotification = (user, key) => Boolean(user?.settings?.emailNotifications?.[key] ?? false);

const sendActivityNotification = async ({
  toUsername,
  type,
  settingKey,
  fromUsername,
  postId,
  text,
}) => {
  if (!toUsername || !type || !settingKey) return;
  const targetUser = await User.findOne({ username: String(toUsername).toLowerCase() })
    .select('username email name settings');
  if (!targetUser) return;
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
        ctaUrl: postId ? `${frontendBase}/` : `${frontendBase}/notifications`,
      });
    } catch {
      // Email is non-blocking for activity events.
    }
  }
};

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
    isSaved: Boolean(post.isSaved),
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
              _id: '$$comment._id',
              username: '$$comment.username',
              text: '$$comment.text',
              parentCommentId: '$$comment.parentCommentId',
              mentionUsernames: '$$comment.mentionUsernames',
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

  const savedPostIdSet = req.user
    ? new Set((req.user.savedPosts || []).map((id) => String(id)))
    : null;

  const feedPosts = posts.map((item) => {
    const compat = withCompatPostShape(item);
    return {
      ...compat,
      isSaved: savedPostIdSet ? savedPostIdSet.has(String(item._id)) : false,
    };
  });

  res.status(200).json({
    posts: feedPosts,
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
              _id: '$$comment._id',
              username: '$$comment.username',
              text: '$$comment.text',
              parentCommentId: '$$comment.parentCommentId',
              mentionUsernames: '$$comment.mentionUsernames',
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

  const compat = withCompatPostShape(post);
  const isSaved = req.user
    ? (req.user.savedPosts || []).some((id) => String(id) === String(post._id))
    : false;

  res.status(200).json({
    post: {
      ...compat,
      isSaved,
    },
  });
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
      await sendActivityNotification({
        toUsername: author.username,
        type: 'like',
        settingKey: 'likes',
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
    parentCommentId: req.body.parentCommentId || null,
    mentionUsernames: extractMentionUsernames(req.body.text || ''),
    timestamp: new Date(),
  };

  if (comment.parentCommentId && !mongoose.isValidObjectId(comment.parentCommentId)) {
    return res.status(400).json({ message: 'Invalid parent comment id' });
  }

  const parentComment = comment.parentCommentId
    ? post.comments.find((item) => String(item._id) === String(comment.parentCommentId))
    : null;

  if (comment.parentCommentId && !parentComment) {
    return res.status(404).json({ message: 'Parent comment not found' });
  }

  post.comments.push(comment);
  await post.save();
  const createdComment = post.comments[post.comments.length - 1];

  const io = getIO();
  if (io) {
    io.emit('post:commented', {
      postId: String(post._id),
      by: req.user.username,
      commentCount: post.comments.length,
      comment: {
        _id: createdComment._id,
        username: createdComment.username,
        text: createdComment.text,
        parentCommentId: createdComment.parentCommentId || null,
        mentionUsernames: createdComment.mentionUsernames || [],
        timestamp: createdComment.timestamp,
        createdAt: createdComment.timestamp,
      },
    });
  }

  const author = await User.findById(post.author).select('username');
  if (author?.username) {
    await sendActivityNotification({
      toUsername: author.username,
      type: 'comment',
      settingKey: 'comments',
      fromUsername: req.user.username,
      postId: post._id,
      text: `${req.user.username} commented: "${comment.text}"`,
    });
  }

  if (parentComment?.username && parentComment.username !== req.user.username) {
    await sendActivityNotification({
      toUsername: parentComment.username,
      type: 'comment',
      settingKey: 'comments',
      fromUsername: req.user.username,
      postId: post._id,
      text: `${req.user.username} replied to your comment`,
    });
  }

  const mentionTargets = (createdComment.mentionUsernames || []).filter(
    (username) => username && username !== req.user.username && username !== author?.username
  );

  await Promise.all(
    mentionTargets.map((mentionedUsername) => sendActivityNotification({
      toUsername: mentionedUsername,
      type: 'mention',
      settingKey: 'mentions',
      fromUsername: req.user.username,
      postId: post._id,
      text: `${req.user.username} mentioned you in a comment`,
    }))
  );

  if (mentionTargets.length) {
    const ioMention = getIO();
    if (ioMention) {
      ioMention.emit('post:mentioned', {
        postId: String(post._id),
        by: req.user.username,
        targets: mentionTargets,
      });
    }
  }

  res.status(201).json({
    message: 'Comment added',
    comment: {
      _id: createdComment._id,
      username: createdComment.username,
      text: createdComment.text,
      parentCommentId: createdComment.parentCommentId || null,
      mentionUsernames: createdComment.mentionUsernames || [],
      timestamp: createdComment.timestamp,
      createdAt: createdComment.timestamp,
    },
    commentCount: post.comments.length,
  });
});

exports.deleteComment = asyncHandler(async (req, res) => {
  const { id: postId, commentId } = req.params;

  if (!mongoose.isValidObjectId(postId) || !mongoose.isValidObjectId(commentId)) {
    return res.status(400).json({ message: 'Invalid post id or comment id' });
  }

  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const targetComment = post.comments.id(commentId);
  if (!targetComment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  const isCommentOwner = String(targetComment.username) === String(req.user.username);
  const isPostOwner = String(post.author) === String(req.user._id);
  if (!isCommentOwner && !isPostOwner) {
    return res.status(403).json({ message: 'You can only delete your own comment' });
  }

  const toDelete = new Set([String(commentId)]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of post.comments) {
      const parentId = item.parentCommentId ? String(item.parentCommentId) : null;
      if (parentId && toDelete.has(parentId) && !toDelete.has(String(item._id))) {
        toDelete.add(String(item._id));
        changed = true;
      }
    }
  }

  post.comments = post.comments.filter((item) => !toDelete.has(String(item._id)));
  await post.save();

  const io = getIO();
  if (io) {
    io.emit('post:commentDeleted', {
      postId: String(post._id),
      deletedCommentIds: [...toDelete],
      commentCount: post.comments.length,
      by: req.user.username,
    });
  }

  res.status(200).json({
    message: 'Comment deleted',
    deletedCommentIds: [...toDelete],
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
              _id: '$$comment._id',
              username: '$$comment.username',
              text: '$$comment.text',
              parentCommentId: '$$comment.parentCommentId',
              mentionUsernames: '$$comment.mentionUsernames',
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
  const savedPostIdSet = req.user
    ? new Set((req.user.savedPosts || []).map((id) => String(id)))
    : null;

  res.status(200).json({
    posts: posts.map((post) => {
      const compat = withCompatPostShape(post);
      return {
        ...compat,
        isSaved: savedPostIdSet ? savedPostIdSet.has(String(post._id)) : false,
      };
    }),
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
  const usernames = [...new Set((post.likes || []).map((username) => String(username).toLowerCase()))];
  const users = await User.find({ username: { $in: usernames } })
    .select('name username profilePicture headline isVerified')
    .lean();
  const userMap = new Map(users.map((u) => [u.username, u]));
  const orderedUsers = usernames
    .map((username) => userMap.get(username))
    .filter(Boolean);

  res.status(200).json({
    users: orderedUsers,
    likes: orderedUsers,
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

exports.toggleSavePost = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post id' });
  }

  const postExists = await Post.exists({ _id: req.params.id });
  if (!postExists) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const savedPosts = req.user.savedPosts || [];
  const index = savedPosts.findIndex((id) => String(id) === String(req.params.id));

  let saved = false;
  if (index >= 0) {
    savedPosts.splice(index, 1);
    saved = false;
  } else {
    savedPosts.push(req.params.id);
    saved = true;
  }

  req.user.savedPosts = savedPosts;
  await req.user.save();

  res.status(200).json({
    message: saved ? 'Post saved' : 'Post removed from saved',
    saved,
    postId: req.params.id,
    savedCount: req.user.savedPosts.length,
  });
});

exports.getSavedPosts = asyncHandler(async (req, res) => {
  const limit = clampNumber(req.query.limit, 10, 1, 50);
  const page = clampNumber(req.query.page, 1, 1, 1000000);
  const offset = clampNumber(req.query.offset, (page - 1) * limit, 0, 1000000);
  const savedIds = (req.user.savedPosts || []).map((id) => toObjectId(id));

  if (!savedIds.length) {
    return res.status(200).json({
      posts: [],
      pagination: {
        limit,
        offset,
        total: 0,
        currentPage: page,
        totalPages: 1,
        hasMore: false,
      },
    });
  }

  const basePipeline = [{ $match: { _id: { $in: savedIds } } }];
  const totalResult = await Post.aggregate([...basePipeline, { $count: 'count' }]);
  const total = totalResult[0]?.count || 0;

  const posts = await Post.aggregate([
    ...basePipeline,
    { $sort: { createdAt: -1 } },
    { $skip: offset },
    { $limit: limit },
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
              _id: '$$comment._id',
              username: '$$comment.username',
              text: '$$comment.text',
              parentCommentId: '$$comment.parentCommentId',
              mentionUsernames: '$$comment.mentionUsernames',
              timestamp: '$$comment.timestamp',
              createdAt: '$$comment.timestamp',
            },
          },
        },
        createdAt: 1,
        updatedAt: 1,
        shareCount: 1,
        type: 1,
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
    },
  ]);

  res.status(200).json({
    posts: posts.map((post) => ({ ...withCompatPostShape(post), isSaved: true })),
    pagination: {
      limit,
      offset,
      total,
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: offset + posts.length < total,
    },
  });
});
