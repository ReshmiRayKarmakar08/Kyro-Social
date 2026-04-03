import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TouchableOpacity } from 'react-native';
import api from '../api/axios';
import { useThemeContext } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

const SavedScreen = ({ navigation }) => {
  const { theme } = useThemeContext();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSaved = useCallback(async () => {
    try {
      const res = await api.get('/posts/saved/me');
      setPosts(res.data.posts || res.data || []);
    } catch { /* ignore */ } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchSaved(); }, []);

  const handleLike = async (postId) => {
    setPosts((prev) => prev.map((p) => {
      if (p._id !== postId) return p;
      const liked = (p.likes || []).some((l) => l.username === user?.username);
      return { ...p, likeCount: liked ? Math.max(0, (p.likeCount || 0) - 1) : (p.likeCount || 0) + 1, likes: liked ? (p.likes || []).filter((l) => l.username !== user.username) : [...(p.likes || []), { username: user.username }] };
    }));
    try { await api.put(`/posts/${postId}/like`); } catch { fetchSaved(); }
  };

  const handleUnsave = async (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    try { await api.put(`/posts/${postId}/save`); } catch { fetchSaved(); }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Saved Posts</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <View style={{ paddingHorizontal: 12 }}>
              <PostCard post={{ ...item, isSaved: true }} onLike={handleLike} onSave={handleUnsave} index={index} />
            </View>
          )}
          ListEmptyComponent={<EmptyState icon="bookmark-outline" title="No saved posts" message="Bookmark posts to see them here" />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSaved(); }} tintColor={Colors.primary} colors={[Colors.primary]} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 44, paddingBottom: 12, paddingHorizontal: 8, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
});

export default SavedScreen;
