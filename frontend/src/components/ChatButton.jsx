import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const ChatButton = ({ vehicle, className = '' }) => {
  const { openChatWithOwner, isLoading } = useChat();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const handleChatClick = async () => {
    if (!user) {
      addNotification('Please login to chat with the owner', 'warning');
      return;
    }

    // Prevent owner from chatting with themselves
    if (vehicle.user && user._id === vehicle.user._id) {
      addNotification('You cannot chat with yourself', 'error');
      return;
    }

    try {
      await openChatWithOwner(vehicle._id, vehicle.user._id);
    } catch (error) {
      console.error('Error opening chat:', error);
    }
  };

  return (
    <button
      onClick={handleChatClick}
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <MessageCircle className="w-4 h-4" />
      <span>{isLoading ? 'Opening...' : 'Chat with Owner'}</span>
    </button>
  );
};

export default ChatButton; 