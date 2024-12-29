import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import '../styles/pages/shared.css';
import '../styles/pages/connections.css';
import { FaUserPlus, FaUserCheck, FaSearch } from 'react-icons/fa';

interface User {
  id: number;
  user_id?: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture: string;
}

interface FriendRequest {
  id: number;
  sender_id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture: string;
  created_at: string;
}

const ConnectionsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.user_id || user?.id;

  useEffect(() => {
    if (userId) {
      fetchFriends();
      fetchFriendRequests();
    }
  }, [userId]);

  const fetchFriends = async () => {
    try {
      setError(null);
      const response = await axios.get(`/api/users/friends/${userId}`);
      setFriends(response.data);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Failed to load friends');
    }
  };

  const fetchFriendRequests = async () => {
    try {
      setError(null);
      const response = await axios.get(`/api/users/friend-requests/${userId}`);
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
      const response = await axios.get(`/api/users/search/${encodeURIComponent(searchQuery)}`);
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
      await axios.post(`/api/users/friend-request/${targetUserId}`);
      // Refresh search results to update UI
      handleSearch();
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      setError(err.response?.data?.message || 'Failed to send friend request');
    }
  };

  const acceptFriendRequest = async (requestId: number) => {
    try {
      setError(null);
      await axios.put(`/api/users/friend-request/${requestId}/accept`);
      // Refresh lists
      fetchFriendRequests();
      fetchFriends();
    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      setError(err.response?.data?.message || 'Failed to accept friend request');
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
              placeholder="Search users..."
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
              {searchResults.map((result) => (
                <div key={result.id || result.user_id} className="user-card">
                  <div className="user-info">
                    <img
                      src={result.profile_picture || '/default-avatar.png'}
                      alt={`${result.first_name} ${result.last_name}`}
                      className="user-avatar"
                    />
                    <div className="user-details">
                      <h3>{`${result.first_name} ${result.last_name}`}</h3>
                      <p>@{result.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => sendFriendRequest(result.id || result.user_id!)}
                    className="add-friend-btn"
                    disabled={loading}
                  >
                    <FaUserPlus />
                    Add Friend
                  </button>
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
                    <img
                      src={request.profile_picture || '/default-avatar.png'}
                      alt={`${request.first_name} ${request.last_name}`}
                      className="user-avatar"
                    />
                    <div className="user-details">
                      <h3>{`${request.first_name} ${request.last_name}`}</h3>
                      <p>@{request.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => acceptFriendRequest(request.id)}
                    className="accept-friend-btn"
                    disabled={loading}
                  >
                    <FaUserCheck />
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List Section */}
        <div className="friends-section">
          <h3>My Friends</h3>
          <div className="friends-list">
            {friends.map((friend) => (
              <div key={friend.id || friend.user_id} className="user-card">
                <div className="user-info">
                  <img
                    src={friend.profile_picture || '/default-avatar.png'}
                    alt={`${friend.first_name} ${friend.last_name}`}
                    className="user-avatar"
                  />
                  <div className="user-details">
                    <h3>{`${friend.first_name} ${friend.last_name}`}</h3>
                    <p>@{friend.username}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionsPage; 