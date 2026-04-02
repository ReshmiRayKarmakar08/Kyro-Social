import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';

const FullScreenLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <CircularProgress sx={{ color: '#FF6154' }} />
  </Box>
);

const AppShell = () => {
  const { loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route
      path="/auth"
      element={
        <PublicRoute>
          <AuthPage />
        </PublicRoute>
      }
    />

    <Route path="/" element={<AppShell />}>
      <Route index element={<FeedPage />} />
      <Route path="search" element={<SearchPage />} />
      <Route path="explore" element={<SearchPage />} />
      <Route path="profile/:username" element={<ProfilePage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

import { ThemeContextProvider } from './context/ThemeContext';

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ThemeContextProvider>
        <CssBaseline />
        <AppRoutes />
      </ThemeContextProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
