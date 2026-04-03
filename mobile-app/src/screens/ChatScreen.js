import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, Image,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { Colors } from '../theme/colors';
import { formatMessageTime } from '../utils/formatDate';
import { getSocketUrl, getSocketOptions } from '../utils/socket';

const ChatScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { theme } = useThemeContext();
  const username = route?.params?.username;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [conversationId, setConversationId] = useState(route?.params?.conversationId || null);
  const flatListRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize conversation
  useEffect(() => {
    const init = async () => {
      try {
        // Start/get conversation
        const convRes = await api.get(`/messages/start/${username}`);
        const convId = convRes.data.conversation?._id || convRes.data._id;
        setConversationId(convId);
        setOtherUser(convRes.data.otherUser || convRes.data.conversation?.otherUser || { username });

        // Fetch messages
        const msgRes = await api.get(`/messages/${convId}`);
        setMessages((msgRes.data.messages || msgRes.data || []).reverse());

        // Mark as read
        api.post(`/messages/${convId}/read`).catch(() => {});
      } catch (err) {
        Alert.alert('Error', 'Failed to load conversation.');
      } finally {
        setLoading(false);
      }
    };
    if (username) init();
  }, [username]);

  // Socket.IO for real-time messages
  useEffect(() => {
    if (!user?.username) return;
    const socket = io(getSocketUrl(), getSocketOptions(user.username));
    socketRef.current = socket;

    socket.on('dm:message', (payload) => {
      if (payload.fromUsername === username) {
        setMessages((prev) => [
          ...prev,
          {
            _id: `socket-${Date.now()}`,
            content: payload.text,
            sender: { username: payload.fromUsername },
            createdAt: payload.createdAt,
          },
        ]);
      }
    });

    return () => socket.disconnect();
  }, [user?.username, username]);

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg || !conversationId) return;

    const optimistic = {
      _id: `temp-${Date.now()}`,
      content: msg,
      sender: { username: user.username },
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setText('');
    setSending(true);

    try {
      const res = await api.post(`/messages/${conversationId}`, { content: msg });
      setMessages((prev) => prev.map((m) => (m._id === optimistic._id ? (res.data.message || res.data) : m)));

      // Also emit via socket for real-time
      if (socketRef.current) {
        socketRef.current.emit('dm:send', { toUsername: username, text: msg });
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const isOwnMessage = (msg) => msg.sender?.username === user?.username;

  const renderMessage = ({ item }) => {
    const isMine = isOwnMessage(item);
    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
        <View style={[styles.msgBubble, isMine ? styles.bubbleMine : { backgroundColor: theme.colors.inputBg }]}>
          <Text style={[styles.msgText, { color: isMine ? '#FFFFFF' : theme.colors.text }]}>{item.content}</Text>
          <Text style={[styles.msgTime, { color: isMine ? 'rgba(255,255,255,0.6)' : theme.colors.textCaption }]}>
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerUser}>
          {otherUser?.profilePicture ? (
            <Image source={{ uri: otherUser.profilePicture }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatarFallback, { backgroundColor: Colors.primary }]}>
              <Text style={styles.headerAvatarText}>{(otherUser?.name || username || 'K')[0].toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={[styles.headerName, { color: theme.colors.text }]}>{otherUser?.name || username}</Text>
            <Text style={[styles.headerHandle, { color: theme.colors.textSecondary }]}>@{username}</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.msgList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.divider }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.inputBg, color: theme.colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.textCaption}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { opacity: text.trim() ? 1 : 0.4 }]}
            onPress={handleSend}
            disabled={!text.trim() || sending}>
            <Icon name="send" size={20} color="#FFFFFF" style={{ transform: [{ rotate: '-30deg' }] }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 44, paddingBottom: 12, paddingHorizontal: 8, borderBottomWidth: 0.5 },
  backBtn: { padding: 8 },
  headerUser: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 4 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerAvatarFallback: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  headerAvatarText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  headerName: { fontSize: 16, fontWeight: '700' },
  headerHandle: { fontSize: 12, fontWeight: '500' },
  msgList: { paddingHorizontal: 12, paddingVertical: 16 },
  msgRow: { marginBottom: 8 },
  msgRowRight: { alignItems: 'flex-end' },
  msgRowLeft: { alignItems: 'flex-start' },
  msgBubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMine: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgTime: { fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 0.5, gap: 8 },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
});

export default ChatScreen;
