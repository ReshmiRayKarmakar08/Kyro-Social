const express = require('express');
const router = express.Router();

const {
  signup,
  verifyOTP,
  resendOTP,
  login,
  googleAuth,
  guestLogin,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  signupSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validations/schemas');

router.post('/signup', validate(signupSchema), signup);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOTP);
router.post('/resend-otp', validate(resendOtpSchema), resendOTP);
router.post('/login', validate(loginSchema), login);
router.post('/google', validate(googleAuthSchema), googleAuth);
router.post('/guest', guestLogin);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
