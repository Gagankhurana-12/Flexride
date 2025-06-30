import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, ChevronLeft, Check, CheckCheck } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const Chat = () => {
  const {
    conversations,
    currentConversation,
    messages,
    unreadCount,
    isChatOpen,
    closeChat,
    selectConversation,
    resetCurrentConversation,
    sendMessage,
    typingUsers,
    onlineUsers,
    sendTypingIndicator
  } = useChat();
  
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [showConversations, setShowConversations] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentConversation) {
      setShowConversations(false);
    } else {
      setShowConversations(true);
    }
  }, [currentConversation]);

  // Handle typing indicators
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping && currentConversation && user) {
      // Find the receiver (the other participant in the conversation)
      const receiverId = currentConversation.participants.find(
        participant => participant._id !== user._id
      )?._id;
      
      const vehicleId = currentConversation.vehicle._id;
      
      if (receiverId) {
        sendTypingIndicator(receiverId, vehicleId, true);

        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          sendTypingIndicator(receiverId, vehicleId, false);
        }, 2000);
      }
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, currentConversation, sendTypingIndicator, user?._id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !currentConversation || !user) return;

    try {
      // Find the receiver (the other participant in the conversation)
      const receiverId = currentConversation.participants.find(
        participant => participant._id !== user._id
      )?._id;
      
      const vehicleId = currentConversation.vehicle._id;

      if (!receiverId) {
        console.error('Could not determine receiver');
        return;
      }
      
      // Clear typing indicator immediately when sending
      setIsTyping(false);
      sendTypingIndicator(receiverId, vehicleId, false);
      
      await sendMessage(receiverId, vehicleId, messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setMessageText(newValue);
    
    // Only set typing to true if there's actually text and we're not already typing
    if (newValue.trim() && !isTyping) {
      setIsTyping(true);
    } else if (!newValue.trim() && isTyping) {
      // Clear typing if input is empty
      setIsTyping(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    selectConversation(conversation);
  };

  const handleBackToConversations = () => {
    resetCurrentConversation();
  };

  const formatTime = (date) => {
    return format(new Date(date), 'HH:mm');
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMM dd');
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  if (!isChatOpen || !user) return null;

  return (
    <AnimatePresence>
      {/* Full-screen transparent overlay to catch all outside clicks */}
      <>
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'transparent' }}
          onClick={closeChat}
          aria-label="Close chat"
        />
        {/* Side Drawer Chat Window */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-800 rounded-l-lg shadow-xl border-l border-gray-200 dark:border-gray-700 flex flex-col z-50"
          onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-500 text-white rounded-tl-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-semibold">
                {showConversations ? 'Messages' : 'Chat'}
              </h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={closeChat}
              className="text-white hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Content */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {showConversations ? (
              /* Conversations List */
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-12 h-12 mb-2" />
                    <p>No conversations yet</p>
                    <p className="text-sm">Start chatting with vehicle owners!</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {conversations.map((conversation) => {
                      // Find the other participant (not the current user)
                      const otherUser = user ? conversation.participants.find(
                        participant => participant._id !== user._id
                      ) : null;
                      
                      if (!otherUser) {
                        console.warn('No other user found in conversation:', conversation);
                        return null;
                      }
                      
                      const unread = user ? (
                        conversation.unreadCount instanceof Map 
                          ? (conversation.unreadCount.get(user._id) || 0)
                          : (conversation.unreadCount?.[user._id] || 0)
                      ) : 0;
                      const isOnline = isUserOnline(otherUser._id);
                      
                      return (
                        <div
                          key={conversation._id || `${conversation.vehicle._id}-${otherUser._id}`}
                          onClick={() => handleConversationSelect(conversation)}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                          <div className="relative">
                            <img
                              src={otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.name}&background=random`}
                              alt={otherUser.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            {isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {otherUser.name}
                              </h4>
                              {conversation.lastMessageAt && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTime(conversation.lastMessageAt)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                              {conversation.vehicle.name}
                            </p>
                            {conversation.lastMessage && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {conversation.lastMessage.content}
                              </p>
                            )}
                          </div>
                          {unread > 0 && (
                            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                              {unread}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Chat Messages */
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <button
                    onClick={handleBackToConversations}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    {currentConversation && (() => {
                      const otherUser = currentConversation.participants.find(
                        participant => participant._id !== user._id
                      );
                      return (
                        <>
                          <img
                            src={otherUser?.avatar || `https://ui-avatars.com/api/?name=${otherUser?.name}&background=random`}
                            alt={otherUser?.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          {isUserOnline(otherUser?._id) && (
                            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-700 rounded-full"></div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex-1">
                    {currentConversation && (() => {
                      const otherUser = currentConversation.participants.find(
                        participant => participant._id !== user._id
                      );
                      return (
                        <>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {otherUser?.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {currentConversation.vehicle.name}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-gray-900">
                  {!currentConversation ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <MessageCircle className="w-8 h-8 mb-2" />
                      <p className="text-sm">Select a conversation</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <MessageCircle className="w-8 h-8 mb-2" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const isOwnMessage = message.sender._id.toString() === user._id.toString();
                      const showDate = index === 0 || 
                        formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);

                      return (
                        <div key={message._id}>
                          {showDate && (
                            <div className="text-center text-xs text-gray-500 dark:text-gray-400 my-2">
                              {formatDate(message.createdAt)}
                            </div>
                          )}
                          <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[70%] px-3 py-2 rounded-lg ${
                                isOwnMessage
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1 ${
                                isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                <span className="text-xs">{formatTime(message.createdAt)}</span>
                                {isOwnMessage && (
                                  <span className="text-xs">
                                    {message.isRead ? (
                                      <CheckCheck className="w-3 h-3" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {/* Typing Indicator */}
                  {currentConversation && (() => {
                    const otherUser = currentConversation.participants.find(
                      participant => participant._id !== user._id
                    );
                    return typingUsers.has(otherUser?._id) && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg shadow-sm">
                          <div className="flex items-center gap-1">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">typing...</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={messageText}
                      onChange={handleInputChange}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
};

export default Chat; 