const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 60,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    coverPhoto: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    headline: {
      type: String,
      default: '',
      maxlength: 100,
    },
    location: {
      type: String,
      default: '',
      maxlength: 80,
    },
    bio: {
      type: String,
      default: '',
      maxlength: 160,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    followers: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    following: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
    joinedDate: {
      type: Date,
      default: Date.now,
    },
    mailMeta: {
      lastLoginMailAt: { type: Date, default: null },
      firstMessageMailSent: { type: Boolean, default: false },
      suggestionWindowDate: { type: String, default: '' },
      suggestionMailCount: { type: Number, default: 0 },
    },
    notifications: [
      {
        type: {
          type: String,
          enum: ['like', 'comment', 'mention', 'follow', 'message', 'suggestion_follow'],
          required: true,
        },
        fromUsername: {
          type: String,
          trim: true,
          lowercase: true,
        },
        postId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Post',
        },
        text: {
          type: String,
          default: '',
          maxlength: 240,
        },
        isRead: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    settings: {
      privacy: {
        isPrivateAccount: { type: Boolean, default: false },
        allowTagsFrom: { type: String, enum: ['everyone', 'followers', 'no_one'], default: 'everyone' },
        allowMentionsFrom: { type: String, enum: ['everyone', 'followers', 'no_one'], default: 'everyone' },
      },
      interactions: {
        allowCommentsFrom: { type: String, enum: ['everyone', 'followers', 'no_one'], default: 'everyone' },
        showLikeCounts: { type: Boolean, default: true },
        allowMessageRequests: { type: Boolean, default: true },
      },
      safety: {
        hiddenWordsEnabled: { type: Boolean, default: false },
        hiddenWords: [{ type: String, trim: true, lowercase: true }],
        restrictedUsernames: [{ type: String, trim: true, lowercase: true }],
        blockedUsernames: [{ type: String, trim: true, lowercase: true }],
        mutedUsernames: [{ type: String, trim: true, lowercase: true }],
      },
      app: {
        language: { type: String, default: 'en' },
        appearance: { type: String, enum: ['system', 'light', 'dark'], default: 'light' },
        reducedMotion: { type: Boolean, default: false },
      },
      notifications: {
        likes: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        follows: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        suggestions: { type: Boolean, default: true },
      },
      emailNotifications: {
        likes: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        follows: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        suggestions: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function passwordHashHook(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
