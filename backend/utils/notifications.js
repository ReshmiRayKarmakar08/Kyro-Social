const User = require('../models/User');
const { getIO } = require('./socket');

const emitToUser = (username, event, payload) => {
  const io = getIO();
  if (!io || !username) return;
  io.to(`user:${String(username).toLowerCase()}`).emit(event, payload);
};

const pushNotification = async ({
  toUsername,
  type,
  fromUsername,
  postId,
  text = '',
}) => {
  if (!toUsername) return;
  const normalizedTo = String(toUsername).toLowerCase();
  const normalizedFrom = String(fromUsername || '').toLowerCase();
  if (normalizedTo === normalizedFrom) return;

  const target = await User.findOne({ username: normalizedTo }).select('notifications');
  if (!target) return;

  target.notifications.unshift({
    type,
    fromUsername: normalizedFrom || undefined,
    postId: postId || undefined,
    text,
    isRead: false,
    createdAt: new Date(),
  });

  // Keep embedded notifications bounded.
  if (target.notifications.length > 200) {
    target.notifications = target.notifications.slice(0, 200);
  }

  await target.save();

  const unreadCount = (target.notifications || []).filter((n) => !n.isRead).length;
  emitToUser(normalizedTo, 'notification:new', {
    type,
    fromUsername: normalizedFrom || null,
    postId: postId || null,
    text,
    unreadCount,
  });
};

module.exports = {
  pushNotification,
  emitToUser,
};
