import React from 'react';
import { FaUser, FaEnvelope, FaCalendar, FaBook } from 'react-icons/fa';
import './ProfileCard.css';

interface User {
  user_id: number;
  email: string;
  name?: string;
  role?: string;
  created_at?: string;
}

interface ProfileCardProps {
  user: User;
  onClose: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, onClose }) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="profile-card-overlay" onClick={onClose}>
      <div className="profile-card" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
        
        <div className="profile-header">
          <div className="profile-avatar">
            <FaUser size={24} />
          </div>
          <h2>{user.name || 'User'}</h2>
          {user.role && <span className="role-badge">{user.role}</span>}
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