import React, { useState } from 'react';
import { 
  FaSearch, 
  FaBell, 
  FaCog, 
  FaSignOutAlt,
  FaUser
} from 'react-icons/fa';
import './Header.css';

const Header = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
  };

  const handleLogout = () => {
    // Implement logout functionality
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="search-container">
          <form onSubmit={handleSearch}>
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Search courses and users"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">
                <FaSearch />
              </button>
            </div>
          </form>
        </div>

        <div className="header-actions">
          <div className="profile-avatar">
            <img src="/assets/images/avatar.jpg" alt="Profile" />
          </div>

          <div className="notification-icon" onClick={() => setShowNotifications(!showNotifications)}>
            <FaBell />
            <span className="notification-badge">3</span>
            {showNotifications && (
              <div className="dropdown-menu notifications">
                <div className="notification-item">
                  <span>New message from John</span>
                  <small>2 minutes ago</small>
                </div>
                {/* Add more notifications */}
              </div>
            )}
          </div>

          <div className="settings-icon" onClick={() => setShowSettings(!showSettings)}>
            <FaCog />
            {showSettings && (
              <div className="dropdown-menu settings">
                <div className="menu-item">
                  <FaUser />
                  <span>Profile</span>
                </div>
                <div className="menu-item">
                  <FaCog />
                  <span>Settings</span>
                </div>
                <div className="menu-item" onClick={handleLogout}>
                  <FaSignOutAlt />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 