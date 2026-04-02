import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  VisibilityRounded,
  VisibilityOffRounded,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
};

const AuthPage = () => {
  const { signup, login, googleLogin, verifyOTP, resendOTP, forgotPassword, resetPassword } = useAuth();

  // View: 'login' | 'signup' | 'otp' | 'forgot' | 'reset'
  const [view, setView] = useState('login');
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', username: '', email: '', password: '' });
  const [otpForm, setOtpForm] = useState({ email: '', otp: '' });
  const [forgotForm, setForgotForm] = useState({ email: '' });
  const [resetForm, setResetForm] = useState({ email: '', otp: '', newPassword: '' });

  const changeView = (newView, dir = 1) => {
    setDirection(dir);
    setError('');
    setSuccess('');
    setView(newView);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(loginForm);
      if (res.user && !res.user.isVerified) {
        setOtpForm({ ...otpForm, email: loginForm.email });
        changeView('otp');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signup(signupForm);
      setOtpForm({ ...otpForm, email: signupForm.email });
      changeView('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyOTP(otpForm);
      setSuccess('Email verified! Redirecting...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOTP(otpForm.email);
      setSuccess('New code sent!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await forgotPassword(forgotForm.email);
      setResetForm({ ...resetForm, email: forgotForm.email });
      setSuccess('Reset code sent to your email');
      changeView('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await resetPassword(resetForm);
      setSuccess('Password reset successful!');
      setTimeout(() => changeView('login', -1), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const renderGoogleButton = () => (
    <>
      <Divider sx={{ my: 2.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          or
        </Typography>
      </Divider>
      <Button
        fullWidth
        variant="outlined"
        size="large"
        onClick={() => googleLogin({ googleId: 'demo', email: 'demo@gmail.com', name: 'Demo User' })}
        sx={{
          borderColor: 'rgba(0,0,0,0.12)',
          color: '#374151',
          borderRadius: 50,
          py: 1.2,
          fontWeight: 600,
          textTransform: 'none',
          '&:hover': { borderColor: '#FF6154', backgroundColor: 'rgba(255,97,84,0.04)' },
        }}
        id="google-login-button"
      >
        <Box
          component="img"
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          sx={{ width: 20, height: 20, mr: 1.5 }}
        />
        Continue with Google
      </Button>
    </>
  );

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#0A0A0A' }}>
      {/* LEFT SIDE: Marketing Hero (> 900px Desktop) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          width: '60%',
          position: 'relative',
          overflow: 'hidden',
          p: 6,
          justifyContent: 'center',
          alignItems: 'center',
          background: 'radial-gradient(circle at top left, #1A1A2E 0%, #0A0A0A 100%)',
        }}
      >
        <Box sx={{ position: 'absolute', top: 40, left: 40, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box component="img" src={logo} sx={{ width: 40, height: 40, borderRadius: 2 }} />
          <Typography variant="h6" fontWeight={800} color="white">
            Kyro Social
          </Typography>
        </Box>

        {/* Marketing Mockup */}
        <Box sx={{ textAlign: 'center', maxWidth: 480, mt: -4 }}>
          <Typography variant="h3" fontWeight={800} color="white" sx={{ mb: 2, lineHeight: 1.1 }}>
            See everyday moments from your <span style={{ color: '#FF6154' }}>close friends</span>.
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', mb: 6, fontSize: '1.1rem' }}>
            A premium network for developers, designers, and creators to share their journey.
          </Typography>
          
          {/* Framer Motion CSS Mockup */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              perspective: '1000px',
            }}
          >
            {[
              { color: '#FF6154', delay: 0.4 },
              { color: '#E8451C', delay: 0.6 },
            ].map((card, i) => (
              <Box
                key={i}
                component={motion.div}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: card.delay, ease: 'easeInOut' }}
                sx={{
                  width: 180,
                  height: 280,
                  bgcolor: '#1a1a2e',
                  borderRadius: 4,
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 1.5,
                  transform: i === 0 ? 'rotate(-5deg) translateY(20px)' : 'rotate(5deg)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                  <Box sx={{ width: 60, height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.1)' }} />
                </Box>
                <Box sx={{ flex: 1, borderRadius: 2, bgcolor: card.color, mb: 1.5 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)' }} />
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* RIGHT SIDE: Auth Form Container */}
      <Box
        sx={{
          width: { xs: '100%', md: '40%' },
          bgcolor: '#FFFFFF',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 2, sm: 4, md: 6 },
          borderLeft: { md: '1px solid rgba(0,0,0,0.08)' },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 380 }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3 }}>
            <Box component="img" src={logo} sx={{ width: 48, height: 48, borderRadius: 2 }} />
          </Box>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={view}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <Card
                elevation={0}
                sx={{
                  bgcolor: 'transparent',
                  overflow: 'visible',
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" fontWeight={800} sx={{ color: '#1A1A2E' }}>
                      {view === 'login' && 'Sign in'}
                      {view === 'signup' && 'Create account'}
                      {view === 'otp' && 'Verify email'}
                      {view === 'forgot' && 'Forgot password'}
                      {view === 'reset' && 'Reset password'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {view === 'login' && 'Welcome back to Kyro Social'}
                      {view === 'signup' && 'Join your friends today'}
                      {view === 'otp' && 'Enter the 6-digit code sent to your email'}
                      {view === 'forgot' && 'Enter your email to receive a reset code'}
                      {view === 'reset' && 'Enter the code and your new password'}
                    </Typography>
                  </Box>

                  {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
                  {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>{success}</Alert>}

                  {/* LOGIN */}
                  {view === 'login' && (
                    <Box component="form" onSubmit={handleLogin}>
                      <TextField
                        fullWidth label="Email" type="email" required
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        sx={{ mb: 2 }}
                        id="login-email"
                      />
                      <TextField
                        fullWidth label="Password" required
                        type={showPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                {showPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 1 }}
                        id="login-password"
                      />
                      <Box sx={{ textAlign: 'right', mb: 2 }}>
                        <Button
                          size="small"
                          onClick={() => changeView('forgot')}
                          sx={{ color: '#FF6154', fontWeight: 600, p: 0, minWidth: 'auto' }}
                        >
                          Forgot password?
                        </Button>
                      </Box>
                      <Button
                        fullWidth variant="contained" size="large" type="submit" disabled={loading}
                        sx={{ py: 1.2, fontWeight: 700 }}
                        id="login-submit"
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Log in'}
                      </Button>
                      {renderGoogleButton()}
                      <Box sx={{ textAlign: 'center', mt: 3, borderTop: '1px solid rgba(0,0,0,0.06)', pt: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Don't have an account?{' '}
                          <Button
                            onClick={() => changeView('signup')}
                            sx={{ color: '#FF6154', fontWeight: 700, p: 0, minWidth: 'auto' }}
                          >
                            Sign up
                          </Button>
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* SIGNUP */}
                  {view === 'signup' && (
                    <Box component="form" onSubmit={handleSignup}>
                      <TextField
                        fullWidth label="Full Name" required
                        value={signupForm.name}
                        onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                        sx={{ mb: 2 }}
                        id="signup-name"
                      />
                      <TextField
                        fullWidth label="Username" required
                        value={signupForm.username}
                        onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                        helperText="Letters, numbers, and underscores only"
                        sx={{ mb: 2 }}
                        id="signup-username"
                      />
                      <TextField
                        fullWidth label="Email" type="email" required
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        sx={{ mb: 2 }}
                        id="signup-email"
                      />
                      <TextField
                        fullWidth label="Password" required
                        type={showPassword ? 'text' : 'password'}
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        helperText="At least 6 characters"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                {showPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 2.5 }}
                        id="signup-password"
                      />
                      <Button
                        fullWidth variant="contained" size="large" type="submit" disabled={loading}
                        sx={{ py: 1.2, fontWeight: 700 }}
                        id="signup-submit"
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                      </Button>
                      {renderGoogleButton()}
                      <Box sx={{ textAlign: 'center', mt: 3, borderTop: '1px solid rgba(0,0,0,0.06)', pt: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Already have an account?{' '}
                          <Button
                            onClick={() => changeView('login', -1)}
                            sx={{ color: '#FF6154', fontWeight: 700, p: 0, minWidth: 'auto' }}
                          >
                            Sign in
                          </Button>
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* OTP */}
                  {view === 'otp' && (
                    <Box component="form" onSubmit={handleVerifyOTP}>
                      <TextField
                        fullWidth label="Verification Code" required
                        value={otpForm.otp}
                        onChange={(e) => setOtpForm({ ...otpForm, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        placeholder="Enter 6-digit code"
                        inputProps={{ maxLength: 6, style: { letterSpacing: 8, textAlign: 'center', fontSize: '1.3rem', fontWeight: 700 } }}
                        sx={{ mb: 2.5 }}
                        id="otp-input"
                      />
                      <Button
                        fullWidth variant="contained" size="large" type="submit" disabled={loading || otpForm.otp.length !== 6}
                        sx={{ py: 1.2, fontWeight: 700 }}
                        id="otp-submit"
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify'}
                      </Button>
                      <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Button onClick={handleResendOTP} sx={{ color: '#FF6154', fontWeight: 600 }}>
                          Resend Code
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* FORGOT PASSWORD */}
                  {view === 'forgot' && (
                    <Box component="form" onSubmit={handleForgotPassword}>
                      <TextField
                        fullWidth label="Email" type="email" required
                        value={forgotForm.email}
                        onChange={(e) => setForgotForm({ email: e.target.value })}
                        sx={{ mb: 2.5 }}
                        id="forgot-email"
                      />
                      <Button
                        fullWidth variant="contained" size="large" type="submit" disabled={loading}
                        sx={{ py: 1.2, fontWeight: 700 }}
                        id="forgot-submit"
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Code'}
                      </Button>
                      <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Button onClick={() => changeView('login', -1)} sx={{ color: '#6B7280' }}>
                          Back to Sign In
                        </Button>
                      </Box>
                    </Box>
                  )}

                  {/* RESET PASSWORD */}
                  {view === 'reset' && (
                    <Box component="form" onSubmit={handleResetPassword}>
                      <TextField
                        fullWidth label="Reset Code" required
                        value={resetForm.otp}
                        onChange={(e) => setResetForm({ ...resetForm, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        inputProps={{ maxLength: 6, style: { letterSpacing: 8, textAlign: 'center', fontSize: '1.2rem', fontWeight: 700 } }}
                        sx={{ mb: 2 }}
                        id="reset-otp"
                      />
                      <TextField
                        fullWidth label="New Password" required
                        type={showPassword ? 'text' : 'password'}
                        value={resetForm.newPassword}
                        onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                        helperText="At least 6 characters"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                {showPassword ? <VisibilityOffRounded /> : <VisibilityRounded />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 2.5 }}
                        id="reset-password"
                      />
                      <Button
                        fullWidth variant="contained" size="large" type="submit" disabled={loading}
                        sx={{ py: 1.2, fontWeight: 700 }}
                        id="reset-submit"
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
};

export default AuthPage;
