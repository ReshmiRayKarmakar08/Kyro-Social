import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  IconButton,
  Badge,
  InputAdornment,
  Skeleton,
  CircularProgress,
  Divider,
  Tooltip,
  Button,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBackRounded,
  SendRounded,
  SearchRounded,
  ChatBubbleOutlineRounded,
  MarkChatReadRounded,
  ImageRounded,
  DoneRounded,
  DoneAllRounded,
  CloseRounded,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import { getSocketOptions, getSocketUrl } from '../utils/socket';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const timeAgo = (date) => {
  if (!date) return '';
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

/* ------------------------------------------------------------------ */
/* Conversation List Item                                             */
/* ------------------------------------------------------------------ */
const ConversationItem = ({ conv, isActive, onSelect }) => (
  <Box
    component={motion.div}
    whileTap={{ scale: 0.98 }}
    onClick={() => onSelect(conv)}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      px: 2.5,
      py: 1.5,
      cursor: 'pointer',
      bgcolor: isActive
        ? (theme) => theme.palette.mode === 'light' ? 'rgba(255,97,84,0.06)' : 'rgba(255,97,84,0.1)'
        : 'transparent',
      borderLeft: isActive ? '3px solid #FF6154' : '3px solid transparent',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
      },
    }}
  >
    <Box sx={{ position: 'relative' }}>
      <Avatar
        src={conv.otherUser?.profilePicture || logo}
        sx={{ width: 52, height: 52, border: (theme) => `2px solid ${isActive ? '#FF6154' : theme.palette.divider}` }}
      >
        {conv.otherUser?.name?.charAt(0)}
      </Avatar>
      {/* Online dot */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 1,
          right: 1,
          width: 12,
          height: 12,
          bgcolor: '#10B981',
          borderRadius: '50%',
          border: (theme) => `2px solid ${theme.palette.background.paper}`,
        }}
      />
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="subtitle2"
          fontWeight={conv.unreadCount ? 800 : 600}
          noWrap
          sx={{ color: 'text.primary', fontSize: '0.9rem' }}
        >
          {conv.otherUser?.name || 'Unknown'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', flexShrink: 0, ml: 1, fontSize: '0.7rem' }}>
          {timeAgo(conv.lastMessage?.createdAt)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.2 }}>
        <Typography
          variant="caption"
          noWrap
          sx={{
            color: conv.unreadCount ? 'text.primary' : 'text.secondary',
            fontWeight: conv.unreadCount ? 700 : 400,
            fontSize: '0.8rem',
            flex: 1,
          }}
        >
          {conv.lastMessage?.text || 'Start a conversation'}
        </Typography>
        {conv.unreadCount > 0 && (
          <Box
            component={motion.div}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            sx={{
              bgcolor: '#FF6154',
              color: '#fff',
              borderRadius: '999px',
              minWidth: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 800,
              px: 0.5,
              ml: 1,
              flexShrink: 0,
            }}
          >
            {conv.unreadCount}
          </Box>
        )}
      </Box>
    </Box>
  </Box>
);

/* ------------------------------------------------------------------ */
/* Conversation List Panel                                            */
/* ------------------------------------------------------------------ */
const ConversationList = ({
  conversations,
  activeId,
  onSelect,
  loading,
  search,
  onSearchChange,
  contacts = [],
  contactsLoading = false,
  onStartChat,
}) => (
  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    {/* Header */}
    <Box
      sx={{
        px: 2.5,
        pt: 2.5,
        pb: 2,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MarkChatReadRounded sx={{ color: '#FF6154', fontSize: 24 }} />
          <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
            Messages
          </Typography>
        </Box>
        <Tooltip title="New chat">
          <IconButton size="small" sx={{ color: '#FF6154' }}>
            <ChatBubbleOutlineRounded sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <TextField
        fullWidth
        size="small"
        placeholder="Search messages..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRounded sx={{ fontSize: 18, color: 'text.disabled' }} />
            </InputAdornment>
          ),
          sx: {
            borderRadius: '14px',
            bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
            fontSize: '0.85rem',
            '& fieldset': { border: 'none' },
          },
        }}
      />
    </Box>

    {/* List */}
    <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.5 }}>
            <Skeleton variant="circular" width={52} height={52} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="60%" height={20} />
              <Skeleton width="80%" height={16} sx={{ mt: 0.5 }} />
            </Box>
          </Box>
        ))
      ) : conversations.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(255,97,84,0.08)' : 'rgba(255,97,84,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <ChatBubbleOutlineRounded sx={{ fontSize: 32, color: '#FF6154' }} />
          </Box>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
            No conversations yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
            Visit a profile and tap the message icon to start chatting
          </Typography>
          <Divider sx={{ my: 2.2 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 0.2 }}>
            Following
          </Typography>
          {contactsLoading ? (
            <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={20} />
            </Box>
          ) : contacts.length === 0 ? (
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.disabled' }}>
              Follow users to start messaging.
            </Typography>
          ) : (
            <Box sx={{ mt: 1.2, display: 'grid', gap: 0.8 }}>
              {contacts.map((contact) => (
                <Button
                  key={contact.username}
                  fullWidth
                  variant="outlined"
                  onClick={() => onStartChat?.(contact.username)}
                  startIcon={<Avatar src={contact.profilePicture || logo} sx={{ width: 22, height: 22 }} />}
                  sx={{
                    justifyContent: 'flex-start',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.78rem',
                    color: 'text.primary',
                    borderColor: (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)',
                  }}
                >
                  {contact.name} @{contact.username}
                </Button>
              ))}
            </Box>
          )}
        </Box>
      ) : (
        conversations.map((conv) => (
          <ConversationItem key={conv._id} conv={conv} isActive={activeId === conv._id} onSelect={onSelect} />
        ))
      )}
    </Box>
  </Box>
);

/* ------------------------------------------------------------------ */
/* Chat View                                                          */
/* ------------------------------------------------------------------ */
const ChatView = ({ conversation, currentUser, onBack, socketRef, onLocalMessage, isSplitView }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const fileInputRef = useRef(null);

  const otherUser = conversation?.otherUser;
  const convId = conversation?._id;
  const navigate = useNavigate();

  // Fetch messages
  useEffect(() => {
    if (!convId) return;
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/messages/${convId}`);
        setMessages(res.data?.messages || []);
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [convId]);

  // Listen for new messages
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handler = (data) => {
      if (data.conversationId === convId) {
        setMessages((prev) => {
          if (prev.some((item) => String(item._id) === String(data.message?._id))) {
            return prev;
          }
          return [...prev, data.message];
        });
        api.post(`/messages/${convId}/read`).catch(() => {});
      }
    };
    const seenHandler = (data) => {
      if (data.conversationId !== convId) return;
      const seenSet = new Set((data.messageIds || []).map((id) => String(id)));
      setMessages((prev) => prev.map((item) => (
        seenSet.has(String(item._id))
          ? { ...item, status: 'seen', read: true, readAt: data.seenAt || new Date().toISOString() }
          : item
      )));
    };

    const typingStartHandler = (data) => {
      if (data.fromUsername === otherUser?.username) setTyping(true);
    };
    const typingStopHandler = (data) => {
      if (data.fromUsername === otherUser?.username) setTyping(false);
    };

    socket.on('message:new', handler);
    socket.on('message:seen', seenHandler);
    socket.on('typing:start', typingStartHandler);
    socket.on('typing:stop', typingStopHandler);

    return () => {
      socket.off('message:new', handler);
      socket.off('message:seen', seenHandler);
      socket.off('typing:start', typingStartHandler);
      socket.off('typing:stop', typingStopHandler);
    };
  }, [convId, otherUser?.username, socketRef]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleTyping = () => {
    const socket = socketRef.current;
    if (!socket || !otherUser) return;
    socket.emit('typing:start', { toUsername: otherUser.username });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing:stop', { toUsername: otherUser.username });
    }, 1500);
  };

  const handleSend = async () => {
    const msg = text.trim();
    if ((!msg && !imageFile) || sending) return;
    setSending(true);
    setText('');

    const optimistic = {
      _id: `temp-${Date.now()}`,
      text: msg,
      imageUrl: imagePreview || '',
      sender: { _id: currentUser?.id, username: currentUser?.username, name: currentUser?.name },
      createdAt: new Date().toISOString(),
      read: false,
      status: 'sent',
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      let res;
      if (imageFile) {
        const formData = new FormData();
        formData.append('recipientUsername', otherUser?.username || '');
        if (msg) formData.append('text', msg);
        formData.append('image', imageFile);
        res = await api.post('/messages/send', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post('/messages/send', {
          recipientUsername: otherUser?.username,
          text: msg,
        });
      }
      const savedMessage = res.data?.message;
      if (savedMessage) {
        setMessages((prev) => prev.map((item) => (
          String(item._id) === String(optimistic._id) ? savedMessage : item
        )));
        onLocalMessage?.(convId, savedMessage);
      }
      socketRef.current?.emit('typing:stop', { toUsername: otherUser.username });
      setImageFile(null);
      setImagePreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setText(msg);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImagePick = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = useCallback(() => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const renderStatusIcon = (message) => {
    const status = message?.status || (message?.read ? 'seen' : 'sent');
    if (status === 'seen') {
      return <DoneAllRounded sx={{ fontSize: 13, ml: 0.5, color: '#38BDF8' }} />;
    }
    if (status === 'delivered') {
      return <DoneAllRounded sx={{ fontSize: 13, ml: 0.5, color: 'rgba(255,255,255,0.85)' }} />;
    }
    return <DoneRounded sx={{ fontSize: 13, ml: 0.5, color: 'rgba(255,255,255,0.8)' }} />;
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          py: 1.5,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.02)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <IconButton
          onClick={onBack}
          size="small"
          sx={{
            display: isSplitView ? 'none' : 'inline-flex',
            bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
          }}
        >
          <ArrowBackRounded sx={{ fontSize: 20 }} />
        </IconButton>
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={otherUser?.profilePicture || logo}
            sx={{
              width: 44,
              height: 44,
              cursor: 'pointer',
              border: '2px solid #FF6154',
            }}
            onClick={() => navigate(`/profile/${otherUser?.username}`)}
          >
            {otherUser?.name?.charAt(0)}
          </Avatar>
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 10,
              height: 10,
              bgcolor: '#10B981',
              borderRadius: '50%',
              border: (theme) => `2px solid ${theme.palette.background.paper}`,
            }}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            noWrap
            sx={{ color: 'text.primary', cursor: 'pointer', fontSize: '0.95rem' }}
            onClick={() => navigate(`/profile/${otherUser?.username}`)}
          >
            {otherUser?.name || 'User'}
          </Typography>
          <Typography variant="caption" sx={{ color: typing ? '#FF6154' : '#10B981', fontWeight: typing ? 700 : 500, fontSize: '0.72rem' }}>
            {typing ? 'typing...' : 'Active now'}
          </Typography>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: { xs: 1.5, sm: 2.5 },
          py: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          bgcolor: (theme) => theme.palette.mode === 'light'
            ? 'linear-gradient(180deg, #FAFBFC 0%, #F5F6F8 100%)'
            : 'transparent',
          background: (theme) => theme.palette.mode === 'light'
            ? 'linear-gradient(180deg, #FAFBFC 0%, #F5F6F8 100%)'
            : undefined,
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} sx={{ color: '#FF6154' }} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, my: 'auto' }}>
            <Avatar
              src={otherUser?.profilePicture || logo}
              sx={{ width: 80, height: 80, mx: 'auto', mb: 2, border: '3px solid #FF6154' }}
            />
            <Typography variant="subtitle1" fontWeight={800} color="text.primary">
              {otherUser?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              @{otherUser?.username}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.8rem' }}>
              Send a message to start the conversation
            </Typography>
          </Box>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <Box key={date}>
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
                    color: 'text.secondary',
                    px: 2,
                    py: 0.5,
                    borderRadius: '999px',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  {date}
                </Typography>
              </Box>
              {msgs.map((msg, i) => {
                const isMine = msg.sender?._id === currentUser?.id ||
                  msg.sender?.username === currentUser?.username;
                const showAvatar = !isMine && (i === 0 || msgs[i - 1]?.sender?.username !== msg.sender?.username);
                return (
                  <Box
                    key={msg._id}
                    component={motion.div}
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    sx={{
                      display: 'flex',
                      justifyContent: isMine ? 'flex-end' : 'flex-start',
                      alignItems: 'flex-end',
                      mb: 0.4,
                      gap: 1,
                    }}
                  >
                    {!isMine && (
                      <Avatar
                        src={showAvatar ? (otherUser?.profilePicture || logo) : undefined}
                        sx={{
                          width: 28,
                          height: 28,
                          visibility: showAvatar ? 'visible' : 'hidden',
                          fontSize: '0.7rem',
                        }}
                      >
                        {showAvatar ? otherUser?.name?.charAt(0) : ''}
                      </Avatar>
                    )}
                    <Box
                      sx={{
                        maxWidth: { xs: '88%', sm: '78%', md: '72%' },
                        px: 2,
                        py: 1,
                        borderRadius: isMine ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                        background: isMine
                          ? 'linear-gradient(135deg, #FF6154 0%, #FF8A65 100%)'
                          : (theme) => theme.palette.mode === 'light'
                            ? '#FFFFFF'
                            : 'rgba(255,255,255,0.08)',
                        color: isMine ? '#fff' : 'text.primary',
                        boxShadow: isMine
                          ? '0 4px 14px rgba(255,97,84,0.25)'
                          : (theme) => theme.palette.mode === 'light'
                            ? '0 1px 4px rgba(0,0,0,0.06)'
                            : 'none',
                        border: isMine
                          ? 'none'
                          : (theme) => theme.palette.mode === 'light'
                            ? '1px solid rgba(0,0,0,0.04)'
                            : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontSize: '0.88rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                      >
                        {msg.text}
                      </Typography>
                      {msg.imageUrl && (
                        <Box
                          component="img"
                          src={msg.imageUrl}
                          alt="message attachment"
                          sx={{
                            mt: msg.text ? 0.8 : 0,
                            width: '100%',
                            maxWidth: 220,
                            maxHeight: 260,
                            borderRadius: 2,
                            objectFit: 'cover',
                            display: 'block',
                            cursor: 'zoom-in',
                          }}
                        />
                      )}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          textAlign: 'right',
                          mt: 0.3,
                          fontSize: '0.62rem',
                          opacity: 0.65,
                          color: isMine ? 'rgba(255,255,255,0.85)' : 'text.disabled',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontSize: 'inherit', color: 'inherit' }}>
                          {formatTime(msg.createdAt)}
                        </Typography>
                        {isMine && renderStatusIcon(msg)}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {typing && (
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 5, mb: 1 }}
            >
              <Box
                sx={{
                  bgcolor: (theme) => theme.palette.mode === 'light' ? '#fff' : 'rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  px: 2,
                  py: 1,
                  display: 'flex',
                  gap: 0.5,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                {[0, 1, 2].map((i) => (
                  <Box
                    key={i}
                    component={motion.div}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#FF6154' }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          px: 2,
          py: 1.5,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: (theme) => theme.palette.mode === 'light' ? '#fff' : 'background.paper',
          flexDirection: 'column',
        }}
      >
        {imagePreview && (
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1, mb: 0.6 }}>
            <Box
              component="img"
              src={imagePreview}
              alt="Preview"
              sx={{ width: 62, height: 62, borderRadius: 1.5, objectFit: 'cover' }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>
              {imageFile?.name || 'Selected image'}
            </Typography>
            <IconButton size="small" onClick={clearImage}>
              <CloseRounded sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        )}

        <Box sx={{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImagePick}
          />
          <IconButton size="small" sx={{ color: 'text.secondary', mb: 0.5 }} onClick={() => fileInputRef.current?.click()}>
            <ImageRounded sx={{ fontSize: 22 }} />
          </IconButton>
          <TextField
            fullWidth
            size="small"
            placeholder={imagePreview ? 'Add a caption...' : 'Type a message...'}
            value={text}
            onChange={(e) => { setText(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            multiline
            maxRows={4}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '24px',
                bgcolor: (theme) => theme.palette.mode === 'light' ? '#F5F6F8' : 'rgba(255,255,255,0.05)',
                fontSize: '0.9rem',
                '& fieldset': { border: 'none' },
                px: 0.5,
              },
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={(!text.trim() && !imageFile) || sending}
            component={motion.button}
            whileTap={{ scale: 0.9 }}
            sx={{
              bgcolor: (text.trim() || imageFile) ? '#FF6154' : 'transparent',
              color: (text.trim() || imageFile) ? '#fff' : 'text.disabled',
              width: 40,
              height: 40,
              mb: 0.5,
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: (text.trim() || imageFile) ? '0 4px 12px rgba(255,97,84,0.35)' : 'none',
              '&:hover': { bgcolor: (text.trim() || imageFile) ? '#E8451C' : 'transparent' },
            }}
          >
            <SendRounded sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

/* ------------------------------------------------------------------ */
/* Main Page                                                          */
/* ------------------------------------------------------------------ */
const MessagesPage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isWideScreen = useMediaQuery(theme.breakpoints.up('xl'));
  const useSplitView = isWideScreen;
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const socketRef = useRef(null);

  // Socket connection
  useEffect(() => {
    const socket = io(getSocketUrl(), getSocketOptions(user?.username || ''));

    socketRef.current = socket;

    socket.on('message:new', (data) => {
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c._id === data.conversationId) {
            return {
              ...c,
              lastMessage: {
                text: data.message.text,
                sender: data.message.sender,
                createdAt: data.message.createdAt,
              },
              unreadCount: activeConv?._id === data.conversationId ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        });
        const idx = updated.findIndex((c) => c._id === data.conversationId);
        if (idx > 0) {
          const [moved] = updated.splice(idx, 1);
          updated.unshift(moved);
        }
        return updated;
      });
    });

    return () => socket.disconnect();
  }, [user?.username]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/messages/conversations');
      setConversations(res.data?.conversations || []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const fetchContacts = async () => {
      setContactsLoading(true);
      try {
        const res = await api.get('/messages/contacts');
        setContacts(res.data?.users || []);
      } catch {
        setContacts([]);
      } finally {
        setContactsLoading(false);
      }
    };
    fetchContacts();
  }, []);

  // Handle ?user= query param
  useEffect(() => {
    const targetUser = searchParams.get('user');
    if (!targetUser) return;

    const startChat = async () => {
      try {
        const res = await api.get(`/messages/start/${targetUser}`);
        const conv = {
          _id: res.data.conversationId,
          otherUser: res.data.otherUser,
          lastMessage: null,
          unreadCount: 0,
        };

        setConversations((prev) => {
          const exists = prev.find((c) => c._id === conv._id);
          if (exists) return prev;
          return [conv, ...prev];
        });
        setActiveConv(conv);
        setMobileShowChat(true);
      } catch (error) {
        setPageError(error?.response?.data?.message || 'Unable to start chat.');
      }
    };

    startChat();
  }, [searchParams]);

  const handleSelectConv = (conv) => {
    setActiveConv(conv);
    if (!useSplitView) setMobileShowChat(true);
    if (conv.unreadCount > 0) {
      api.post(`/messages/${conv._id}/read`).catch(() => {});
      setConversations((prev) =>
        prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  const handleStartChat = async (targetUsername) => {
    try {
      const res = await api.get(`/messages/start/${targetUsername}`);
      const conv = {
        _id: res.data.conversationId,
        otherUser: res.data.otherUser,
        lastMessage: null,
        unreadCount: 0,
      };

      setConversations((prev) => {
        const exists = prev.find((c) => c._id === conv._id);
        if (exists) return prev;
        return [conv, ...prev];
      });
      setActiveConv(conv);
      if (!useSplitView) setMobileShowChat(true);
      setPageError('');
    } catch (error) {
      setPageError(error?.response?.data?.message || 'Unable to start chat.');
    }
  };

  const handleBack = () => {
    setMobileShowChat(false);
    fetchConversations();
  };

  const handleLocalMessage = (conversationId, message) => {
    if (!conversationId || !message) return;
    setConversations((prev) => {
      const updated = prev.map((conv) => (
        conv._id === conversationId
          ? {
            ...conv,
            lastMessage: {
              text: message.text,
              sender: message.sender,
              createdAt: message.createdAt,
            },
            unreadCount: 0,
          }
          : conv
      ));

      const idx = updated.findIndex((conv) => conv._id === conversationId);
      if (idx > 0) {
        const [moved] = updated.splice(idx, 1);
        updated.unshift(moved);
      }
      return updated;
    });
  };

  const filtered = search.trim()
    ? conversations.filter((c) =>
        c.otherUser?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.otherUser?.username?.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  return (
    <Box
      sx={{
        height: { xs: 'calc(100vh - 150px)', md: 'calc(100vh - 110px)' },
        display: 'flex',
        borderRadius: { xs: 2, md: 3 },
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        boxShadow: (theme) => theme.palette.mode === 'light'
          ? '0 8px 32px rgba(0,0,0,0.06)'
          : '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      {/* Conversation List Panel */}
      <Box
        sx={{
          width: useSplitView ? 360 : '100%',
          borderRight: useSplitView ? (theme) => `1px solid ${theme.palette.divider}` : 'none',
          display: useSplitView ? 'flex' : (mobileShowChat ? 'none' : 'flex'),
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <ConversationList
          conversations={filtered}
          activeId={activeConv?._id}
          onSelect={handleSelectConv}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          contacts={contacts}
          contactsLoading={contactsLoading}
          onStartChat={handleStartChat}
        />
      </Box>

      {/* Chat Panel */}
      <Box
        sx={{
          flex: 1,
          display: useSplitView ? 'flex' : (mobileShowChat ? 'flex' : 'none'),
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {activeConv ? (
          <ChatView
            conversation={activeConv}
            currentUser={user}
            onBack={handleBack}
            socketRef={socketRef}
            onLocalMessage={handleLocalMessage}
            isSplitView={useSplitView}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255,97,84,0.1) 0%, rgba(255,138,101,0.1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              <ChatBubbleOutlineRounded sx={{ fontSize: 40, color: '#FF6154' }} />
            </Box>
            <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ letterSpacing: '-0.02em' }}>
              Your Messages
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
              Select a conversation or visit a profile and tap the message icon to start chatting
            </Typography>
          </Box>
        )}
      </Box>

      <Snackbar
        open={!!pageError}
        autoHideDuration={3500}
        onClose={() => setPageError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setPageError('')} severity="warning" variant="filled" sx={{ borderRadius: 2 }}>
          {pageError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MessagesPage;
