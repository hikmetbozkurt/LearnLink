import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../hooks/useAuth';
import '../styles/pages/shared.css';
import '../styles/pages/connections.css';
import { FaUserPlus, FaUserCheck, FaSearch, FaCheck, FaTimes, FaUserMinus } from 'react-icons/fa';
import { useToast } from '../components/ToastProvider';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/users/search/${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (targetUserId: number) => {
    try {
      setError(null);
      await api.post(`/api/users/friend-request/${targetUserId}`);
      showToast('Friend request sent successfully!', 'success');
      setSentRequests(prev => [...prev, targetUserId]);
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      const errorMessage = err.response?.data?.message || 'Failed to send friend request';
      showToast(errorMessage, 'error');
      setError(errorMessage);
    }
  };

  const acceptFriendRequest = async (requestId: number) => {
    try {
      setError(null);
      await api.put(`/api/users/friend-request/${requestId}/accept`);
      showToast('Friend request accepted!', 'success');
      // Refresh lists
      fetchFriendRequests();
      fetchFriends();
    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      const errorMessage = err.response?.data?.message || 'Failed to accept friend request';
      showToast(errorMessage, 'error');
      setError(errorMessage);
    }
  };

  const rejectFriendRequest = async (requestId: number) => {
    try {
      setError(null);
      await api.delete(`/api/users/friend-request/${requestId}`);
      showToast('Friend request rejected', 'success');
      // Refresh friend requests
      fetchFriendRequests();
    } catch (err: any) {
      console.error('Error rejecting friend request:', err);
      const errorMessage = err.response?.data?.message || 'Failed to reject friend request';
      showToast(errorMessage, 'error');
      setError(errorMessage);
    }
  };

  const removeFriend = async (friendId: number) => {
    try {
      setError(null);
      await api.delete(`/api/users/friends/${friendId}`);
      showToast('Friend removed successfully', 'success');
      // Refresh friends list
      fetchFriends();
    } catch (err: any) {
      console.error('Error removing friend:', err);
      const errorMessage = err.response?.data?.message || 'Failed to remove friend';
      showToast(errorMessage, 'error');
      setError(errorMessage);
    }
  };

  if (authLoading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <p>Loading...</p>
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

        {/* Search Section */}
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search users by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : <FaSearch />}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results</h3>
              {searchResults.map((result) => (
                <div key={result.id || result.user_id} className="user-card">
                  <div className="user-info">
                    <div className="user-details">
                      <h3>{result.name}</h3>
                      <p>{result.email}</p>
                      <small>{result.role}</small>
                    </div>
                  </div>
                  {sentRequests.includes(result.id || result.user_id!) ? (
                    <button className="request-sent-btn" disabled>
                      <FaCheck />
                      Request Sent
                    </button>
                  ) : (
                    <button
                      onClick={() => sendFriendRequest(result.id || result.user_id!)}
                      className="add-friend-btn"
                      disabled={loading}
                    >
                      <FaUserPlus />
                      Add Friend
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friend Requests Section */}
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
                      onClick={() => acceptFriendRequest(request.id)}
                      className="accept-friend-btn"
                      disabled={loading}
                    >
                      <FaUserCheck />
                      Accept
                    </button>
                    <button
                      onClick={() => rejectFriendRequest(request.id)}
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

        {/* Friends List Section */}
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
                  <button
                    onClick={() => removeFriend(friend.id || friend.user_id!)}
                    className="remove-friend-btn"
                    title="Remove friend"
                  >
                    <FaUserMinus />
                    Remove Friend
                  </button>
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