const Joi = require('joi');

const username = Joi.string().trim().lowercase().pattern(/^[a-z0-9_]+$/).min(3).max(30);
const email = Joi.string().trim().lowercase().email();
const password = Joi.string().min(6).max(128);

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).required(),
  username: username.required(),
  email: email.required(),
  password: password.required(),
});

const loginSchema = Joi.object({
  email: email.required(),
  password: password.required(),
});

const verifyOtpSchema = Joi.object({
  email: email.required(),
  otp: Joi.string().pattern(/^\d{6}$/).required(),
});

const resendOtpSchema = Joi.object({
  email: email.required(),
});

const forgotPasswordSchema = Joi.object({
  email: email.required(),
});

const resetPasswordSchema = Joi.object({
  email: email.required(),
  otp: Joi.string().pattern(/^\d{6}$/).required(),
  newPassword: password.required(),
});

const googleAuthSchema = Joi.object({
  idToken: Joi.string(),
  googleId: Joi.string(),
  email,
  name: Joi.string().trim().max(60),
}).or('idToken', 'googleId');

const createPostSchema = Joi.object({
  textContent: Joi.string().trim().allow('').max(2000),
  content: Joi.string().trim().allow('').max(2000),
});

const addCommentSchema = Joi.object({
  text: Joi.string().trim().min(1).max(500).required(),
  parentCommentId: Joi.string().trim().optional().allow(null, ''),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60),
  username,
  bio: Joi.string().allow('').max(160),
  website: Joi.string().trim().allow('').uri({ scheme: [/https?/] }).max(200),
  headline: Joi.string().trim().allow('').max(100),
  location: Joi.string().trim().allow('').max(80),
});

const updateSettingsSchema = Joi.object({
  privacy: Joi.object({
    isPrivateAccount: Joi.boolean(),
    allowTagsFrom: Joi.string().valid('everyone', 'followers', 'no_one'),
    allowMentionsFrom: Joi.string().valid('everyone', 'followers', 'no_one'),
  }),
  interactions: Joi.object({
    allowCommentsFrom: Joi.string().valid('everyone', 'followers', 'no_one'),
    showLikeCounts: Joi.boolean(),
    allowMessageRequests: Joi.boolean(),
  }),
  safety: Joi.object({
    hiddenWordsEnabled: Joi.boolean(),
    hiddenWords: Joi.array().items(Joi.string().trim().lowercase().max(40)).max(100),
    restrictedUsernames: Joi.array().items(username).max(500),
    blockedUsernames: Joi.array().items(username).max(500),
    mutedUsernames: Joi.array().items(username).max(500),
  }),
  app: Joi.object({
    language: Joi.string().trim().max(20),
    appearance: Joi.string().valid('system', 'light', 'dark'),
    reducedMotion: Joi.boolean(),
  }),
  notifications: Joi.object({
    likes: Joi.boolean(),
    comments: Joi.boolean(),
    mentions: Joi.boolean(),
    follows: Joi.boolean(),
    messages: Joi.boolean(),
    suggestions: Joi.boolean(),
  }),
  emailNotifications: Joi.object({
    likes: Joi.boolean(),
    comments: Joi.boolean(),
    mentions: Joi.boolean(),
    follows: Joi.boolean(),
    messages: Joi.boolean(),
    suggestions: Joi.boolean(),
  }),
});

module.exports = {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
  createPostSchema,
  addCommentSchema,
  updateProfileSchema,
  updateSettingsSchema,
};
