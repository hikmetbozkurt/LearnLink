import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../hooks/useAuth';
import '../styles/pages/shared.css';
import '../styles/pages/connections.css';
import { 
  FaUserPlus, 
  FaUserCheck, 
  FaSearch, 
  FaCheck, 
  FaTimes, 
  FaUserMinus, 
  FaEnvelope 
} from 'react-icons/fa';
import { useToast } from '../components/ToastProvider';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  user_id?: number;
  name: string;
  email: string;
  role: string;
}

interface FriendRequest {
  id: number;
  sender_id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const ConnectionsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const userId = user?.user_id || user?.id;

  useEffect(() => {
    if (userId) {
      fetchFriends();
      fetchFriendRequests();
      fetchSentRequests();
    }
  }, [userId]);

  const fetchSentRequests = async () => {
    try {
      const response = await api.get(`/api/users/friend-requests/sent/${userId}`);
      setSentRequests(response.data.map((request: any) => request.receiver_id));
    } catch (err) {
      console.error('Error fetching sent requests:', err);
    }
  };

  const fetchFriends = async () => {
    try {
      setError(null);
      const response = await api.get(`/api/users/friends/${userId}`);
      setFriends(response.data);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Failed to load friends');
    }
  };

  const fetchFriendRequests = async () => {
    try {
      setError(null);
      const response = await api.get(`/api/users/friend-requests/${userId}`);
      setFriendRequests(response.data);
    } catch (err) {
      console.error('Error fetching friend requests:', err);
      setError('Failed to load friend requests');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get(`/api/users/search/${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear results if input is empty
    if (!value.trim()) {
      setSearchResults([]);
    }
  };

  const handleFriendAction = async (action: string, targetId: number, requestId?: number) => {
    try {
      setError(null);
      switch (action) {
        case 'send':
          await api.post(`/api/users/friend-request/${targetId}`);
          setSentRequests(prev => [...prev, targetId]);
          break;
        case 'accept':
          await api.put(`/api/users/friend-request/${requestId}/accept`);
          fetchFriendRequests();
          fetchFriends();
          break;
        case 'reject':
          await api.delete(`/api/users/friend-request/${requestId}`);
          fetchFriendRequests();
          break;
        case 'remove':
          await api.delete(`/api/users/friends/${targetId}`);
          fetchFriends();
          break;
      }
    } catch (err: any) {
      console.error(`Error ${action}ing friend:`, err);
      const errorMessage = err.response?.data?.message || `Failed to ${action} friend`;
      showToast(errorMessage, 'error');
      setError(errorMessage);
    }
  };

  const handleSendMessage = async (userId: number, userName: string) => {
    try {
      const response = await api.post('/api/direct-messages', {
        recipientId: userId
      });
      
      navigate('/direct-messages', { 
        state: { 
          selectedChat: {
            id: String(response.data.id),
            name: userName
          }
        }
      });
    } catch (error) {
      console.error('Error creating direct message:', error);
      showToast('Failed to start conversation', 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="page-container">
        <div className="page-content">
        </div>
      </div>
    );
  }

  if (!user || !userId) {
    return (
      <div className="page-container">
        <div className="page-content">
          <p>Please log in to view connections.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-header">
          <h2 className="page-title">Connections</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search users by name..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : <FaSearch />}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results</h3>
              {searchResults.map((result) => {
                const isFriend = friends.some(friend => 
                  (friend.id || friend.user_id) === (result.id || result.user_id)
                );
                const isRequestSent = sentRequests.includes(result.id || result.user_id!);

                return (
                  <div key={result.id || result.user_id} className="user-card">
                    <div className="user-info">
                      <div className="user-details">
                        <h3>{result.name}</h3>
                        <p>{result.email}</p>
                        <small>{result.role}</small>
                      </div>
                    </div>
                    {isFriend ? (
                      <button className="already-friend-btn" disabled>
                        <FaUserCheck />
                        Friends
                      </button>
                    ) : isRequestSent ? (
                      <button className="request-sent-btn" disabled>
                        <FaCheck />
                        Request Sent
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFriendAction('send', result.id || result.user_id!)}
                        className="add-friend-btn"
                        disabled={loading}
                      >
                        <FaUserPlus />
                        Add Friend
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {friendRequests.length > 0 && (
          <div className="friend-requests-section">
            <h3>Friend Requests</h3>
            <div className="friend-requests-list">
              {friendRequests.map((request) => (
                <div key={request.id} className="user-card">
                  <div className="user-info">
                    <div className="user-details">
                      <h3>{request.name}</h3>
                      <p>{request.email}</p>
                      <small>{request.role}</small>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button
                      onClick={() => handleFriendAction('accept', request.sender_id, request.id)}
                      className="accept-friend-btn"
                      disabled={loading}
                    >
                      <FaUserCheck />
                      Accept
                    </button>
                    <button
                      onClick={() => handleFriendAction('reject', request.sender_id, request.id)}
                      className="reject-friend-btn"
                      disabled={loading}
                    >
                      <FaTimes />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="friends-section">
          <h3>My Friends</h3>
          <div className="friends-list">
            {friends.length === 0 ? (
              <p>You don't have any friends yet. Search for users to add them as friends!</p>
            ) : (
              friends.map((friend) => (
                <div key={friend.id || friend.user_id} className="user-card">
                  <div className="user-info">
                    <div className="user-details">
                      <h3>{friend.name}</h3>
                      <p>{friend.email}</p>
                      <small>{friend.role}</small>
                    </div>
                  </div>
                  <div className="user-actions">
                    <button
                      onClick={() => handleSendMessage(friend.id || friend.user_id!, friend.name)}
                      className="send-message-btn"
                    >
                      <FaEnvelope />
                      Send Message
                    </button>
                    <button
                      onClick={() => handleFriendAction('remove', friend.id || friend.user_id!)}
                      className="remove-friend-btn"
                    >
                      <FaUserMinus />
                      Remove Friend
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionsPage; 