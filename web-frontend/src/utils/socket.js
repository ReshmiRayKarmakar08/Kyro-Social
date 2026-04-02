export const getSocketUrl = () => {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) return explicit;

  const apiBase = import.meta.env.VITE_API_URL || '/api';
  if (apiBase.startsWith('http')) {
    try {
      const parsed = new URL(apiBase);
      const isLocalApi = ['localhost', '127.0.0.1'].includes(parsed.hostname);
      const isLocalWeb = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      if (isLocalApi && isLocalWeb) {
        return window.location.origin;
      }
      return apiBase.replace(/\/api\/?$/, '');
    } catch {
      return apiBase.replace(/\/api\/?$/, '');
    }
  }

  // For proxied local dev (`/api`), use same-origin so Vite proxy forwards `/socket.io`.
  return window.location.origin;
};

export const getSocketOptions = (username = '') => ({
  transports: ['polling', 'websocket'],
  query: { username: username || '' },
  path: '/socket.io',
  withCredentials: true,
});
