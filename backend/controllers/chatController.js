const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// @desc    Get all conversations for a user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId
    })
    .populate([
      {
        path: 'participants',
        select: 'name avatar'
      },
      {
        path: 'vehicle',
        select: 'name imageUrl category'
      },
      {
        path: 'lastMessage',
        select: 'content messageType createdAt'
      }
    ])
    .sort({ lastMessageAt: -1 });

    // Filter out conversations where participants don't exist
    const validConversations = conversations.filter(conv => 
      conv.participants.length > 0 && conv.participants.every(p => p !== null)
    );

    res.json(validConversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

// @desc    Get messages for a specific conversation
// @route   GET /api/chat/conversations/:conversationId/messages
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: { $in: conversation.participants.filter(p => p.toString() !== userId.toString()) } },
        { receiver: userId, sender: { $in: conversation.participants.filter(p => p.toString() !== userId.toString()) } }
      ],
      vehicle: conversation.vehicle
    })
    .populate([
      { path: 'sender', select: 'name avatar' },
      { path: 'receiver', select: 'name avatar' }
    ])
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// @desc    Get conversation by vehicle and other user
// @route   GET /api/chat/conversations/vehicle/:vehicleId/user/:userId
// @access  Private
const getConversationByVehicleAndUser = async (req, res) => {
  try {
    const { vehicleId, userId } = req.params;
    const currentUserId = req.user._id;

    // Verify the other user exists and is the vehicle owner
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || vehicle.user.toString() !== userId) {
      return res.status(404).json({ message: 'Vehicle or user not found' });
    }

    // Find conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, userId] },
      vehicle: vehicleId
    })
    .populate([
      {
        path: 'participants',
        select: 'name avatar'
      },
      {
        path: 'vehicle',
        select: 'name imageUrl category'
      },
      {
        path: 'lastMessage',
        select: 'content messageType createdAt'
      }
    ]);

    // If no conversation exists, create a placeholder response
    if (!conversation) {
      const otherUser = await User.findById(userId).select('name avatar');
      const currentUser = await User.findById(currentUserId).select('name avatar');
      return res.json({
        _id: null,
        participants: [currentUser, otherUser],
        vehicle: vehicle,
        lastMessage: null,
        lastMessageAt: null,
        unreadCount: new Map(),
        isNew: true
      });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Error fetching conversation', error: error.message });
  }
};

// @desc    Get unread message count
// @route   GET /api/chat/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      const unread = conv.unreadCount.get(userId.toString()) || 0;
      totalUnread += unread;
    });

    res.json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
};

module.exports = {
  getConversations,
  getMessages,
  getConversationByVehicleAndUser,
  getUnreadCount
}; 