import React, { useState, useRef, useContext } from 'react';
import { FaUser, FaEnvelope, FaCalendar, FaBook, FaCamera } from 'react-icons/fa';
import './ProfileCard.css';

// Add import for axios instance and auth service
import api from '../../api/axiosConfig';
import defaultAvatar from '../../assets/images/default-avatar.png';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

interface User {
  user_id: number;
  email: string;
  name?: string;
  role?: string;
  created_at: string;
  profile_pic?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    console.log('Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
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
      
      console.log('Preparing to upload profile picture');
      
      // Use axios instead of fetch
      const response = await api.post('/api/users/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Upload response:', response.data);
      
      if (response.data && response.data.profilePic) {
        // Update the local state to show the new profile picture
        setLocalProfilePic(response.data.profilePic);
        
        // Get updated user data from server
        const updatedUserData = await authService.getCurrentUser();
        if (updatedUserData && setUser) {
          setUser(updatedUserData);
        }
        
        // Force refresh the image if it's the same URL (useful when re-uploading same image)
        const refreshTimestamp = `?t=${new Date().getTime()}`;
        setTimeout(() => {
          setLocalProfilePic(prev => prev ? `${prev.split('?')[0]}${refreshTimestamp}` : prev);
        }, 100);
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

  return (
    <div className="profile-card-overlay" onClick={onClose}>
      <div className="profile-card" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose} aria-label="Close">
          &times;
        </button>
        
        <div className="profile-header">
          <div className="profile-avatar">
            {localProfilePic ? (
              <img 
                src={localProfilePic} 
                alt={user.name || 'User'} 
                className="profile-image"
                onError={(e) => {
                  console.log('Error loading profile pic in ProfileCard, falling back to default');
                  e.currentTarget.src = defaultAvatar;
                  // If we have a broken image URL, clear it so we show the icon instead
                  setLocalProfilePic(undefined);
                }}
              />
            ) : (
              <FaUser size={180} />
            )}
            {currentUser && (
              <div className="change-avatar-overlay" onClick={handleFileSelect}>
                <FaCamera size={24} />
                <span>Change Photo</span>
              </div>
            )}
          </div>
          <h2>{user.name || 'User'}</h2>
          {user.role && <span className="role-badge">{user.role}</span>}
          
          {currentUser && (
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFileChange}
            />
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

          <div className="info-item">
            <FaCalendar className="info-icon" />
            <div>
              <label>Member Since</label>
              <p>{formatDate(user.created_at)}</p>
            </div>
          </div>

          <div className="info-item">
            <FaBook className="info-icon" />
            <div>
              <label>Role</label>
              <p>{user.role || 'User'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard; 