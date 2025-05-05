import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaCog, 
  FaSignOutAlt,
  FaUser,
  FaSpinner
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
import api from '../../api/axiosConfig';

type DropdownType = 'settings' | 'notifications' | 'events' | null;

interface User {
  id: number;
  user_id: number;
  username?: string;
  email: string;
  first_name?: string;
  last_name?: string;
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
  const [profileImageLoading, setProfileImageLoading] = useState(false);
  const [profileImageSrc, setProfileImageSrc] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<NotificationBellRef>(null);

  // Force refresh profile image on component mount and every minute
  useEffect(() => {
    // Initial refresh
    setProfileImageKey(Date.now());
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      setProfileImageKey(Date.now());
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

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

  // Function to test if the image URL is accessible
  const testImageUrl = useCallback(async (url: string) => {
    try {
      // Use axios instead of fetch to ensure auth headers are included
      // Extract the path part of the URL if it's an absolute URL
      let imagePath = url;
      if (url.startsWith('http')) {
        // Extract just the path part (/api/users/profile-picture/9)
        const urlObj = new URL(url);
        imagePath = urlObj.pathname;
      }
      
      // Now use our axios instance to make the request (it has auth headers)
      const response = await api.get(imagePath, {
        responseType: 'blob'  // Request the image as a blob
      });
      
      if (response.status !== 200) {
        console.error(`Image fetch failed with status: ${response.status}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Image fetch error:", error);
      return false;
    }
  }, []);

  // Test the image URL when the user object changes
  useEffect(() => {
    if (user?.profile_pic) {
      testImageUrl(user.profile_pic);
    }
  }, [user, testImageUrl]);

  // Function to get the full profile picture URL
  const getProfilePicUrl = (picPath: string | undefined) => {
    if (!picPath) return defaultAvatar;
    
    // For relative URLs that point to the profile picture endpoint,
    // return just the path since we'll load it via our API
    if (picPath.startsWith('/api/users/profile-picture/')) {
      return picPath;
    }
    
    // For absolute URLs to our API server, extract just the path
    if (picPath.includes('learnlink-v1-env.eba-b28u347j.eu-north-1.elasticbeanstalk.com')) {
      try {
        const urlObj = new URL(picPath);
        return urlObj.pathname;
      } catch (e) {
        console.error("Invalid URL:", picPath);
        return picPath;
      }
    }
    
    // Default case - just use the URL as is
    return picPath;
  };
  
  // Function to load an image through our API with auth
  const loadImageViaApi = async (imagePath: string): Promise<string> => {
    try {
      // Use a clean path without query params for the API request
      const cleanPath = imagePath.split('?')[0];
      
      // Make an authenticated request to get the image
      const response = await api.get(cleanPath, {
        responseType: 'blob'
      });
      
      // Create a blob URL from the response
      const blob = response.data;
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error loading image via API:', error);
      return defaultAvatar;
    }
  };

  // Load profile image when user changes
  useEffect(() => {
    if (user?.profile_pic) {
      const loadProfileImage = async () => {
        setProfileImageLoading(true);
        try {
          const picPath = getProfilePicUrl(user.profile_pic);
          const blobUrl = await loadImageViaApi(picPath);
          setProfileImageSrc(blobUrl);
        } catch (err) {
          console.error("Error loading profile image:", err);
          setProfileImageSrc(defaultAvatar);
        } finally {
          setProfileImageLoading(false);
        }
      };
      
      loadProfileImage();
    } else {
      setProfileImageSrc(defaultAvatar);
    }
  }, [user, profileImageKey]);

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
              {profileImageLoading ? (
                <div className="loading-spinner">
                  <FaSpinner className="spinner-icon" />
                </div>
              ) : user?.profile_pic ? (
                <img 
                  key={profileImageKey}
                  src={profileImageSrc || defaultAvatar}
                  alt="Profile" 
                  onError={(e) => { 
                    e.currentTarget.src = defaultAvatar; 
                  }}
                />
              ) : (
                <img src={defaultAvatar} alt="Profile" />
              )}
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