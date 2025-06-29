const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Vehicle = require('../models/Vehicle');

// Store connected users
const connectedUsers = new Map();

const socketHandler = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    // Add user to connected users map
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user
    });

    // Join user to their personal room
    socket.join(socket.userId);

    // Handle sending a message
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, vehicleId, content, messageType = 'text' } = data;
        
        // Validate input
        if (!receiverId || !vehicleId || !content) {
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }

        // Check if vehicle exists
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
          socket.emit('error', { message: 'Vehicle not found' });
          return;
        }

        // Prevent sending message to yourself
        if (socket.userId === receiverId) {
          socket.emit('error', { message: 'Cannot send message to yourself' });
          return;
        }

        // Validate that the sender is either the vehicle owner or a participant in an existing conversation
        const isVehicleOwner = vehicle.user.toString() === socket.userId;
        const isReceiverVehicleOwner = vehicle.user.toString() === receiverId;
        
        // Check if there's an existing conversation between these users for this vehicle
        const existingConversation = await Conversation.findOne({
          participants: { $all: [socket.userId, receiverId] },
          vehicle: vehicleId
        });

        // Allow message if:
        // 1. Sender is vehicle owner and receiver is not the vehicle owner (owner messaging renter)
        // 2. Receiver is vehicle owner and sender is not the vehicle owner (renter messaging owner)
        // 3. There's an existing conversation between these users for this vehicle
        const isValidSender = isVehicleOwner || isReceiverVehicleOwner || existingConversation;
        
        if (!isValidSender) {
          socket.emit('error', { message: 'You can only message the vehicle owner or participants in existing conversations' });
          return;
        }

        // Find or create conversation
        let conversation = existingConversation;
        if (!conversation) {
          conversation = new Conversation({
            participants: [socket.userId, receiverId],
            vehicle: vehicleId,
            unreadCount: new Map([[receiverId, 1]])
          });
        } else {
          // Increment unread count for receiver
          const currentCount = conversation.unreadCount.get(receiverId) || 0;
          conversation.unreadCount.set(receiverId, currentCount + 1);
        }

        // Create and save message
        const message = new Message({
          sender: socket.userId,
          receiver: receiverId,
          vehicle: vehicleId,
          content,
          messageType
        });

        await message.save();

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // Populate message with user details
        await message.populate([
          { path: 'sender', select: 'name avatar' },
          { path: 'receiver', select: 'name avatar' },
          { path: 'vehicle', select: 'name imageUrl' }
        ]);

        // Emit message to sender (confirmation)
        socket.emit('message_sent', {
          message,
          conversationId: conversation._id
        });

        // Emit message to receiver (real-time delivery)
        const receiverSocketId = connectedUsers.get(receiverId)?.socketId;
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new_message', {
            message,
            conversationId: conversation._id
          });
        }

        // Emit conversation update to both users
        const conversationData = await conversation.populate([
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

        // Emit to sender
        socket.emit('conversation_updated', conversationData);

        // Emit to receiver if online
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('conversation_updated', conversationData);
        }

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Handle marking messages as read
    socket.on('mark_as_read', async (data) => {
      try {
        const { conversationId } = data;
        
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(socket.userId)) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Mark unread messages as read
        await Message.updateMany(
          {
            receiver: socket.userId,
            sender: { $in: conversation.participants.filter(p => p.toString() !== socket.userId) },
            vehicle: conversation.vehicle,
            isRead: false
          },
          {
            isRead: true,
            readAt: new Date()
          }
        );

        // Reset unread count for this user
        conversation.unreadCount.set(socket.userId, 0);
        await conversation.save();

        // Notify sender that messages were read
        const otherParticipants = conversation.participants.filter(p => p.toString() !== socket.userId);
        otherParticipants.forEach(participantId => {
          const participantSocketId = connectedUsers.get(participantId)?.socketId;
          if (participantSocketId) {
            io.to(participantSocketId).emit('messages_read', {
              conversationId,
              readBy: socket.userId
            });
          }
        });

        socket.emit('messages_marked_read', { conversationId });

      } catch (error) {
        console.error('Mark as read error:', error);
        socket.emit('error', { message: 'Error marking messages as read' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { receiverId, vehicleId } = data;
      const receiverSocketId = connectedUsers.get(receiverId)?.socketId;
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', {
          userId: socket.userId,
          userName: socket.user.name,
          vehicleId
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { receiverId, vehicleId } = data;
      const receiverSocketId = connectedUsers.get(receiverId)?.socketId;
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_stopped_typing', {
          userId: socket.userId,
          vehicleId
        });
      }
    });

    // Handle user going online/offline
    socket.on('user_online', () => {
      // Notify other users that this user is online
      socket.broadcast.emit('user_status_change', {
        userId: socket.userId,
        status: 'online'
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Remove user from connected users map
      connectedUsers.delete(socket.userId);
      
      // Notify other users that this user is offline
      socket.broadcast.emit('user_status_change', {
        userId: socket.userId,
        status: 'offline'
      });
    });
  });
};

module.exports = socketHandler; 