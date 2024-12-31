import React, { useRef, useEffect } from 'react';
import { RiSendPlaneFill } from "react-icons/ri";
import { FaPaperclip, FaEllipsisV } from "react-icons/fa";
import api from '../../api/axiosConfig';
import './ChatArea.css';

interface Message {
  id: number;
  content: string;
  sender_id: number;
  sender_name: string;
  created_at: string;
}

interface ChatAreaProps {
  messages: Message[];
  currentUserId: number;
  roomName?: string;
  newMessage: string;
  onNewMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  formatMessageTime: (timestamp: string) => string;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  currentUserId,
  roomName,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  formatMessageTime
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileClick = async () => {
    try {
      // File sharing functionality will be implemented later
      await api.post('/api/notifications', {
        recipient_id: currentUserId,
        content: 'File sharing will be available soon',
        type: 'info'
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  return (
    <div className="chat-area">
      <div className="chat-header">
        <h2>{roomName}</h2>
        <button className="menu-button">
          <FaEllipsisV />
        </button>
      </div>
      
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.map((message, index) => {
          const isSelf = message.sender_id === currentUserId;
          
          return (
            <div
              key={message.id || index}
              className={`message ${isSelf ? 'message-self' : 'message-other'}`}
            >
              <div className="message-sender">
                {isSelf ? 'You' : message.sender_name}
              </div>
              <div className="message-content">
                {message.content}
              </div>
              <div className="message-timestamp">
                {formatMessageTime(message.created_at)}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} className="scroll-anchor" />
      </div>

      <div className="chat-input-area">
        <form onSubmit={(e) => {
          e.preventDefault();
          onSendMessage();
        }}>
          <button 
            type="button" 
            className="file-button"
            onClick={handleFileClick}
          >
            <FaPaperclip />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={onNewMessageChange}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!newMessage.trim()}
          >
            <RiSendPlaneFill />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea; 