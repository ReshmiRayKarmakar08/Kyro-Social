import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { formatMessageTime } from '../utils/formatDate';
import EmptyState from '../components/EmptyState';

const MessagesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useThemeContext();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data.conversations || res.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConversations(); }, []);

  const renderConversation = ({ item }) => {
    const other = item.otherUser || {};
    return (
      <TouchableOpacity
        style={[styles.convRow, { borderBottomColor: theme.colors.divider }]}
        onPress={() => navigation.navigate('Chat', { conversationId: item._id, username: other.username })}
        activeOpacity={0.7}>
        <View style={styles.avatarWrap}>
          {other.profilePicture ? (
            <Image source={{ uri: other.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: Colors.primary }]}>
              <Text style={styles.avatarText}>{(other.name || 'K')[0].toUpperCase()}</Text>
            </View>
          )}
          {item.unreadCount > 0 && <View style={styles.unreadDot} />}
        </View>
        <View style={styles.convInfo}>
          <View style={styles.convTopRow}>
            <Text style={[styles.convName, { color: theme.colors.text }]} numberOfLines={1}>{other.name || other.username}</Text>
            {item.lastMessage?.createdAt && (
              <Text style={[styles.convTime, { color: theme.colors.textCaption }]}>
                {formatMessageTime(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>
          <Text style={[styles.convPreview, { color: item.unreadCount > 0 ? theme.colors.text : theme.colors.textSecondary }]} numberOfLines={1}>
            {item.lastMessage?.content || 'Start a conversation'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.divider }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Messages</Text>
        <Icon name="message-plus-outline" size={24} color={Colors.primary} />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={renderConversation}
          ListEmptyComponent={
            <EmptyState
              icon="message-outline"
              title="No messages yet"
              message="Visit a profile and tap the message icon to start chatting"
            />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 48, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  convRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  avatarWrap: { width: 52, height: 52, marginRight: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  unreadDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.primary, borderWidth: 2, borderColor: '#FFF' },
  convInfo: { flex: 1 },
  convTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  convName: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  convTime: { fontSize: 12, fontWeight: '500' },
  convPreview: { fontSize: 14, fontWeight: '500' },
});

export default MessagesScreen;
