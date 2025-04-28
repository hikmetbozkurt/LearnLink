import React, { useState } from 'react';
import { FaSearch, FaPlus, FaTimes } from 'react-icons/fa';
import './ChatSidebar.css';

interface ChatRoom {
  id: string;
  name: string;
  lastMessage?: string;
  createdAt?: string;
  created_by?: number;
}

interface ChatSidebarProps {
  rooms: ChatRoom[];
  selectedRoom?: string;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: () => void;
  onDeleteRoom: (roomId: string) => void;
  hideCreateButton?: boolean;
  title?: string;
  searchPlaceholder?: string;
  currentUserId?: number;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  rooms,
  selectedRoom,
  searchQuery,
  onSearchChange,
  onJoinRoom,
  onCreateRoom,
  onDeleteRoom,
  hideCreateButton = false,
  title = 'Chat Rooms',
  searchPlaceholder = 'Search rooms...',
  currentUserId
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    setShowDeleteConfirm(roomId);
  };

  const handleConfirmDelete = (roomId: string) => {
    onDeleteRoom(roomId);
    setShowDeleteConfirm(null);
  };

  return (
    <div className="chat-sidebar">
      <div className="chat-sidebar-header">
        <h2>{title}</h2>
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder={searchPlaceholder}
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
            {currentUserId && room.created_by === currentUserId && (
              <button 
                className="delete-room-btn"
                onClick={(e) => handleDeleteClick(e, room.id)}
              >
                <FaTimes />
              </button>
            )}
          </div>
        ))}
      </div>

      {!hideCreateButton && (
        <div 
          className="create-room-button" 
          onClick={onCreateRoom}
          role="button"
          tabIndex={0}
        >
          <FaPlus />
        </div>
      )}

      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="modal-content">
            <h3>Delete Chat Room</h3>
            <p>Are you sure you want to delete this chat room? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                className="delete-btn"
                onClick={() => handleConfirmDelete(showDeleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar; 