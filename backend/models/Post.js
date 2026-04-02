const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userAvatar: {
    type: String,
    default: '',
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    maxlength: [500, 'Comment cannot exceed 500 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const likeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  likedAt: {
    type: Date,
    default: Date.now,
  },
});

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorUsername: {
      type: String,
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorAvatar: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      maxlength: [2000, 'Post content cannot exceed 2000 characters'],
    },
    image: {
      type: String,
      default: '',
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    likes: [likeSchema],
    likeCount: {
      type: Number,
      default: 0,
    },
    comments: [commentSchema],
    commentCount: {
      type: Number,
      default: 0,
    },
    // Track all usernames who interacted (liked or commented)
    interactedUsers: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-validate: at least content or image required
postSchema.pre('validate', function (next) {
  if (!this.content && !this.image) {
    this.invalidate('content', 'Post must have either text content or an image');
  }
  next();
});

// Indexes for feed performance
postSchema.index({ createdAt: -1 });
postSchema.index({ likeCount: -1 });
postSchema.index({ commentCount: -1 });
postSchema.index({ authorUsername: 1 });
postSchema.index({ author: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
