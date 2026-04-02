import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Skeleton,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import logo from '../assets/logo.png';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const search = async () => {
      if (!query) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}&limit=20`);
        setResults(res.data?.users || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [query]);

  return (
    <Box>
      {query && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Results for "{query}"
        </Typography>
      )}

      {loading ? (
        <Box sx={{ py: 2 }}>
          {[...Array(5)].map((_, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.2 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="40%" height={24} />
                <Skeleton variant="text" width="28%" height={18} />
              </Box>
            </Box>
          ))}
        </Box>
      ) : results.length === 0 && query ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">No users found</Typography>
        </Box>
      ) : (
        <List>
          <AnimatePresence>
            {results.map((u, i) => (
              <motion.div key={u._id || u.username} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <ListItemButton onClick={() => navigate(`/profile/${u.username}`)} sx={{ borderRadius: 2, mb: 0.5 }}>
                  <ListItemAvatar>
                    <Avatar src={u.profilePicture || logo} sx={{ bgcolor: '#FF6154' }}>
                      {u.name?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={u.name} secondary={`@${u.username}`} primaryTypographyProps={{ fontWeight: 700 }} />
                </ListItemButton>
              </motion.div>
            ))}
          </AnimatePresence>
        </List>
      )}
    </Box>
  );
};

export default SearchPage;
