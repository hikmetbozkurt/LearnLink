import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaCog, 
  FaSignOutAlt,
  FaUser
} from 'react-icons/fa';
import NotificationBell, { NotificationBellRef } from '../NotificationBell';
import EventsDropdown from '../EventsDropdown';
import ProfileCard from '../Profile/ProfileCard';
import SettingsModal from '../Settings/SettingsModal';
import { useAuth } from '../../hooks/useAuth';
import { useEvent } from '../../contexts/EventContext';
import './Header.css';
import defaultAvatar from '../../assets/images/default-avatar.png';
import { authService } from '../../services/authService';

type DropdownType = 'settings' | 'notifications' | 'events' | null;

interface User {
  id: number;
  user_id: number;
  username?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  profile_pic?: string;
  name?: string;
  role?: string;
  created_at?: string;
}

const Header = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { setSelectedEventDate } = useEvent();
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [profileImageKey, setProfileImageKey] = useState(Date.now());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<NotificationBellRef>(null);

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

  // Function to refresh user data
  const refreshUserData = useCallback(async () => {
    try {
      const userData = await authService.getCurrentUser();
      if (userData && setUser) {
        setUser(userData);
      }
      // Force image refresh
      setProfileImageKey(Date.now());
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, [setUser]);

  const handleProfileCardClose = () => {
    setShowProfileCard(false);
    // Refresh user data when profile card closes
    refreshUserData();
  };

  const renderDropdownContent = (type: DropdownType) => {
    switch (type) {
      case 'settings':
        return (
          <div className="dropdown-menu settings">
            <div className="dropdown-header">Settings</div>
            <div className="menu-item" onClick={() => {
              setShowSettingsModal(true);
              setActiveDropdown(null);
            }}>
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
    <>
      <header className="header">
        <div className="header-content">

          <div className="header-actions" ref={dropdownRef}>
            <div className="profile-avatar" onClick={() => setShowProfileCard(true)}>
              <img 
                key={profileImageKey}
                src={user?.profile_pic ? `${user.profile_pic}?t=${profileImageKey}` : defaultAvatar} 
                alt="Profile" 
                onError={(e) => { 
                  e.currentTarget.src = defaultAvatar; 
                }}
              />
            </div>

            <EventsDropdown 
              isOpen={activeDropdown === 'events'}
              onToggle={() => handleDropdownClick('events')}
              onEventSelect={(date) => {
                setSelectedEventDate(date);
              }}
              refreshEvents={() => {
                if (setSelectedEventDate) {
                  // Provide a way to trigger refresh without changing date
                  setSelectedEventDate(null);
                }
              }}
            />

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
            onClose={handleProfileCardClose} 
            currentUser={true}
          />
        )}
      </header>

      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
};

export default Header; 