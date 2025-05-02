import React, { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaTimes, FaEnvelope, FaUser } from 'react-icons/fa';
import api from '../../api/axiosConfig';
import { useAuth } from '../../hooks/useAuth';
import './ChatSidebar.css';

interface Friend {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_picture?: string;
}

interface ChatRoom {
  id: string;
  name: string;
  lastMessage?: string;
  createdAt?: string;
  created_by?: number;
  unreadCount?: number;
  type?: string;
  participants?: number[];
  other_user_id?: number;
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
  showNewDirectMessageButton?: boolean;
  onNewDirectMessage?: (userId: number) => void;
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
  currentUserId,
  showNewDirectMessageButton = false,
  onNewDirectMessage
}) => {
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  useEffect(() => {
    if (showFriendsModal) {
      fetchFriends();
    }
  }, [showFriendsModal]);

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      const userId = currentUserId || user?.user_id || user?.id;
      if (!userId) {
        console.error('User ID not available');
        setLoadingFriends(false);
        return;
      }
      
      const response = await api.get(`/api/users/friends/${userId}`);
      setFriends(response.data || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    setShowDeleteConfirm(roomId);
  };

  const handleConfirmDelete = (roomId: string) => {
    onDeleteRoom(roomId);
    setShowDeleteConfirm(null);
  };

  const handleSendMessage = async (friendId: number, friendName: string) => {
    try {
      const response = await api.post('/api/direct-messages', {
        recipientId: friendId
      });
      
      if (response.data && response.data.id) {
        onJoinRoom(String(response.data.id));
        setShowFriendsModal(false);
      }
    } catch (error) {
      console.error('Error creating direct message:', error);
    }
  };

  const filteredFriends = friends.filter(friend => 
    friend.name && friend.name.toLowerCase().includes(friendSearchQuery.toLowerCase())
  );

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

      <div className="chat-rooms">
        {rooms.map(room => (
          <div
            key={room.id}
            className={`chat-room ${selectedRoom === room.id ? 'selected' : ''}`}
            onClick={() => onJoinRoom(room.id)}
          >
            <div className="chat-room-info">
              <h3>{room.name}</h3>
              {room.lastMessage && <p>{room.lastMessage}</p>}
            </div>
            {room.unreadCount && room.unreadCount > 0 && (
              <div className="unread-badge">
                {room.unreadCount}
              </div>
            )}
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

      <div className="chat-sidebar-actions">
        {!hideCreateButton && (
          <button 
            className="create-room-button" 
            onClick={onCreateRoom}
            aria-label="Create new chat room"
          >
            <FaPlus />
          </button>
        )}
        
        {showNewDirectMessageButton && (
          <button 
            className="new-direct-message-button"
            onClick={() => setShowFriendsModal(true)}
            aria-label="Create new direct message"
          >
            <FaEnvelope />
          </button>
        )}
      </div>

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

      {showFriendsModal && (
        <div className="friends-modal">
          <div className="friends-modal-content">
            <div className="friends-modal-header">
              <h3>New Message</h3>
              <button 
                className="friends-modal-close-btn"
                onClick={() => setShowFriendsModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="friends-modal-search">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search friends..."
                value={friendSearchQuery}
                onChange={(e) => setFriendSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="friends-list">
              {loadingFriends ? (
                <div className="friends-loading">Loading friends...</div>
              ) : filteredFriends.length > 0 ? (
                filteredFriends.map(friend => (
                  <div 
                    key={friend.id} 
                    className="friend-item"
                  >
                    <div className="friend-info-container">
                      <div className="friend-avatar">
                        {friend.profile_picture ? (
                          <img src={friend.profile_picture} alt={friend.name} />
                        ) : (
                          <FaUser />
                        )}
                      </div>
                      <div className="friend-info">
                        <span className="friend-name">{friend.name}</span>
                        <span className="friend-email">{friend.email}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendMessage(friend.id, friend.name)}
                      className="send-message-btn"
                    >
                      <FaEnvelope />
                      Send Message
                    </button>
                  </div>
                ))
              ) : (
                <div className="friends-empty">Arkadaş bulunamadı</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar; 