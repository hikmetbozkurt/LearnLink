import React, { useState, useRef, useContext, useEffect } from 'react';
import { FaUser, FaEnvelope, FaCalendar, FaBook, FaCamera, FaSpinner, FaTrash } from 'react-icons/fa';
import './ProfileCard.css';

// Add import for axios instance and auth service
import api from '../../api/axiosConfig';
import defaultAvatar from '../../assets/images/default-avatar.png';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

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

interface ProfileCardProps {
  user: User;
  onClose: () => void;
  currentUser?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, onClose, currentUser = false }) => {
  const { setUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localProfilePic, setLocalProfilePic] = useState<string | undefined>(user.profile_pic);
  const [profileImageLoading, setProfileImageLoading] = useState(false);
  const [profileImageSrc, setProfileImageSrc] = useState<string | null>(null);
  const [authProvider, setAuthProvider] = useState<string | null>(null);
  const [isLoadingProvider, setIsLoadingProvider] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Check if the user is using Google login
    const checkProvider = async () => {
      try {
        setIsLoadingProvider(true);
        const provider = await authService.checkAuthProvider();
        setAuthProvider(provider);
      } catch (error) {
        console.error('Error checking auth provider:', error);
        setAuthProvider('email'); // Default to email if there's an error
      } finally {
        setIsLoadingProvider(false);
      }
    };

    if (currentUser) {
      checkProvider();
    } else {
      setIsLoadingProvider(false);
    }
  }, [currentUser]);

  // Load profile image when component mounts or localProfilePic changes
  useEffect(() => {
    if (localProfilePic) {
      const loadProfileImage = async () => {
        setProfileImageLoading(true);
        try {
          const picPath = getProfilePicUrl(localProfilePic);
          if (picPath) {
            const blobUrl = await loadImageViaApi(picPath);
            setProfileImageSrc(blobUrl);
          } else {
            setProfileImageSrc(null);
          }
        } catch (err) {
          console.error("Error loading profile image:", err);
          setProfileImageSrc(null);
        } finally {
          setProfileImageLoading(false);
        }
      };
      
      loadProfileImage();
    } else {
      setProfileImageSrc(null);
    }
  }, [localProfilePic]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    // Clear previous errors
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('profilePic', file);
      
      // Use axios instead of fetch
      const response = await api.post('/api/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.profilePic) {
        const profilePicUrl = response.data.profilePic;
        
        // Get the path for API access
        const picPath = getProfilePicUrl(profilePicUrl);
        
        // Immediately update local state with the new URL
        setLocalProfilePic(profilePicUrl);
        
        // Try to load the image via API to verify it works
        if (picPath) {
          setProfileImageLoading(true);
          try {
            const blobUrl = await loadImageViaApi(picPath);
            if (blobUrl) {
              setProfileImageSrc(blobUrl);
            }
          } catch (err) {
            console.error("Error loading new profile pic:", err);
          } finally {
            setProfileImageLoading(false);
          }
        }
        
        // Update the user context with the new URL
        const updatedUserData = await authService.getCurrentUser();
        if (updatedUserData && setUser) {
          setUser({
            ...updatedUserData,
            profile_pic: profilePicUrl
          });
        }
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  // Function to get the full profile picture URL
  const getProfilePicUrl = (picPath: string | undefined) => {
    if (!picPath) return undefined;
    
    // Handle Google profile picture URLs (they should be used directly, not through our API)
    if (picPath.includes('googleusercontent.com')) {
      return picPath; // Return the full URL for Google profile pictures
    }
    
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
      if (!imagePath) return '';
      
      // For Google URLs, fetch them directly without going through our API
      if (imagePath.includes('googleusercontent.com')) {
        const response = await fetch(imagePath);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
      
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
      return '';
    }
  };

  // Function to handle removing the profile photo
  const handleRemovePhoto = async () => {
    if (!localProfilePic) return;
    
    try {
      setUploading(true);
      
      // Call the API to remove the profile picture
      await api.delete('/api/users/profile-picture');
      
      // Update local state
      setLocalProfilePic(undefined);
      setProfileImageSrc(null);
      
      // Update user context
      const updatedUserData = await authService.getCurrentUser();
      if (updatedUserData && setUser) {
        setUser({
          ...updatedUserData,
          profile_pic: undefined
        });
      }
    } catch (err) {
      console.error('Error removing profile picture:', err);
      setError('Failed to remove profile picture');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-card-overlay" onClick={onClose}>
      <div className="profile-card" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close">
          &times;
        </button>
        
        <div className="profile-header">
          <div className="profile-avatar">
            {profileImageLoading ? (
              <div className="loading-spinner">
                <FaSpinner className="spinner-icon" />
              </div>
            ) : localProfilePic && profileImageSrc ? (
              <img 
                src={profileImageSrc}
                alt={user.name || 'User'} 
                className="profile-image"
                onError={(e) => {
                  e.currentTarget.src = defaultAvatar;
                  setLocalProfilePic(undefined);
                }}
              />
            ) : (
              <img 
                src={defaultAvatar}
                alt={user.name || 'User'} 
                className="profile-image"
              />
            )}
            {currentUser && (
              <div className="change-avatar-overlay" onClick={handleFileSelect}>
                <FaCamera size={24} />
                <span>Change Photo</span>
              </div>
            )}
          </div>
          <h2>{user.name || 'User'}</h2>
          
          {currentUser && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />
              
              {localProfilePic && (
                <button 
                  className="remove-photo-btn" 
                  onClick={handleRemovePhoto}
                  disabled={uploading}
                >
                  <FaTrash size={14} /> Remove Photo
                </button>
              )}
            </>
          )}
          
          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}
          
          {uploading && (
            <div className="loading-message">
              <span>Uploading your profile picture...</span>
            </div>
          )}
        </div>

        <div className="profile-info">
          <div className="info-item">
            <FaEnvelope className="info-icon" />
            <div>
              <label>Email</label>
              <p>{user.email}</p>
            </div>
          </div>

          {/* Only show Member Since for non-Google users */}
          {(!isLoadingProvider && (!currentUser || (currentUser && authProvider !== 'google'))) && (
            <div className="info-item">
              <FaCalendar className="info-icon" />
              <div>
                <label>Member Since</label>
                <p>{formatDate(user.created_at)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard; 