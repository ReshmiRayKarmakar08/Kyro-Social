import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet,
  ScrollView, RefreshControl, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { formatJoinedDate } from '../utils/formatDate';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProfileScreen = ({ route, navigation }) => {
  const { user: currentUser, updateUser } = useAuth();
  const { theme } = useThemeContext();
  const username = route?.params?.username || currentUser?.username;
  const isOwnProfile = currentUser?.username === username;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const [profileRes, postsRes] = await Promise.all([
        api.get(`/users/${username}`),
        api.get(`/posts/user/${username}`),
      ]);
      setProfile(profileRes.data.user || profileRes.data);
      setPosts(postsRes.data.posts || []);
      setIsFollowing(
        (profileRes.data.user || profileRes.data).followers?.some(
          (f) => (f.username || f) === currentUser?.username,
        ) || false,
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to load profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [username, currentUser?.username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollow = async () => {
    setIsFollowing((prev) => !prev);
    try {
      await api.put(`/users/follow/${username}`);
      fetchProfile();
    } catch {
      setIsFollowing((prev) => !prev);
    }
  };

  const handleLike = async (postId) => {
    setPosts((prev) => prev.map((post) => {
      if (post._id !== postId) return post;
      const alreadyLiked = (post.likes || []).some((l) => l.username === currentUser?.username);
      return {
        ...post,
        likeCount: alreadyLiked ? Math.max(0, (post.likeCount || 0) - 1) : (post.likeCount || 0) + 1,
        likes: alreadyLiked
          ? (post.likes || []).filter((l) => l.username !== currentUser.username)
          : [...(post.likes || []), { username: currentUser.username }],
      };
    }));
    try { await api.put(`/posts/${postId}/like`); } catch { fetchProfile(); }
  };

  const handleDeletePost = async (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    try { await api.delete(`/posts/${postId}`); } catch { fetchProfile(); }
  };

  const handleSave = async (postId) => {
    setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, isSaved: !p.isSaved } : p)));
    try { await api.put(`/posts/${postId}/save`); } catch { fetchProfile(); }
  };

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!profile) return null;

  const renderHeader = () => (
    <View>
      {/* Cover Photo */}
      <View
        style={[
          styles.coverPhoto,
          profile.coverPhoto
            ? undefined
            : { backgroundColor: Colors.primary },
        ]}>
        {profile.coverPhoto && (
          <Image source={{ uri: profile.coverPhoto }} style={styles.coverImage} />
        )}
        {/* Back button for non-own profiles */}
        {!isOwnProfile && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Info Card */}
      <View style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
        {/* Avatar */}
        <View style={styles.avatarRow}>
          <View style={[styles.avatarBorder, { borderColor: theme.colors.surface }]}>
            {profile.profilePicture ? (
              <Image source={{ uri: profile.profilePicture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: Colors.primary }]}>
                <Text style={styles.avatarFallbackText}>{(profile.name || 'K')[0].toUpperCase()}</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionButtons}>
            {isOwnProfile ? (
              <TouchableOpacity style={[styles.outlineButton, { borderColor: theme.colors.divider }]}>
                <Icon name="pencil-outline" size={16} color={theme.colors.text} />
                <Text style={[styles.outlineButtonText, { color: theme.colors.text }]}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.outlineButton, isFollowing ? { borderColor: theme.colors.divider } : { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                  onPress={handleFollow}>
                  <Text style={[styles.outlineButtonText, { color: isFollowing ? theme.colors.text : '#FFF' }]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconBtn, { borderColor: theme.colors.divider }]}
                  onPress={() => {
                    if (!isFollowing) {
                      Alert.alert('Follow Required', 'Follow this account first to start messaging.');
                    } else {
                      navigation.navigate('Chat', { username: profile.username });
                    }
                  }}>
                  <Icon name="send" size={16} color={isFollowing ? Colors.primary : theme.colors.textCaption} style={{ transform: [{ rotate: '-30deg' }] }} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Name / Username */}
        <Text style={[styles.profileName, { color: theme.colors.text }]}>{profile.name}</Text>
        <Text style={[styles.profileUsername, { color: theme.colors.textSecondary }]}>@{profile.username}</Text>

        {!!profile.headline && (
          <Text style={[styles.headline, { color: theme.colors.text }]}>{profile.headline}</Text>
        )}
        {!!profile.bio && (
          <Text style={[styles.bio, { color: theme.colors.textSecondary }]}>{profile.bio}</Text>
        )}

        {/* Meta */}
        <View style={styles.metaRow}>
          {!!profile.location && (
            <View style={styles.metaItem}>
              <Icon name="map-marker-outline" size={14} color={theme.colors.textCaption} />
              <Text style={[styles.metaText, { color: theme.colors.textCaption }]}>{profile.location}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Icon name="calendar-outline" size={14} color={theme.colors.textCaption} />
            <Text style={[styles.metaText, { color: theme.colors.textCaption }]}>{formatJoinedDate(profile.createdAt)}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: theme.colors.text }]}>{posts.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: theme.colors.text }]}>{profile.followersCount || profile.followers?.length || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: theme.colors.text }]}>{profile.followingCount || profile.following?.length || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Following</Text>
          </View>
        </View>
      </View>

      {/* Posts Header */}
      <View style={[styles.sectionHeader, { borderBottomColor: theme.colors.divider }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Posts</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <View style={{ paddingHorizontal: 12 }}>
            <PostCard post={item} onLike={handleLike} onDelete={handleDeletePost} onSave={handleSave} index={index} />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<EmptyState icon="post-outline" title="No posts yet" message={isOwnProfile ? 'Share your first post!' : 'This user has not posted yet.'} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} tintColor={Colors.primary} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  coverPhoto: { height: 180, width: '100%' },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  backButton: { position: 'absolute', top: 44, left: 12, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 8 },
  profileCard: { paddingHorizontal: 16, paddingBottom: 16, marginTop: -1 },
  avatarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -40 },
  avatarBorder: { borderWidth: 4, borderRadius: 55, overflow: 'hidden' },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { fontSize: 36, fontWeight: '800', color: '#FFF' },
  actionButtons: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  outlineButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1.5 },
  outlineButtonText: { fontSize: 13, fontWeight: '700' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: 22, fontWeight: '800', marginTop: 10 },
  profileUsername: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  headline: { fontSize: 14, fontWeight: '600', marginTop: 6 },
  bio: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 10, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 24, marginTop: 14 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
});

export default ProfileScreen;
