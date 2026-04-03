import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { formatDate } from '../utils/formatDate';
import api from '../api/axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PostCard = ({ post, onLike, onComment, onDelete, onSave, index = 0 }) => {
  const { user } = useAuth();
  const { theme } = useThemeContext();
  const navigation = useNavigation();
  const [isFollowing, setIsFollowing] = useState(
    post.authorFollowers?.includes(user?.username) || false,
  );
  const [imageError, setImageError] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const isOwnPost = post.authorUsername === user?.username;
  const isLiked = (post.likes || []).some((l) => l.username === user?.username);
  const likeCount = Number(post.likeCount || 0);
  const commentCount = Number(post.commentCount || 0);
  const shareCount = Number(post.shareCount || 0);
  const isSaved = post.isSaved || false;

  const handleFollow = async () => {
    setIsFollowing((prev) => !prev);
    try {
      await api.put(`/users/follow/${post.authorUsername}`);
    } catch {
      setIsFollowing((prev) => !prev);
    }
  };

  const handleLike = () => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);
    onLike?.(post._id);
  };

  const handleNavigateToProfile = () => {
    if (post.authorUsername === user?.username) {
      navigation.navigate('MainTabs', { screen: 'ProfileTab' });
    } else {
      navigation.navigate('OtherProfile', { username: post.authorUsername });
    }
  };

  const handleMessage = () => {
    if (!isFollowing && !isOwnPost) {
      Alert.alert('Follow Required', 'Follow this user first to start messaging.');
      return;
    }
    navigation.navigate('Chat', { username: post.authorUsername });
  };

  const confirmDelete = () => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(post._id) },
    ]);
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.authorRow} onPress={handleNavigateToProfile}>
          <View style={styles.avatarContainer}>
            {post.authorAvatar ? (
              <Image source={{ uri: post.authorAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: Colors.primary }]}>
                <Text style={styles.avatarFallbackText}>
                  {(post.authorName || 'K')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.authorInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.authorName, { color: theme.colors.text }]} numberOfLines={1}>
                {post.authorName}
              </Text>
              {post.type === 'promo' && (
                <View style={styles.promoBadge}>
                  <Text style={styles.promoBadgeText}>PROMO</Text>
                </View>
              )}
            </View>
            <Text style={[styles.authorMeta, { color: theme.colors.textSecondary }]}>
              @{post.authorUsername}  ·  {formatDate(post.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {!isOwnPost && (
            <>
              <TouchableOpacity style={[styles.followButton, isFollowing && styles.followingButton]} onPress={handleFollow}>
                <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMessage} style={styles.iconButton}>
                <Icon name="send" size={16} color={isFollowing ? Colors.primary : theme.colors.textCaption} style={{ transform: [{ rotate: '-30deg' }] }} />
              </TouchableOpacity>
            </>
          )}
          {isOwnPost && (
            <TouchableOpacity onPress={confirmDelete} style={styles.iconButton}>
              <Icon name="delete-outline" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {!!post.content && (
        <Text style={[styles.content, { color: theme.colors.text }]}>
          {post.content}
        </Text>
      )}

      {/* Image */}
      {!!post.image && !imageError && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: post.image }}
            style={styles.postImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        </View>
      )}

      {/* Actions */}
      <View style={[styles.actionsRow, { borderTopColor: theme.colors.divider }]}>
        {/* Like */}
        <TouchableOpacity style={styles.actionButton} onPress={handleLike} activeOpacity={0.7}>
          <Icon
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? Colors.error : theme.colors.textSecondary}
            style={likeAnimating ? { transform: [{ scale: 1.3 }] } : undefined}
          />
          {likeCount > 0 && (
            <Text style={[styles.actionCount, { color: isLiked ? Colors.error : theme.colors.textSecondary }]}>
              {likeCount}
            </Text>
          )}
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment?.(post._id)}
          activeOpacity={0.7}>
          <Icon name="comment-outline" size={20} color={theme.colors.textSecondary} />
          {commentCount > 0 && (
            <Text style={[styles.actionCount, { color: theme.colors.textSecondary }]}>{commentCount}</Text>
          )}
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
          <Icon name="share-outline" size={20} color={theme.colors.textSecondary} />
          {shareCount > 0 && (
            <Text style={[styles.actionCount, { color: theme.colors.textSecondary }]}>{shareCount}</Text>
          )}
        </TouchableOpacity>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Save */}
        <TouchableOpacity style={styles.actionButton} onPress={() => onSave?.(post._id)} activeOpacity={0.7}>
          <Icon
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={isSaved ? Colors.primary : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {likeCount > 0 && <Text style={[styles.statsText, { color: theme.colors.textCaption }]}>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</Text>}
        {commentCount > 0 && <Text style={[styles.statsText, { color: theme.colors.textCaption }]}>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</Text>}
        {shareCount > 0 && <Text style={[styles.statsText, { color: theme.colors.textCaption }]}>{shareCount} shares</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    marginRight: 10,
  },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  avatarFallback: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarFallbackText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  authorInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { fontSize: 15, fontWeight: '800', flexShrink: 1 },
  authorMeta: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  promoBadge: {
    backgroundColor: 'rgba(255,97,84,0.1)',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
  },
  promoBadgeText: { color: Colors.primary, fontSize: 9, fontWeight: '800' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  followButton: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10,
    backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.primary,
  },
  followingButton: {
    borderColor: 'rgba(150,150,150,0.3)',
  },
  followButtonText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  followingButtonText: { color: '#999' },
  iconButton: { padding: 6 },
  content: {
    fontSize: 15, lineHeight: 22, fontWeight: '400',
    paddingHorizontal: 14, paddingBottom: 10,
  },
  imageContainer: {
    marginHorizontal: 0,
    borderRadius: 0,
    overflow: 'hidden',
  },
  postImage: {
    width: SCREEN_WIDTH - 2,
    height: SCREEN_WIDTH * 0.65,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    gap: 4,
  },
  actionCount: { fontSize: 13, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 12,
  },
  statsText: { fontSize: 12, fontWeight: '500' },
});

export default React.memo(PostCard);
