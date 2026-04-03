import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { formatDate } from '../utils/formatDate';
import EmptyState from '../components/EmptyState';

const NOTIF_ICONS = {
  like: 'heart',
  comment: 'comment-outline',
  follow: 'account-plus-outline',
  mention: 'at',
  message: 'message-outline',
};

const NotificationsScreen = ({ navigation }) => {
  const { notifications, fetchNotifications, markNotificationsRead, unreadNotifications } = useAuth();
  const { theme } = useThemeContext();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (unreadNotifications > 0) markNotificationsRead();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const renderNotification = ({ item }) => {
    const iconName = NOTIF_ICONS[item.type] || 'bell-outline';
    const iconColor = item.type === 'like' ? Colors.error : item.type === 'follow' ? Colors.success : Colors.primary;

    return (
      <View style={[styles.notifRow, { borderBottomColor: theme.colors.divider, backgroundColor: item.isRead ? 'transparent' : (theme.isDark ? 'rgba(255,97,84,0.05)' : 'rgba(255,97,84,0.03)') }]}>
        <View style={[styles.iconCircle, { backgroundColor: `${iconColor}15` }]}>
          <Icon name={iconName} size={18} color={iconColor} />
        </View>
        <View style={styles.notifContent}>
          <Text style={[styles.notifText, { color: theme.colors.text }]}>
            <Text style={{ fontWeight: '800' }}>@{item.fromUsername}</Text>
            {item.type === 'like' && ' liked your post'}
            {item.type === 'comment' && ' commented on your post'}
            {item.type === 'follow' && ' started following you'}
            {item.type === 'mention' && ' mentioned you'}
            {item.type === 'message' && ' sent you a message'}
          </Text>
          {!!item.text && <Text style={[styles.notifPreview, { color: theme.colors.textSecondary }]} numberOfLines={1}>{item.text}</Text>}
          <Text style={[styles.notifTime, { color: theme.colors.textCaption }]}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderNotification}
        ListEmptyComponent={<EmptyState icon="bell-outline" title="No notifications" message="You're all caught up!" />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 44, paddingBottom: 12, paddingHorizontal: 8, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, gap: 12 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  notifContent: { flex: 1 },
  notifText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  notifPreview: { fontSize: 13, marginTop: 2 },
  notifTime: { fontSize: 12, marginTop: 4, fontWeight: '500' },
});

export default NotificationsScreen;
