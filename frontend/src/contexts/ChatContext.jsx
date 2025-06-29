import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const ChatContext = createContext();

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function ChatProvider({ children }) {
  const { user, token } = useAuth();
  const { addNotification } = useNotification();
  
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  const socketRef = useRef(null);
  const currentConversationRef = useRef(null);
  const isChatOpenRef = useRef(false);
  const isConnectingRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  // Initialize socket connection
  useEffect(() => {
    if (token && user && !socketRef.current && !isConnectingRef.current) {
      isConnectingRef.current = true;
      
      const newSocket = io(BACKEND_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        setSocket(newSocket);
        socketRef.current = newSocket;
        isConnectingRef.current = false;
        
        // Notify server that user is online
        newSocket.emit('user_online');
      });

      newSocket.on('disconnect', () => {
        setSocket(null);
        socketRef.current = null;
        isConnectingRef.current = false;
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        isConnectingRef.current = false;
        addNotification('Chat connection failed', 'error');
      });

      // Listen for new messages
      newSocket.on('new_message', ({ message, conversationId }) => {
        // Add message to current conversation if it matches
        if (currentConversationRef.current) {
          // Check if this is the current conversation by comparing vehicle and participants
          const isCurrentConversation = 
            currentConversationRef.current._id === conversationId ||
            (currentConversationRef.current.vehicle._id === message.vehicle._id &&
             currentConversationRef.current.participants.some(p => p._id === message.sender._id) &&
             currentConversationRef.current.participants.some(p => p._id === message.receiver._id)) ||
            // Additional check for when user is the receiver
            (currentConversationRef.current.vehicle._id === message.vehicle._id &&
             message.receiver._id === user._id &&
             currentConversationRef.current.participants.some(p => p._id === message.sender._id));
          
          if (isCurrentConversation) {
            setMessages(prev => [...prev, message]);
            
            // If user is actively viewing this conversation, mark as read immediately
            if (isChatOpenRef.current) {
              newSocket.emit('mark_as_read', { conversationId });
            }
          }
        }
        
        // Update conversations list
        updateConversationWithMessage(conversationId, message);
        
        // Update unread count
        fetchUnreadCount();
        
        // Show notification if chat is not open
        if (!isChatOpenRef.current) {
          addNotification(`New message from ${message.sender.name}`, 'info');
        }
      });

      // Listen for message sent confirmation
      newSocket.on('message_sent', ({ message, conversationId }) => {
        // Add message to current conversation if it matches
        if (currentConversationRef.current) {
          // Check if this is the current conversation by comparing vehicle and participants
          const isCurrentConversation = 
            currentConversationRef.current._id === conversationId ||
            (currentConversationRef.current.vehicle._id === message.vehicle._id &&
             currentConversationRef.current.participants.some(p => p._id === message.sender._id) &&
             currentConversationRef.current.participants.some(p => p._id === message.receiver._id));
          
          if (isCurrentConversation) {
            setMessages(prev => [...prev, message]);
            
            // Update current conversation with the new conversation data if it's a new conversation
            if (!currentConversationRef.current._id && conversationId) {
              setCurrentConversation(prev => ({
                ...prev,
                _id: conversationId
              }));
            }
          }
        }
        
        // Update conversations list
        updateConversationWithMessage(conversationId, message);
      });

      // Listen for conversation updates
      newSocket.on('conversation_updated', (conversation) => {
        setConversations(prev => {
          const index = prev.findIndex(c => c._id === conversation._id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = conversation;
            return updated;
          } else {
            return [conversation, ...prev];
          }
        });
      });

      // Listen for typing indicators
      newSocket.on('user_typing', ({ userId, userName, vehicleId }) => {
        setTypingUsers(prev => new Set([...prev, userId]));
      });

      newSocket.on('user_stopped_typing', ({ userId }) => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      // Listen for read receipts
      newSocket.on('messages_read', ({ conversationId, readBy }) => {
        // Update message read status in current conversation
        if (currentConversationRef.current && currentConversationRef.current._id === conversationId) {
          setMessages(prev => prev.map(msg => 
            msg.receiver._id === readBy && !msg.isRead 
              ? { ...msg, isRead: true, readAt: new Date() }
              : msg
          ));
        }
      });

      // Listen for messages marked as read confirmation
      newSocket.on('messages_marked_read', ({ conversationId }) => {
        // Update unread count when messages are marked as read
        fetchUnreadCount();
        
        // Update the conversation's unread count in the conversations list
        setConversations(prev => {
          const index = prev.findIndex(c => c._id === conversationId);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              unreadCount: {
                ...updated[index].unreadCount,
                [user._id]: 0
              }
            };
            return updated;
          }
          return prev;
        });
      });

      // Listen for user status changes
      newSocket.on('user_status_change', ({ userId, status }) => {
        if (status === 'online') {
          setOnlineUsers(prev => new Set([...prev, userId]));
        } else {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      });

      // Listen for errors
      newSocket.on('error', ({ message }) => {
        addNotification(message, 'error');
      });

      return () => {
        if (newSocket) {
          newSocket.disconnect();
          socketRef.current = null;
          isConnectingRef.current = false;
        }
      };
    }
  }, [token, user, addNotification]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        isConnectingRef.current = false;
      }
    };
  }, []);

  // Update conversation with new message
  const updateConversationWithMessage = useCallback((conversationId, message) => {
    setConversations(prev => {
      const index = prev.findIndex(c => c._id === conversationId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          lastMessage: message,
          lastMessageAt: message.createdAt
        };
        return updated;
      }
      return prev;
    });
  }, []);

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch conversations');
      
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      addNotification('Failed to load conversations', 'error');
    }
  }, [token, addNotification]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId) => {
    if (!token || !conversationId) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data);
      
      // Mark messages as read via socket
      if (socket) {
        socket.emit('mark_as_read', { conversationId });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      addNotification('Failed to load messages', 'error');
    }
  }, [token, socket, addNotification]);

  // Send a message via socket
  const sendMessage = useCallback(async (receiverId, vehicleId, content) => {
    if (!socket) {
      addNotification('Chat connection not available', 'error');
      return;
    }
    
    try {
      socket.emit('send_message', {
        receiverId,
        vehicleId,
        content,
        messageType: 'text'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      addNotification('Failed to send message', 'error');
      throw error;
    }
  }, [socket, addNotification]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch unread count');
      
      const data = await response.json();
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [token]);

  // Get or create conversation by vehicle and user
  const getConversationByVehicleAndUser = useCallback(async (vehicleId, userId) => {
    if (!token) return null;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/conversations/vehicle/${vehicleId}/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch conversation');
      
      const conversation = await response.json();
      return conversation;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      addNotification('Failed to load conversation', 'error');
      return null;
    }
  }, [token, addNotification]);

  // Open chat with vehicle owner
  const openChatWithOwner = useCallback(async (vehicleId, ownerId) => {
    setIsLoading(true);
    try {
      // Fetch conversations to make sure we have the latest data
      await fetchConversations();
      
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => 
        conv.vehicle._id === vehicleId && 
        conv.participants.some(p => p._id === ownerId)
      );
      
      if (existingConversation) {
        // If conversation exists, open it directly
        setCurrentConversation(existingConversation);
        if (existingConversation._id) {
          await fetchMessages(existingConversation._id);
        } else {
          setMessages([]);
        }
        setIsChatOpen(true);
      } else {
        // If no conversation exists, create a new one and open it
        const newConversation = await getConversationByVehicleAndUser(vehicleId, ownerId);
        if (newConversation) {
          setCurrentConversation(newConversation);
          if (newConversation._id) {
            await fetchMessages(newConversation._id);
          } else {
            setMessages([]);
          }
          setIsChatOpen(true);
        }
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      addNotification('Failed to open chat', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [conversations, fetchConversations, fetchMessages, getConversationByVehicleAndUser, addNotification]);

  // Close chat
  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    setCurrentConversation(null);
    setMessages([]);
    setTypingUsers(new Set());
  }, []);

  // Select conversation
  const selectConversation = useCallback(async (conversation) => {
    setCurrentConversation(conversation);
    if (conversation._id) {
      await fetchMessages(conversation._id);
    } else {
      setMessages([]);
    }
    setIsChatOpen(true);
  }, [fetchMessages]);

  // Reset current conversation (go back to conversations list)
  const resetCurrentConversation = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
    setTypingUsers(new Set());
  }, []);

  // Send typing indicators
  const sendTypingIndicator = useCallback((receiverId, vehicleId, isTyping) => {
    if (!socket) return;
    
    if (isTyping) {
      socket.emit('typing_start', { receiverId, vehicleId });
    } else {
      socket.emit('typing_stop', { receiverId, vehicleId });
    }
  }, [socket]);

  // Initial load
  useEffect(() => {
    if (token) {
      fetchConversations();
      fetchUnreadCount();
    }
  }, [token, fetchConversations, fetchUnreadCount]);

  const value = {
    socket,
    conversations,
    currentConversation,
    messages,
    unreadCount,
    isLoading,
    isChatOpen,
    setIsChatOpen,
    typingUsers,
    onlineUsers,
    sendMessage,
    openChatWithOwner,
    closeChat,
    selectConversation,
    resetCurrentConversation,
    fetchConversations,
    fetchMessages,
    sendTypingIndicator
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 