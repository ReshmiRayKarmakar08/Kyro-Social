const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    mentionUsernames: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    textContent: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    imagePublicId: {
      type: String,
      default: '',
      select: false,
    },
    likes: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    comments: [commentSchema],
    type: {
      type: String,
      enum: ['all', 'promo'],
      default: 'all',
      index: true,
    },
    shareCount: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { timestamps: true }
);

postSchema.pre('validate', function ensurePostHasContent(next) {
  if (!this.textContent && !this.imageUrl) {
    this.invalidate('textContent', 'Post must include text content or an image');
  }
  next();
});

postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ likes: 1, createdAt: -1 });
postSchema.index({ 'comments.username': 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
