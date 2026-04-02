import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('kyro_token'));
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          console.error('Auth check failed:', err);
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const saveAuth = (tokenVal, userVal) => {
    setToken(tokenVal);
    setUser(userVal);
    localStorage.setItem('kyro_token', tokenVal);
    localStorage.setItem('kyro_user', JSON.stringify(userVal));
  };

  const signup = async (data) => {
    const res = await api.post('/auth/signup', data);
    saveAuth(res.data.token, res.data.user);
    return res.data;
  };

  const login = async (data) => {
    const res = await api.post('/auth/login', data);
    saveAuth(res.data.token, res.data.user);
    return res.data;
  };

  const googleLogin = async (data) => {
    const res = await api.post('/auth/google', data);
    saveAuth(res.data.token, res.data.user);
    return res.data;
  };

  const verifyOTP = async (data) => {
    const res = await api.post('/auth/verify-otp', data);
    if (user) setUser({ ...user, isVerified: true });
    return res.data;
  };

  const resendOTP = async (email) => {
    const res = await api.post('/auth/resend-otp', { email });
    return res.data;
  };

  const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (data) => {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('kyro_token');
    localStorage.removeItem('kyro_user');
  }, []);

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
    localStorage.setItem('kyro_user', JSON.stringify({ ...user, ...updatedData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        signup,
        login,
        googleLogin,
        verifyOTP,
        resendOTP,
        forgotPassword,
        resetPassword,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
