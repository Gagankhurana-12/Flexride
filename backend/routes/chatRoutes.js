const express = require('express');
const {
  getConversations,
  getMessages,
  getConversationByVehicleAndUser,
  getUnreadCount
} = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all conversations for the current user
router.get('/conversations', getConversations);

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', getMessages);

// Get unread message count
router.get('/unread-count', getUnreadCount);

// Get conversation by vehicle and user
router.get('/conversations/vehicle/:vehicleId/user/:userId', getConversationByVehicleAndUser);

module.exports = router; 