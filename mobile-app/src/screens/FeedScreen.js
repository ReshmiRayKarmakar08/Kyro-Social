import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { getSocketUrl, getSocketOptions } from '../utils/socket';
import PostCard from '../components/PostCard';
import FilterChips from '../components/FilterChips';
import EmptyState from '../components/EmptyState';

const PAGE_LIMIT = 10;

const FeedScreen = () => {
  const { user } = useAuth();
  const { theme } = useThemeContext();
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const flatListRef = useRef(null);

  const fetchPosts = useCallback(async (pageNum = 1, filter = activeFilter, type = filterType) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await api.get(`/posts?filter=${filter}&type=${type}&page=${pageNum}&limit=${PAGE_LIMIT}`);
      const newPosts = res.data?.posts || [];

      if (pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setHasMore(Boolean(res.data?.pagination?.hasMore));
    } catch (err) {
      if (pageNum === 1) setPosts([]);
      setHasMore(false);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [activeFilter, filterType]);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, activeFilter, filterType);
  }, [activeFilter, filterType]);

  // Socket.IO for real-time updates
  useEffect(() => {
    if (!user?.username) return;
    const socket = io(getSocketUrl(), getSocketOptions(user.username));

    socket.on('post:liked', ({ postId, likeCount }) => {
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, likeCount } : p)));
    });

    socket.on('post:commented', ({ postId, commentCount, comment }) => {
      setPosts((prev) => prev.map((p) => {
        if (p._id !== postId) return p;
        const exists = (p.comments || []).some((c) => String(c._id) === String(comment?._id));
        return {
          ...p,
          commentCount,
          comments: exists ? p.comments : [...(p.comments || []), comment],
        };
      }));
    });

    return () => socket.disconnect();
  }, [user?.username]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchPosts(1, activeFilter, filterType);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, activeFilter, filterType);
  };

  const handleFilterChange = (filter, type) => {
    setActiveFilter(filter);
    setFilterType(type);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // Optimistic Like
  const handleLike = async (postId) => {
    const currentUser = user || {};
    setPosts((prev) => prev.map((post) => {
      if (post._id !== postId) return post;
      const alreadyLiked = (post.likes || []).some((l) => l.username === currentUser.username);
      return {
        ...post,
        likeCount: alreadyLiked ? Math.max(0, (post.likeCount || 0) - 1) : (post.likeCount || 0) + 1,
        likes: alreadyLiked
          ? (post.likes || []).filter((l) => l.username !== currentUser.username)
          : [...(post.likes || []), { username: currentUser.username }],
      };
    }));
    try {
      await api.put(`/posts/${postId}/like`);
    } catch {
      fetchPosts(1, activeFilter, filterType);
    }
  };

  const handleToggleSave = async (postId) => {
    setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, isSaved: !p.isSaved } : p)));
    try {
      await api.put(`/posts/${postId}/save`);
    } catch {
      fetchPosts(1, activeFilter, filterType);
    }
  };

  const handleDeletePost = async (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    try {
      await api.delete(`/posts/${postId}`);
    } catch {
      fetchPosts(1, activeFilter, filterType);
    }
  };

  const handleComment = (postId) => {
    // TODO: UI
    Alert.alert('Comments', 'Comment drawer coming in next phase');
  };

  const renderPost = useCallback(({ item, index }) => (
    <PostCard
      post={item}
      onLike={handleLike}
      onComment={handleComment}
      onDelete={handleDeletePost}
      onSave={handleToggleSave}
      index={index}
    />
  ), [handleLike, handleDeletePost, handleToggleSave]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  };

  const renderHeader = () => (
    <FilterChips
      activeFilter={activeFilter}
      activeType={filterType}
      onSelect={handleFilterChange}
    />
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <EmptyState
        icon="post-outline"
        title="No posts found"
        message="Be the first to share your journey!"
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
          <Icon name="menu" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerLogo}>
          <View style={styles.logoSquare}>
            <Text style={styles.logoText}>K</Text>
          </View>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Kyro</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.menuButton}>
          <Icon name="bell-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={7}
      />

      {/* FAB: Create Post */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
        activeOpacity={0.85}>
        <Icon name="pencil" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 44,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  menuButton: { padding: 8 },
  headerLogo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoSquare: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  logoText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  listContent: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 80 },
  footer: { paddingVertical: 20 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
});

export default FeedScreen;
