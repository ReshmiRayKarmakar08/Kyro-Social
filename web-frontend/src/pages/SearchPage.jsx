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
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import { SearchRounded } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import logo from '../assets/logo.png';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) return;
      setLoading(true);
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
        setResults(res.data.users);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };
    search();
  }, [query]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <Box>
      <TextField
        fullWidth
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onKeyDown={handleSearch}
        placeholder="Search users..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRounded sx={{ color: '#9CA3AF' }} />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
        id="search-page-input"
      />

      {query && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Results for "{query}"
        </Typography>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#FF6154' }} />
        </Box>
      ) : results.length === 0 && query ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">No users found</Typography>
        </Box>
      ) : (
        <List>
          <AnimatePresence>
            {results.map((u, i) => (
              <motion.div
                key={u._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ListItemButton
                  onClick={() => navigate(`/profile/${u.username}`)}
                  sx={{ borderRadius: 3, mb: 0.5 }}
                >
                  <ListItemAvatar>
                    <Avatar src={u.profilePicture || logo} sx={{ bgcolor: '#FF6154' }}>
                      {u.name?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={u.name}
                    secondary={`@${u.username}`}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
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
