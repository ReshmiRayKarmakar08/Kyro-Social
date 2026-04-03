import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Change this to your backend URL
// - Android emulator: http://10.0.2.2:5001/api
// - Physical device: http://<YOUR_PC_IP>:5001/api
// - Production: https://your-backend.onrender.com/api
export const API_BASE_URL = 'http://10.0.2.2:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach JWT from AsyncStorage
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('kyro_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // AsyncStorage read error — continue without token
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 globally
// Navigation reset is handled in AuthContext
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('kyro_token');
        await AsyncStorage.removeItem('kyro_user');
      } catch (e) {
        // cleanup error — ignore
      }
    }
    return Promise.reject(error);
  },
);

export default api;
