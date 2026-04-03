import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { io } from 'socket.io-client';
import { getSocketOptions, getSocketUrl } from '../utils/socket';

const AuthContext = createContext(null);

const authFallback = {
  user: null,
  token: null,
  loading: false,
  isAuthenticated: false,
  isPendingVerification: false,
  signup: async () => ({ message: 'Auth provider unavailable' }),
  login: async () => ({ message: 'Auth provider unavailable' }),
  guestLogin: async () => ({ message: 'Auth provider unavailable' }),
  googleLogin: async () => ({ message: 'Auth provider unavailable' }),
  verifyOTP: async () => ({ message: 'Auth provider unavailable' }),
  resendOTP: async () => ({ message: 'Auth provider unavailable' }),
  forgotPassword: async () => ({ message: 'Auth provider unavailable' }),
  resetPassword: async () => ({ message: 'Auth provider unavailable' }),
  logout: () => {},
  updateUser: () => {},
  notifications: [],
  unreadNotifications: 0,
  fetchNotifications: async () => {},
  markNotificationsRead: async () => {},
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || authFallback;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('kyro_token'));
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setNotifications([]);
    setUnreadNotifications(0);
    localStorage.removeItem('kyro_token');
    localStorage.removeItem('kyro_user');
  }, []);

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
  }, [token, logout]);

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

  const guestLogin = async () => {
    const res = await api.post('/auth/guest');
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
    const verifiedUser = res.data.user || (user ? { ...user } : null);
    const verifiedToken = res.data.token || token;

    if (verifiedUser && verifiedToken) {
      saveAuth(verifiedToken, verifiedUser);
    }

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

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem('kyro_user', JSON.stringify(merged));
      return merged;
    });
  };

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get('/users/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadNotifications(res.data.unreadCount || 0);
    } catch {

    }
  }, [token]);

  const markNotificationsRead = async () => {
    await api.put('/users/notifications/read');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotifications(0);
  };

  useEffect(() => {
    if (!token) return;
    fetchNotifications();
  }, [token, fetchNotifications]);

  useEffect(() => {
    if (!user?.username) return undefined;
    const socket = io(getSocketUrl(), getSocketOptions(user.username));

    socket.on('notification:new', (payload) => {
      setUnreadNotifications((prev) => (
        typeof payload.unreadCount === 'number' ? payload.unreadCount : prev + 1
      ));
      setNotifications((prev) => [
        {
          _id: `${Date.now()}-${Math.random()}`,
          type: payload.type,
          fromUsername: payload.fromUsername,
          postId: payload.postId,
          text: payload.text,
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    });

    return () => socket.disconnect();
  }, [user?.username]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isPendingVerification: false,
        signup,
        login,
        guestLogin,
        googleLogin,
        verifyOTP,
        resendOTP,
        forgotPassword,
        resetPassword,
        logout,
        updateUser,
        notifications,
        unreadNotifications,
        fetchNotifications,
        markNotificationsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
