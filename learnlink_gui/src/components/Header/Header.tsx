import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaCog, 
  FaSignOutAlt,
  FaUser
} from 'react-icons/fa';
import NotificationBell from '../NotificationBell';
import ProfileCard from '../Profile/ProfileCard';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';
import defaultAvatar from '../../assets/images/default-avatar.png';
import { authService } from '../../services/authService';

type DropdownType = 'settings' | 'notifications' | null;

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileCard, setShowProfileCard] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownClick = (dropdownType: DropdownType) => {
    setActiveDropdown(activeDropdown === dropdownType ? null : dropdownType);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
  };

  const handleLogout = () => {
    try {
      authService.logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderDropdownContent = (type: DropdownType) => {
    switch (type) {
      case 'settings':
        return (
          <div className="dropdown-menu settings">
            <div className="dropdown-header">Settings</div>
            <div className="menu-item">
              <FaCog />
              <span>Settings</span>
            </div>
            <div className="menu-item" onClick={handleLogout}>
              <FaSignOutAlt />
              <span>Logout</span>
            </div>
          </div>
        );
      default:
        return null;
    }
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

        <div className="header-actions" ref={dropdownRef}>
          <div className="profile-avatar" onClick={() => setShowProfileCard(true)}>
            <img src={defaultAvatar} alt="Profile" />
          </div>

          <NotificationBell 
            ref={notificationRef} 
            isOpen={activeDropdown === 'notifications'}
            onToggle={() => handleDropdownClick('notifications')}
          />

          <div 
            className={`settings-icon ${activeDropdown === 'settings' ? 'active' : ''}`}
            onClick={() => handleDropdownClick('settings')}
          >
            <FaCog />
            {activeDropdown === 'settings' && renderDropdownContent('settings')}
          </div>
        </div>
      </div>

      {showProfileCard && user && (
        <ProfileCard 
          user={user}
          onClose={() => setShowProfileCard(false)} 
        />
      )}
    </header>
  );
};

export default Header; 