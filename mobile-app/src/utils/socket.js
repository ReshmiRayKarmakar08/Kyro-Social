import { API_BASE_URL } from '../api/axios';

// For mobile, we derive the socket URL from the API base
export const getSocketUrl = () => {
  if (!API_BASE_URL) return 'http://10.0.2.2:5001';
  // Strip /api suffix to get the server root
  return API_BASE_URL.replace(/\/api\/?$/, '');
};

export const getSocketOptions = (username = '') => ({
  transports: ['polling', 'websocket'],
  query: { username: username || '' },
  path: '/socket.io',
  withCredentials: true,
});
