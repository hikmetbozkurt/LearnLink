import React from 'react';
import { FaSearch, FaPlus, FaTimes } from 'react-icons/fa';
import './ChatSidebar.css';

interface ChatRoom {
  id: string;
  name: string;
  lastMessage?: string;
  createdAt?: string;
}

interface ChatSidebarProps {
  rooms: ChatRoom[];
  selectedRoom?: string;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: () => void;
  onDeleteRoom: (roomId: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  rooms,
  selectedRoom,
  searchQuery,
  onSearchChange,
  onJoinRoom,
  onCreateRoom,
  onDeleteRoom
}) => {
  return (
    <div className="chat-sidebar">
      <div className="chat-sidebar-header">
        <h2>Chat Rooms</h2>
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>
      </div>

      <div className="chat-rooms-list">
        {rooms.map(room => (
          <div
            key={room.id}
            className={`chat-room-item ${selectedRoom === room.id ? 'active' : ''}`}
            onClick={() => onJoinRoom(room.id)}
          >
            <div className="chat-room-info">
              <h3>{room.name}</h3>
              <p>{room.lastMessage}</p>
            </div>
            <span className="timestamp">{room.createdAt}</span>
            <button 
              className="delete-room-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRoom(room.id);
              }}
            >
              <FaTimes />
            </button>
          </div>
        ))}
      </div>

      <div 
        className="create-room-button" 
        onClick={onCreateRoom}
        role="button"
        tabIndex={0}
      >
        <FaPlus />
      </div>
    </div>
  );
};

export default ChatSidebar; 