const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendOTPEmail, sendWelcomeEmail, sendResetEmail, sendSecurityAlert } = require('../utils/email');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * POST /api/auth/signup
 */
exports.signup = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Validation
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check existing user
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      otp,
      otpExpiry,
      isVerified: false,
      joinedDate: new Date(),
    });

    // Send OTP email
    try {
      await sendOTPEmail(email, name, otp);
    } catch (emailError) {
      console.error('Email send failed:', emailError.message);
    }

    const token = generateToken(user._id, user.username);

    res.status(201).json({
      message: 'Account created! Check your email for the verification code.',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture,
        joinedDate: user.joinedDate,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

/**
 * POST /api/auth/verify-otp
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(email, user.name);
    } catch (emailError) {
      console.error('Welcome email failed:', emailError.message);
    }

    res.json({ message: 'Email verified successfully! Welcome to Kyro Social.' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

/**
 * POST /api/auth/resend-otp
 */
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendOTPEmail(email, user.name, otp);
    } catch (emailError) {
      console.error('Resend OTP email failed:', emailError.message);
    }

    res.json({ message: 'New verification code sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please login with Google.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Record login
    const loginEntry = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
      timestamp: new Date(),
    };

    user.lastLogin = new Date();
    user.loginHistory = [...(user.loginHistory || []).slice(-9), loginEntry]; // Keep last 10
    await user.save();

    // Send security alert for new login
    try {
      await sendSecurityAlert(user.email, user.name, 'new_login', loginEntry);
    } catch (emailError) {
      console.error('Security alert email failed:', emailError.message);
    }

    const token = generateToken(user._id, user.username);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture,
        coverPhoto: user.coverPhoto,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
        joinedDate: user.joinedDate,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * POST /api/auth/google
 */
exports.googleAuth = async (req, res) => {
  try {
    const { googleId, email, name, profilePicture } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ message: 'Google authentication data is incomplete' });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (user) {
      // Existing user - update Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
      }
      if (!user.profilePicture && profilePicture) {
        user.profilePicture = profilePicture;
      }
      user.isVerified = true;
      user.lastLogin = new Date();
      await user.save();
    } else {
      // New user via Google
      const baseUsername = (name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
      user = await User.create({
        name,
        username: baseUsername,
        email: email.toLowerCase(),
        googleId,
        authProvider: 'google',
        profilePicture: profilePicture || '',
        isVerified: true,
        joinedDate: new Date(),
      });

      // Send welcome email
      try {
        await sendWelcomeEmail(email, name);
      } catch (emailError) {
        console.error('Welcome email failed:', emailError.message);
      }
    }

    const token = generateToken(user._id, user.username);

    res.json({
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture,
        coverPhoto: user.coverPhoto,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
        joinedDate: user.joinedDate,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
};

/**
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal whether email exists
      return res.json({ message: 'If an account with that email exists, we sent a reset code.' });
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({ message: 'This account uses Google Sign-In. No password to reset.' });
    }

    const otp = generateOTP();
    user.resetToken = otp;
    user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendResetEmail(email, user.name, otp);
    } catch (emailError) {
      console.error('Reset email failed:', emailError.message);
    }

    res.json({ message: 'If an account with that email exists, we sent a reset code.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+resetToken +resetTokenExpiry');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.resetToken || user.resetToken !== otp) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    if (new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ message: 'Reset code has expired' });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    // Send security alert
    try {
      await sendSecurityAlert(user.email, user.name, 'password_changed');
    } catch (emailError) {
      console.error('Security alert email failed:', emailError.message);
    }

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/auth/me
 */
exports.getMe = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
