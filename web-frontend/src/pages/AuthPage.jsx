import { useEffect, useState } from 'react';
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
  Google as GoogleIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
};

const inputStyles = {
  mb: 2,
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: '#FAFAFA',
    transition: 'all 0.2s',
    '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
    '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
    '&.Mui-focused fieldset': { borderColor: '#FF6154', borderWidth: 1 },
    '&.Mui-focused': { backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(255, 97, 84, 0.08)' },
  },
  '& .MuiInputLabel-root': { color: '#9CA3AF', fontSize: '0.95rem' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#FF6154' },
};

const AuthPage = () => {
  const { signup, login, guestLogin, googleLogin, verifyOTP, resendOTP, forgotPassword, resetPassword } = useAuth();

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [backendReachable, setBackendReachable] = useState(true);
  const [googleScriptReady, setGoogleScriptReady] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const apiBase = import.meta.env.VITE_API_URL || '/api';

  const normalizeAuthError = (err, fallback) => {
    if (!err?.response) {
      return 'Backend API is offline. Start backend on port 5001 and try again.';
    }
    return err.response?.data?.message || fallback;
  };

  const checkBackendHealth = async () => {
    try {
      const healthUrl = apiBase.endsWith('/api') ? `${apiBase}/health` : `${apiBase}/api/health`;
      const res = await fetch(healthUrl);
      setBackendReachable(res.ok);
    } catch {
      setBackendReachable(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  useEffect(() => {
    if (!googleClientId) return;

    const scriptId = 'google-identity-services';
    const existing = document.getElementById(scriptId);

    if (existing) {
      setGoogleScriptReady(!!window.google?.accounts?.oauth2);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.id = scriptId;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleScriptReady(!!window.google?.accounts?.oauth2);
    script.onerror = () => setError('Failed to load Google sign-in script.');
    document.body.appendChild(script);
  }, [googleClientId]);

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
      await login(loginForm);
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      setError(normalizeAuthError(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await guestLogin();
      setSuccess('Logged in as guest. Redirecting...');
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      setError(normalizeAuthError(err, 'Guest login failed'));
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
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      setError(normalizeAuthError(err, 'Signup failed'));
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
      const res = await forgotPassword(forgotForm.email);
      setResetForm({ ...resetForm, email: forgotForm.email });
      const info = res.devOtp ? ` (Dev OTP: ${res.devOtp})` : '';
      setSuccess(`${res.message || 'Reset code sent to your email'}${info}`);
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

  const handleGooglePopupFallback = async () => {
    if (!window.google?.accounts?.oauth2) {
      setError('Google popup fallback is unavailable. Please refresh and try again.');
      return;
    }

    setGoogleLoading(true);
    setError('');

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          try {
            if (!tokenResponse?.access_token) {
              throw new Error('Google access token not received');
            }

            const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const profile = await profileRes.json();

            await googleLogin({
              googleId: profile.sub,
              email: profile.email,
              name: profile.name,
              profilePicture: profile.picture,
            });

            setSuccess('Google login successful! Redirecting...');
            setTimeout(() => window.location.reload(), 600);
          } catch (err) {
            setError(normalizeAuthError(err, 'Google authentication failed'));
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setGoogleLoading(false);
      setError(normalizeAuthError(err, 'Google popup login failed'));
    }
  };

  const renderGoogleButton = () => (
    <>
      <Divider sx={{ my: 2.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          or
        </Typography>
      </Divider>
      {!googleClientId ? (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Google login is disabled. Missing `VITE_GOOGLE_CLIENT_ID`.
        </Alert>
      ) : !backendReachable ? (
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <Alert severity="error" sx={{ borderRadius: 2, mb: 1.5 }}>
            Backend is not reachable. Current API base: `{apiBase}`
          </Alert>
          <Button size="small" onClick={checkBackendHealth}>
            Retry Backend Check
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 44, gap: 1 }}>
          {googleLoading ? (
            <CircularProgress size={24} />
          ) : (
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGooglePopupFallback}
              startIcon={<GoogleIcon sx={{ fontSize: 20 }} />}
              sx={{
                maxWidth: 360,
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 700,
                py: 1.1,
              }}
            >
              Continue with Google
            </Button>
          )}
        </Box>
      )}
      {googleClientId && !googleScriptReady && !googleLoading && (
        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Loading Google sign-in...
          </Typography>
        </Box>
      )}
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
          background: 'radial-gradient(circle at top left, #1A1A2E 0%, #08080A 100%)',
        }}
      >
        {/* Glow Effects */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '40vw',
            height: '40vw',
            background: 'radial-gradient(circle, rgba(255,97,84,0.15) 0%, rgba(0,0,0,0) 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />

        <Box sx={{ position: 'absolute', top: 40, left: 40, display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 10 }}>
          <Box component="img" src={logo} sx={{ width: 40, height: 40, borderRadius: 2 }} />
          <Typography variant="h6" fontWeight={800} color="white">
            Kyro Social
          </Typography>
        </Box>

        {/* Marketing Content */}
        <Box sx={{ position: 'relative', zIndex: 5, width: '100%', maxWidth: 540 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <Typography variant="h2" fontWeight={800} color="white" sx={{ mb: 3, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
              Connect with your <span style={{ color: '#FF6154' }}>developer</span> network.
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.65)', mb: 6, fontSize: '1.25rem', lineHeight: 1.6, maxWidth: 440 }}>
              The premium social platform exclusively designed for creators, builders, and software engineers to share their journey.
            </Typography>
          </motion.div>
          
          {/* Elegant Abstract UI Representation */}
          <Box
            sx={{
              position: 'relative',
              height: 320,
              width: '100%',
              perspective: '1000px',
            }}
          >
            {[
              { top: 0, left: 40, scale: 0.9, opacity: 0.4, blur: 4, delay: 0.3, img: 'https://i.pravatar.cc/150?img=68' },
              { top: 40, left: 0, scale: 0.95, opacity: 0.7, blur: 2, delay: 0.15, img: 'https://i.pravatar.cc/150?img=47' },
              { top: 80, left: -40, scale: 1, opacity: 1, blur: 0, delay: 0, img: 'https://i.pravatar.cc/150?img=33' },
            ].map((card, i) => (
              <Box
                key={i}
                component={motion.div}
                initial={{ opacity: 0, x: 100, y: card.top }}
                animate={{ opacity: card.opacity, x: card.left, y: card.top }}
                transition={{ duration: 0.8, delay: 0.6 + card.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
                sx={{
                  position: 'absolute',
                  width: '90%',
                  height: 156,
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: `blur(${card.blur}px)`,
                  WebkitBackdropFilter: `blur(${card.blur}px)`,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 4,
                  transform: `scale(${card.scale})`,
                  transformOrigin: 'left',
                  boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
                  p: 3,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2.5,
                }}
              >
                <Box component="img" src={card.img} sx={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1, mt: 0.5 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Box sx={{ width: '35%', height: 12, borderRadius: 2, background: 'rgba(255,255,255,0.7)' }} />
                    <Box sx={{ width: '20%', height: 12, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }} />
                  </Box>
                  <Box sx={{ width: '85%', height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
                  <Box sx={{ width: '60%', height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
                  <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                    <Box sx={{ width: 44, height: 24, borderRadius: 4, background: 'rgba(255,97,84,0.2)', border: '1px solid rgba(255,97,84,0.5)' }} />
                    <Box sx={{ width: 44, height: 24, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
                  </Box>
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
          bgcolor: '#F3F4F6', // Soft gray background to make the card pop
          display: 'flex',
          justifyContent: 'center',
          alignItems: { xs: 'flex-start', md: 'center' },
          p: { xs: 2, sm: 4, md: 4 },
          pt: { xs: 6, md: 4 },
          borderLeft: { md: '1px solid rgba(0,0,0,0.05)' },
          position: 'relative',
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={view}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            style={{ 
              width: '100%', 
              maxWidth: 460, 
              display: 'flex', 
              justifyContent: 'center' 
            }}
          >
            <Card
              elevation={0}
              sx={{
                width: '100%',
                borderRadius: { xs: '32px', md: '48px' },
                bgcolor: '#FFFFFF',
                p: { xs: 3.5, md: 5 },
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Logo inside card */}
              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-start' }}>
                <Box 
                  component="img" 
                  src={logo} 
                  sx={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(255,97,84,0.15)' 
                  }} 
                />
              </Box>

              <Box sx={{ mb: 4.5, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={900} sx={{ color: '#1A1A2E', letterSpacing: '-0.04em', mb: 1 }}>
                  {view === 'login' && 'Welcome back'}
                  {view === 'signup' && 'Create Account'}
                  {view === 'otp' && 'Verify Email'}
                  {view === 'forgot' && 'Reset Password'}
                  {view === 'reset' && 'New Password'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.95rem', opacity: 0.8 }}>
                  {view === 'login' && 'Sign in to continue to Kyro Social'}
                  {view === 'signup' && 'Join the community of builders'}
                  {view === 'otp' && 'Enter the 6-digit code sent to your mail'}
                  {view === 'forgot' && 'Provide your email to receive a code'}
                  {view === 'reset' && 'Complete your account recovery'}
                </Typography>
              </Box>

              {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '16px', fontSize: '0.85rem' }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '16px', fontSize: '0.85rem' }}>{success}</Alert>}

              {/* LOGIN */}
              {view === 'login' && (
                <Box component="form" onSubmit={handleLogin}>
                  <TextField
                    fullWidth label="Email *" type="email" required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={inputStyles}
                  />
                  <TextField
                    fullWidth label="Password *" required
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                            {showPassword ? <VisibilityOffRounded fontSize="small" /> : <VisibilityRounded fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ ...inputStyles, mb: 1 }}
                  />
                  <Box sx={{ textAlign: 'right', mb: 3.5 }}>
                    <Button
                      size="small"
                      onClick={() => changeView('forgot')}
                      sx={{ 
                        color: '#FF6154', 
                        fontWeight: 700, 
                        fontSize: '0.85rem', 
                        textTransform: 'none',
                        p: 0, 
                        '&:hover': { background: 'transparent', opacity: 0.8 } 
                      }}
                    >
                      Forgot password?
                    </Button>
                  </Box>
                  <Button
                    fullWidth variant="contained" size="large" type="submit" disabled={loading}
                    sx={{ 
                      py: 1.6, 
                      fontWeight: 800, 
                      borderRadius: '16px',
                      fontSize: '1rem',
                      textTransform: 'none',
                      boxShadow: '0 10px 20px rgba(255, 97, 84, 0.2)'
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                  </Button>
                  <Button
                    fullWidth
                    variant="text"
                    onClick={handleGuestLogin}
                    disabled={loading}
                    sx={{ mt: 1, textTransform: 'none', fontWeight: 700, color: '#6B7280' }}
                  >
                    Continue as Guest
                  </Button>
                  {renderGoogleButton()}
                  <Box sx={{ textAlign: 'center', mt: 4, pt: 1 }}>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 600 }}>
                      Don't have an account?{' '}
                      <Button
                        onClick={() => changeView('signup')}
                        sx={{ color: '#FF6154', fontWeight: 800, p: 0, textTransform: 'none', minWidth: 'auto' }}
                      >
                        Sign Up
                      </Button>
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* SIGNUP */}
              {view === 'signup' && (
                <Box component="form" onSubmit={handleSignup}>
                  <TextField
                    fullWidth label="Full Name *" required
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={inputStyles}
                  />
                  <TextField
                    fullWidth label="Username *" required
                    value={signupForm.username}
                    onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value.toLowerCase() })}
                    InputLabelProps={{ shrink: true }}
                    sx={inputStyles}
                  />
                  <TextField
                    fullWidth label="Email *" type="email" required
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={inputStyles}
                  />
                  <TextField
                    fullWidth label="Password *" required
                    type={showPassword ? 'text' : 'password'}
                    value={signupForm.password}
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    sx={{ ...inputStyles, mb: 3.5 }}
                  />
                  <Button
                    fullWidth variant="contained" size="large" type="submit" disabled={loading}
                    sx={{ py: 1.6, fontWeight: 800, borderRadius: '16px', textTransform: 'none' }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                  </Button>
                  {renderGoogleButton()}
                  <Box sx={{ textAlign: 'center', mt: 4, pt: 1 }}>
                    <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 600 }}>
                      Already have an account?{' '}
                      <Button
                        onClick={() => changeView('login', -1)}
                        sx={{ color: '#FF6154', fontWeight: 800, p: 0, textTransform: 'none', minWidth: 'auto' }}
                      >
                        Sign In
                      </Button>
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* OTP, FORGOT, RESET */}
              {(view === 'otp' || view === 'forgot' || view === 'reset') && (
                <Box>
                  {view === 'otp' && (
                    <Box component="form" onSubmit={handleVerifyOTP}>
                      <TextField
                        fullWidth label="Verification Code *" required
                        value={otpForm.otp}
                        InputLabelProps={{ shrink: true }}
                        onChange={(e) => setOtpForm({ ...otpForm, otp: e.target.value.replace(/\D/g, '') })}
                        inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: 8, fontWeight: 800, fontSize: '1.2rem' } }}
                        sx={inputStyles}
                      />
                      <Button fullWidth variant="contained" size="large" type="submit" sx={{ py: 1.6, borderRadius: '16px' }}>
                        Verify email
                      </Button>
                    </Box>
                  )}
                  {view === 'forgot' && (
                    <Box component="form" onSubmit={handleForgotPassword}>
                      <TextField
                        fullWidth label="Email Address *" required
                        value={forgotForm.email}
                        InputLabelProps={{ shrink: true }}
                        onChange={(e) => setForgotForm({ email: e.target.value })}
                        sx={inputStyles}
                      />
                      <Button fullWidth variant="contained" size="large" type="submit" sx={{ py: 1.6, borderRadius: '16px' }}>
                        Send reset code
                      </Button>
                      <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Button onClick={() => changeView('login', -1)} sx={{ color: '#FF6154', fontWeight: 700 }}>Back to Sign In</Button>
                      </Box>
                    </Box>
                  )}
                  {view === 'reset' && (
                    <Box component="form" onSubmit={handleResetPassword}>
                      <TextField
                        fullWidth label="OTP Code *" required
                        value={resetForm.otp}
                        InputLabelProps={{ shrink: true }}
                        onChange={(e) => setResetForm({ ...resetForm, otp: e.target.value })}
                        sx={inputStyles}
                      />
                      <TextField
                        fullWidth label="New Password *" required
                        type="password"
                        value={resetForm.newPassword}
                        InputLabelProps={{ shrink: true }}
                        onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                        sx={inputStyles}
                      />
                      <Button fullWidth variant="contained" size="large" type="submit" sx={{ py: 1.6, borderRadius: '16px' }}>
                        Update password
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </Box>

    </Box>
  );
};

export default AuthPage;
