const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { getIO } = require('../utils/socket');
const { pushNotification } = require('../utils/notifications');
const { sendFirstMessageEmail } = require('../utils/email');
const { uploadImage } = require('../utils/cloudinary');

const canDirectMessage = ({ sender, recipient }) => {
  const senderFollowing = (sender.following || []).map((u) => String(u).toLowerCase());

  // Product rule requested by user: after follow, messaging is allowed.
  const senderFollowsRecipient = senderFollowing.includes(String(recipient.username || '').toLowerCase());
  if (!senderFollowsRecipient) return false;

  return true;
};

const getRoomConnections = (io, username) => {
  if (!io || !username) return 0;
  return io.sockets.adapter.rooms.get(`user:${String(username).toLowerCase()}`)?.size || 0;
};

// GET /api/messages/conversations
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .populate('participants', 'name username profilePicture headline')
      .populate('lastMessage.sender', 'name username')
      .lean();

    const formatted = conversations.map((conv) => {
      const other = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );
      const unread = conv.unreadCount?.get?.(userId.toString()) ||
        (conv.unreadCount && conv.unreadCount[userId.toString()]) || 0;

      return {
        _id: conv._id,
        otherUser: other || null,
        lastMessage: conv.lastMessage || null,
        unreadCount: unread,
        updatedAt: conv.updatedAt,
      };
    });

    res.json({ conversations: formatted });
  } catch (error) {
    next(error);
  }
};

// GET /api/messages/:conversationId
const getMessages = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 30);

    const conv = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conv) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'name username profilePicture')
      .lean();

    const unseenMessages = await Message.find({
      conversationId,
      sender: { $ne: userId },
      status: { $ne: 'seen' },
    }).select('_id');

    const unseenIds = unseenMessages.map((item) => item._id);

    // Mark incoming messages as seen
    if (unseenIds.length) {
      await Message.updateMany(
        { _id: { $in: unseenIds } },
        {
          $set: {
            read: true,
            status: 'seen',
            readAt: new Date(),
            deliveredAt: new Date(),
          },
        }
      );
    }

    // Reset unread count
    const key = `unreadCount.${userId.toString()}`;
    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { [key]: 0 } }
    );

    const total = await Message.countDocuments({ conversationId });

    const io = getIO();
    if (io && unseenIds.length) {
      const conversationWithParticipants = await Conversation.findById(conversationId)
        .populate('participants', 'username')
        .lean();
      const other = (conversationWithParticipants?.participants || []).find(
        (p) => String(p._id) !== String(userId)
      );
      if (other?.username) {
        io.to(`user:${other.username}`).emit('message:seen', {
          conversationId: String(conversationId),
          messageIds: unseenIds.map((id) => String(id)),
          seenAt: new Date().toISOString(),
          seenBy: req.user.username,
        });
      }
    }

    res.json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/messages/send
const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const senderUsername = req.user.username;
    const { recipientUsername, text } = req.body;
    const normalizedText = (text || '').trim();

    if (!normalizedText && !req.file) {
      return res.status(400).json({ message: 'Message text or image is required' });
    }
    if (!recipientUsername) {
      return res.status(400).json({ message: 'Recipient is required' });
    }

    const [sender, recipient] = await Promise.all([
      User.findById(senderId).select('username following email name mailMeta settings'),
      User.findOne({
      username: recipientUsername.toLowerCase(),
      }).select('_id username name profilePicture followers settings'),
    ]);

    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (recipient._id.toString() === senderId.toString()) {
      return res.status(400).json({ message: 'Cannot message yourself' });
    }

    if (!canDirectMessage({ sender, recipient })) {
      return res.status(403).json({
        message: 'Follow this account first to start messaging.',
      });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipient._id], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recipient._id],
        unreadCount: { [recipient._id.toString()]: 0 },
      });
    }

    let imageResult = null;
    if (req.file) {
      imageResult = await uploadImage(req.file.buffer, 'kyro-social/messages');
    }

    const io = getIO();
    const recipientOnline = getRoomConnections(io, recipient.username) > 0;
    const now = new Date();

    // Create message
    const message = await Message.create({
      conversationId: conversation._id,
      sender: senderId,
      text: normalizedText.slice(0, 2000),
      imageUrl: imageResult?.url || '',
      imagePublicId: imageResult?.publicId || '',
      status: recipientOnline ? 'delivered' : 'sent',
      deliveredAt: recipientOnline ? now : null,
    });

    // Update conversation
    const recipientKey = `unreadCount.${recipient._id.toString()}`;
    const previewText = normalizedText
      ? normalizedText.slice(0, 100)
      : 'Photo';
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: {
        text: previewText,
        sender: senderId,
        createdAt: message.createdAt,
      },
      updatedAt: new Date(),
      $inc: { [recipientKey]: 1 },
    });

    // Populate sender for response
    const populated = await Message.findById(message._id)
      .populate('sender', 'name username profilePicture')
      .lean();

    // Emit via Socket.IO
    if (io) {
      io.to(`user:${recipient.username}`).emit('message:new', {
        conversationId: conversation._id,
        message: populated,
        senderInfo: {
          name: req.user.name,
          username: senderUsername,
          profilePicture: req.user.profilePicture,
        },
      });
    }

    await pushNotification({
      toUsername: recipient.username,
      type: 'message',
      fromUsername: senderUsername,
      text: `${senderUsername} sent you a message`,
    });

    if (!sender.mailMeta?.firstMessageMailSent && sender.email) {
      try {
        await sendFirstMessageEmail(sender.email, sender.name);
        sender.mailMeta = {
          ...(sender.mailMeta?.toObject?.() || sender.mailMeta || {}),
          firstMessageMailSent: true,
        };
        await sender.save();
      } catch {
        // non-blocking
      }
    }

    res.status(201).json({
      message: populated,
      conversationId: conversation._id,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/messages/:conversationId/read
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const unseenMessages = await Message.find({
      conversationId,
      sender: { $ne: userId },
      status: { $ne: 'seen' },
    }).select('_id');
    const unseenIds = unseenMessages.map((item) => item._id);

    if (unseenIds.length) {
      await Message.updateMany(
        { _id: { $in: unseenIds } },
        {
          $set: {
            read: true,
            status: 'seen',
            readAt: new Date(),
            deliveredAt: new Date(),
          },
        }
      );
    }

    const key = `unreadCount.${userId.toString()}`;
    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { [key]: 0 } }
    );

    const io = getIO();
    if (io && unseenIds.length) {
      const conversationWithParticipants = await Conversation.findById(conversationId)
        .populate('participants', 'username')
        .lean();
      const other = (conversationWithParticipants?.participants || []).find(
        (p) => String(p._id) !== String(userId)
      );
      if (other?.username) {
        io.to(`user:${other.username}`).emit('message:seen', {
          conversationId: String(conversationId),
          messageIds: unseenIds.map((id) => String(id)),
          seenAt: new Date().toISOString(),
          seenBy: req.user.username,
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// GET /api/messages/start/:username -- Get or create conversation with user
const startConversation = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { username } = req.params;

    const [sender, recipient] = await Promise.all([
      User.findById(senderId).select('username following settings'),
      User.findOne({
      username: username.toLowerCase(),
      }).select('_id username name profilePicture headline followers settings'),
    ]);

    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (recipient._id.toString() === senderId.toString()) {
      return res.status(400).json({ message: 'Cannot message yourself' });
    }

    if (!canDirectMessage({ sender, recipient })) {
      return res.status(403).json({
        message: 'Follow this account first to start messaging.',
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipient._id], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, recipient._id],
        unreadCount: {},
      });
    }

    res.json({
      conversationId: conversation._id,
      otherUser: recipient,
    });
  } catch (error) {
    next(error);
  }
};

const getMessageContacts = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id).select('username following');
    const followingUsernames = (me.following || []).map((username) => String(username).toLowerCase());

    if (followingUsernames.length === 0) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      username: { $in: followingUsernames, $ne: me.username },
    })
      .select('name username profilePicture headline')
      .sort({ name: 1 })
      .limit(50)
      .lean();

    res.json({ users });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  startConversation,
  getMessageContacts,
};
