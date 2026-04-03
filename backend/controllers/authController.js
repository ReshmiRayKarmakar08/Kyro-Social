const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const {
  sendOTPEmail,
  sendResetEmail,
  sendWelcomeEmail,
  sendLoginAlertEmail,
  sendPasswordChangedEmail,
} = require('../utils/email');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

const setOtpForUser = (user) => {
  user.otp = generateOTP();
  user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
};

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
  joinedDate: user.joinedDate || user.createdAt,
  createdAt: user.createdAt,
});

const buildUniqueUsername = async (name = 'user') => {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
  let candidate = base;
  let suffix = 0;

  while (await User.exists({ username: candidate })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }

  return candidate;
};

exports.signup = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    return res.status(409).json({
      message: existingUser.email === email ? 'Email already in use' : 'Username already in use',
    });
  }

  // Professional flow: no OTP at signup.
  const user = await User.create({
    name,
    username,
    email,
    password,
    isVerified: true,
  });

  try {
    await sendWelcomeEmail(user.email, user.name);
  } catch (error) {
    // Non-blocking
  }

  res.status(201).json({
    message: 'Signup successful',
    token: generateToken(user._id, user.username),
    user: sanitizeUser(user),
  });
});

exports.verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select('+otp +otpExpiry');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!user.otp || user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  res.status(200).json({
    message: 'OTP verified successfully',
    token: generateToken(user._id, user.username),
    user: sanitizeUser(user),
  });
});

exports.resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select('+otp +otpExpiry');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  setOtpForUser(user);
  await user.save();

  let mailSent = false;
  try {
    await sendOTPEmail(user.email, user.name, user.otp);
    mailSent = true;
  } catch (error) {
    mailSent = false;
  }

  const payload = {
    message: mailSent ? 'A new OTP has been sent' : 'OTP generated. Email could not be delivered.',
    mailSent,
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.devOtp = user.otp;
  }

  res.status(200).json(payload);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const now = new Date();
  const lastSent = user.mailMeta?.lastLoginMailAt ? new Date(user.mailMeta.lastLoginMailAt) : null;
  const shouldSendLoginMail = !lastSent || (now.getTime() - lastSent.getTime()) > 30 * 60 * 1000;

  if (shouldSendLoginMail && user.email) {
    try {
      await sendLoginAlertEmail(user.email, user.name, {
        device: req.headers['user-agent'] || 'Unknown browser',
        ip: req.headers['x-forwarded-for'] || req.ip || 'Unknown IP',
        when: now,
      });
      user.mailMeta = {
        ...(user.mailMeta?.toObject?.() || user.mailMeta || {}),
        lastLoginMailAt: now,
      };
      await user.save();
    } catch {
      // non-blocking
    }
  }

  res.status(200).json({
    message: 'Login successful',
    token: generateToken(user._id, user.username),
    user: sanitizeUser(user),
  });
});

exports.guestLogin = asyncHandler(async (req, res) => {
  const guestEmail = 'guest@kyrosocial.app';
  let user = await User.findOne({ email: guestEmail });

  if (!user) {
    user = await User.create({
      name: 'Guest User',
      username: 'guest_user',
      email: guestEmail,
      password: `Guest@${Date.now()}`,
      bio: 'Browsing Kyro as a guest account.',
      isVerified: true,
    });
  }

  res.status(200).json({
    message: 'Guest login successful',
    token: generateToken(user._id, user.username),
    user: sanitizeUser(user),
  });
});

exports.googleAuth = asyncHandler(async (req, res) => {
  let email;
  let name = 'Google User';
  let picture = '';
  let googleSub;

  if (req.body.idToken) {
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    email = payload.email?.toLowerCase();
    name = payload.name || name;
    picture = payload.picture || '';
    googleSub = payload.sub;
  } else {
    email = req.body.email?.toLowerCase();
    name = req.body.name || name;
    googleSub = req.body.googleId || `legacy-${Date.now()}`;
  }

  if (!email) {
    return res.status(400).json({ message: 'Google account email not available' });
  }

  let user = await User.findOne({ email });
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = await User.create({
      name: name || 'Google User',
      username: await buildUniqueUsername(name || 'user'),
      email,
      googleId: googleSub,
      profilePicture: picture || '',
      isVerified: true,
    });
  } else {
    user.googleId = user.googleId || googleSub;
    user.profilePicture = user.profilePicture || picture || '';
    user.isVerified = true;
    await user.save();
  }

  if (isNewUser) {
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (error) {

    }
  } else {
    const now = new Date();
    const lastSent = user.mailMeta?.lastLoginMailAt ? new Date(user.mailMeta.lastLoginMailAt) : null;
    const shouldSendLoginMail = !lastSent || (now.getTime() - lastSent.getTime()) > 30 * 60 * 1000;
    if (shouldSendLoginMail && user.email) {
      try {
        await sendLoginAlertEmail(user.email, user.name, {
          device: req.headers['user-agent'] || 'Unknown browser',
          ip: req.headers['x-forwarded-for'] || req.ip || 'Unknown IP',
          when: now,
        });
        user.mailMeta = {
          ...(user.mailMeta?.toObject?.() || user.mailMeta || {}),
          lastLoginMailAt: now,
        };
        await user.save();
      } catch {
        // non-blocking
      }
    }
  }

  res.status(200).json({
    message: 'Google authentication successful',
    token: generateToken(user._id, user.username),
    user: sanitizeUser(user),
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select('+otp +otpExpiry');
  if (!user) {
    return res.status(200).json({ message: 'If the account exists, a reset OTP has been sent', mailSent: false });
  }

  setOtpForUser(user);
  await user.save();

  let mailSent = false;
  try {
    await sendResetEmail(user.email, user.name, user.otp);
    mailSent = true;
  } catch (error) {
    mailSent = false;
  }

  const payload = {
    message: mailSent
      ? 'Reset OTP sent to your email'
      : 'Reset OTP generated but email delivery failed. Configure SMTP or Apps Script.',
    mailSent,
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.devOtp = user.otp;
  }

  res.status(200).json(payload);
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email }).select('+otp +otpExpiry +password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!user.otp || user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  user.password = newPassword;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  if (user.email) {
    try {
      await sendPasswordChangedEmail(user.email, user.name);
    } catch {
      // non-blocking
    }
  }

  res.status(200).json({ message: 'Password reset successful' });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ user: sanitizeUser(req.user) });
});
