import { useState, useEffect, useMemo } from 'react';
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
  Card,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import logo from '../assets/logo.png';

const extractTags = (text = '') => {
  const matches = String(text).match(/#[a-z0-9_]+/gi) || [];
  return matches.map((item) => item.toLowerCase());
};

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [discoverPosts, setDiscoverPosts] = useState([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState('all');

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

  useEffect(() => {
    const loadDiscover = async () => {
      if (query) return;
      setDiscoverLoading(true);
      try {
        const res = await api.get('/posts?filter=mostliked&type=all&limit=24&page=1');
        setDiscoverPosts(res.data?.posts || []);
      } catch {
        setDiscoverPosts([]);
      } finally {
        setDiscoverLoading(false);
      }
    };
    loadDiscover();
  }, [query]);

  const trendingTopics = useMemo(() => {
    const countMap = new Map();
    discoverPosts.forEach((post) => {
      extractTags(post.content || post.textContent || '').forEach((tag) => {
        countMap.set(tag, (countMap.get(tag) || 0) + 1);
      });
    });
    return [...countMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
  }, [discoverPosts]);

  const visiblePosts = useMemo(() => {
    if (activeTopic === 'all') return discoverPosts;
    return discoverPosts.filter((post) =>
      extractTags(post.content || post.textContent || '').includes(activeTopic)
    );
  }, [discoverPosts, activeTopic]);

  return (
    <Box>
      {query && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Results for "{query}"
        </Typography>
      )}

      {query && loading ? (
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
      ) : query && results.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">No users found</Typography>
        </Box>
      ) : query ? (
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
      ) : (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.7, color: 'text.primary' }}>
            Explore
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Discover trending posts, creators, and topics from your network.
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 1 }}>
            <Chip
              label="#all"
              size="small"
              onClick={() => setActiveTopic('all')}
              sx={{
                bgcolor: activeTopic === 'all' ? '#FF6154' : 'rgba(255,97,84,0.1)',
                color: activeTopic === 'all' ? '#fff' : '#FF6154',
                fontWeight: 700,
              }}
            />
            {trendingTopics.map((topic) => (
              <Chip
                key={topic}
                label={topic}
                size="small"
                onClick={() => setActiveTopic(topic)}
                sx={{
                  bgcolor: activeTopic === topic ? '#FF6154' : 'rgba(255,97,84,0.1)',
                  color: activeTopic === topic ? '#fff' : '#FF6154',
                  fontWeight: 700,
                }}
              />
            ))}
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {discoverLoading ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.2 }}>
              {Array.from({ length: 6 }).map((_, idx) => (
                <Card key={idx} sx={{ p: 1.2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Skeleton variant="circular" width={28} height={28} />
                    <Skeleton variant="text" width="55%" height={20} />
                  </Box>
                  <Skeleton variant="text" width="100%" height={20} />
                  <Skeleton variant="text" width="70%" height={20} />
                  <Skeleton variant="rectangular" width="100%" height={140} sx={{ mt: 1, borderRadius: 1.5 }} />
                </Card>
              ))}
            </Box>
          ) : visiblePosts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 7 }}>
              <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                No explore content yet
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Create or like some posts to make Explore smarter.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.2 }}>
              {visiblePosts.map((post, idx) => (
                <Card
                  key={post._id}
                  component={motion.div}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  sx={{
                    p: 1.2,
                    borderRadius: 2.5,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    bgcolor: 'background.paper',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/profile/${post.authorUsername}`)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar src={post.authorAvatar || logo} sx={{ width: 30, height: 30 }}>
                      {post.authorName?.charAt(0)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }} noWrap>
                        {post.authorName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                        @{post.authorUsername}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ color: 'text.primary', mb: 1, minHeight: 42 }}>
                    {(post.content || post.textContent || '').slice(0, 90)}
                  </Typography>

                  {post.image && (
                    <Box
                      component="img"
                      src={post.image}
                      alt="Explore post"
                      sx={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 1.5, mb: 1 }}
                    />
                  )}

                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    {post.likeCount || 0} likes  ·  {post.commentCount || 0} comments
                  </Typography>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SearchPage;
