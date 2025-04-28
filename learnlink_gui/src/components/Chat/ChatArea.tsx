import React, { useRef, useEffect, useState } from "react";
import { RiSendPlaneFill } from "react-icons/ri";
import { FaSmile } from "react-icons/fa";
import api from "../../api/axiosConfig";
import "./ChatArea.css";

interface Message {
  id: number;
  content: string;
  sender_id: number;
  sender_name: string;
  created_at: string;
  chatroom_id?: number;
  direct_message_id?: number;
}

interface ChatAreaProps {
  messages: Message[];
  currentUserId: number;
  roomName?: string;
  newMessage: string;
  onNewMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  formatMessageTime: (timestamp: string) => string;
  type?: "chatroom" | "direct";
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  currentUserId,
  roomName,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  formatMessageTime,
  type = "chatroom",
  messagesEndRef,
  messagesContainerRef,
  onScroll,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Common emojis for quick access
  const commonEmojis = ["😊", "😂", "❤️", "👍", "🎉", "🔥", "👋", "🙏", "🤔", "😍"];

  const handleEmojiClick = (emoji: string) => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart || 0;
      const end = inputRef.current.selectionEnd || 0;
      const text = newMessage;
      const before = text.substring(0, start);
      const after = text.substring(end);
      
      // Update the input value with the emoji inserted at cursor position
      const newText = before + emoji + after;
      const event = {
        target: { value: newText }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onNewMessageChange(event);
      
      // Set cursor position after the emoji
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(start + emoji.length, start + emoji.length);
        }
      }, 0);
    }
    
    setShowEmojiPicker(false);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const shouldShowTimestamp = (
    currentMsg: Message,
    nextMsg: Message | undefined
  ) => {
    if (!nextMsg) return true; // Always show for last message

    const currentTime = formatMessageTime(currentMsg.created_at);
    const nextTime = formatMessageTime(nextMsg.created_at);

    return (
      currentTime !== nextTime || currentMsg.sender_id !== nextMsg.sender_id
    );
  };

  return (
    <div className="chat-area">
      <div className="chat-header">
        <h2>{roomName}</h2>
      </div>

      <div
        className="messages-container"
        ref={messagesContainerRef as React.LegacyRef<HTMLDivElement>}
        onScroll={onScroll}
      >
        {messages.map((message, index) => {
          const isSelf = message.sender_id === currentUserId;
          const nextMessage = messages[index + 1];
          const showTimestamp = shouldShowTimestamp(message, nextMessage);

          return (
            <div
              key={message.id || index}
              className={`message ${isSelf ? "message-self" : "message-other"}`}
            >
              <div className="message-content">
                <div className="message-sender">
                  {isSelf ? "You" : message.sender_name}
                </div>
                <div className="message-text">{message.content}</div>
                {showTimestamp && (
                  <div className="message-timestamp">
                    {formatMessageTime(message.created_at)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div
          ref={messagesEndRef as React.LegacyRef<HTMLDivElement>}
          className="scroll-anchor"
        />
      </div>

      <div className="chat-input-area">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSendMessage();
          }}
        >
          <div className="emoji-button-container">
            <button
              type="button"
              className="emoji-button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <FaSmile />
            </button>
            {showEmojiPicker && (
              <div className="emoji-picker" ref={emojiPickerRef}>
                {commonEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    className="emoji-item"
                    onClick={() => handleEmojiClick(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            ref={inputRef}
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
