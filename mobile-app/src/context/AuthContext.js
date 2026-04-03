import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { getSocketUrl, getSocketOptions } from '../utils/socket';

const AuthContext = createContext(null);

const authFallback = {
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
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
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const socketRef = useRef(null);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    setNotifications([]);
    setUnreadNotifications(0);
    try {
      await AsyncStorage.multiRemove(['kyro_token', 'kyro_user']);
    } catch (e) {
      // ignore
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // Load persisted token on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('kyro_token');
        if (storedToken) {
          setToken(storedToken);
          const res = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          setUser(res.data.user);
        }
      } catch (err) {
        console.warn('Auth check failed:', err?.message);
        await logout();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [logout]);

  const saveAuth = async (tokenVal, userVal) => {
    setToken(tokenVal);
    setUser(userVal);
    try {
      await AsyncStorage.setItem('kyro_token', tokenVal);
      await AsyncStorage.setItem('kyro_user', JSON.stringify(userVal));
    } catch (e) {
      console.warn('Failed to persist auth:', e);
    }
  };

  const signup = async (data) => {
    const res = await api.post('/auth/signup', data);
    await saveAuth(res.data.token, res.data.user);
    return res.data;
  };

  const login = async (data) => {
    const res = await api.post('/auth/login', data);
    await saveAuth(res.data.token, res.data.user);
    return res.data;
  };

  const guestLogin = async () => {
    const res = await api.post('/auth/guest');
    await saveAuth(res.data.token, res.data.user);
    return res.data;
  };

  const googleLogin = async (data) => {
    const res = await api.post('/auth/google', data);
    await saveAuth(res.data.token, res.data.user);
    return res.data;
  };

  const verifyOTP = async (data) => {
    const res = await api.post('/auth/verify-otp', data);
    const verifiedUser = res.data.user || (user ? { ...user } : null);
    const verifiedToken = res.data.token || token;
    if (verifiedUser && verifiedToken) {
      await saveAuth(verifiedToken, verifiedUser);
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
      AsyncStorage.setItem('kyro_user', JSON.stringify(merged)).catch(() => {});
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
      // ignore
    }
  }, [token]);

  const markNotificationsRead = async () => {
    try {
      await api.put('/users/notifications/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifications(0);
    } catch {
      // ignore
    }
  };

  // Fetch notifications when token is available
  useEffect(() => {
    if (!token) return;
    fetchNotifications();
  }, [token, fetchNotifications]);

  // Socket.IO for real-time notifications
  useEffect(() => {
    if (!user?.username) return;

    const socket = io(getSocketUrl(), getSocketOptions(user.username));
    socketRef.current = socket;

    socket.on('notification:new', (payload) => {
      setUnreadNotifications((prev) =>
        typeof payload.unreadCount === 'number' ? payload.unreadCount : prev + 1,
      );
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

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.username]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
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
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
