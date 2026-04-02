const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  startConversation,
  getMessageContacts,
} = require('../controllers/messageController');

const optionalImageUpload = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return upload.single('image')(req, res, next);
  }
  return next();
};

// All routes require authentication
router.use(protect);

router.get('/conversations', getConversations);
router.get('/contacts', getMessageContacts);
router.get('/start/:username', startConversation);
router.get('/:conversationId', getMessages);
router.post('/send', optionalImageUpload, sendMessage);
router.post('/:conversationId/read', markAsRead);

module.exports = router;
