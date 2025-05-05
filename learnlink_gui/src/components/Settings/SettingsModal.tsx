import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import { useContext } from 'react';
import api from '../../api/axiosConfig';
import { useToast } from '../../components/ToastProvider';
import './SettingsModal.css';
import { FaLock, FaEnvelope, FaCheck, FaExclamationTriangle, FaGoogle } from 'react-icons/fa';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('appearance');
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, setUser } = useContext(AuthContext);
  const { showToast } = useToast();
  
  // Email change states
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmNewEmail, setConfirmNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  
  // Password change states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPasswordForPwChange, setCurrentPasswordForPwChange] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Loading states
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Check if user logged in with Google
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Update currentEmail when user changes to handle account switches
  useEffect(() => {
    if (user && user.email) {
      setCurrentEmail(user.email);
    }
  }, [user]);

  // Update currentEmail when the modal opens
  useEffect(() => {
    if (isOpen && user && user.email) {
      setCurrentEmail(user.email);
      
      // If we need to refresh user data from the server
      const refreshUserData = async () => {
        try {
          const response = await api.get(`/api/users/${user.id || user.user_id}`);
          if (response.data && response.data.email) {
            setCurrentEmail(response.data.email);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      };
      
      refreshUserData();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (user) {
      
      // If login_provider directly in user object, use that
      if (user.login_provider === 'google') {
        setIsGoogleUser(true);
      } else {
        // Otherwise check via API
        checkIfGoogleUser();
      }
    }
  }, [user]);

  const checkIfGoogleUser = async () => {
    try {
      const response = await api.get('/api/auth/check-auth-provider');
      setIsGoogleUser(response.data.provider === 'google');
    } catch (error) {
      console.error('Failed to check auth provider:', error);
      // If we can't determine, assume it's not a Google user for safety
      setIsGoogleUser(false);
    }
  };

  // Reset form states when closing the modal
  useEffect(() => {
    if (!isOpen) {
      resetForms();
    }
  }, [isOpen]);

  const resetForms = () => {
    setShowChangeEmail(false);
    setShowChangePassword(false);
    setCurrentEmail('');
    setNewEmail('');
    setConfirmNewEmail('');
    setCurrentPassword('');
    setCurrentPasswordForPwChange('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleChangeEmailClick = () => {
    setShowChangeEmail(true);
    setShowChangePassword(false);
  };

  const handleChangePasswordClick = () => {
    setShowChangeEmail(false);
    setShowChangePassword(true);
  };

  const handleCancelEmailChange = () => {
    setShowChangeEmail(false);
    setCurrentEmail('');
    setNewEmail('');
    setConfirmNewEmail('');
    setCurrentPassword('');
  };

  const handleCancelPasswordChange = () => {
    setShowChangePassword(false);
    setCurrentPasswordForPwChange('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleEmailChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newEmail !== confirmNewEmail) {
      showToast('New emails do not match', 'error');
      return;
    }
    
    setIsChangingEmail(true);
    
    try {
      // Call your API to change email
      const response = await api.post('/api/auth/change-email', {
        currentPassword,
        newEmail
      });
      
      // Update local user state
      if (user && setUser) {
        setUser({
          ...user,
          email: newEmail
        });
        
        // Update localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          parsedUser.email = newEmail;
          localStorage.setItem('user', JSON.stringify(parsedUser));
        }
      }
      
      showToast('Email updated successfully', 'success');
      handleCancelEmailChange();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to update email', 'error');
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    
    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      showToast('Password must be at least 8 characters long and contain at least 1 lowercase letter, 1 uppercase letter, and 1 number', 'error');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      // Call your API to change password
      const response = await api.post('/api/auth/change-password', {
        currentPassword: currentPasswordForPwChange,
        newPassword
      });
      
      showToast('Password updated successfully', 'success');
      handleCancelPasswordChange();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to update password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Account tab rendering - moved to separate render function for clarity
  const renderAccountTab = () => {
    
    // If user has login_provider property directly in user object, prefer that
    const isGoogleAccount = isGoogleUser || user?.login_provider === 'google';
    
    return (
      <div>
        {isGoogleAccount ? (
          <div className="google-account-notice">
            <div className="google-account-header">
              <FaGoogle size={24} />
              <h3>Google Account</h3>
            </div>
            <p>Your account is managed through Google. Email and password changes must be made through your Google account settings.</p>
            <div className="google-account-info">
              <FaExclamationTriangle color="#f39c12" />
              <p>You cannot change your email or password directly in LearnLink.</p>
            </div>
            <p>Current Email: {currentEmail}</p>
          </div>
        ) : (
          <>
            {!showChangeEmail && !showChangePassword ? (
              <>
                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Email
                    <div className="settings-form-description">
                      Your email address
                    </div>
                  </label>
                  <div className="settings-info-display">
                    <button 
                      className="settings-action-button"
                      onClick={handleChangeEmailClick}
                    >
                      Change Email
                    </button>
                  </div>
                </div>
                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Password
                    <div className="settings-form-description">
                      Secure your account
                    </div>
                  </label>
                  <div className="settings-info-display">
                    <button 
                      className="settings-action-button"
                      onClick={handleChangePasswordClick}
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </>
            ) : showChangeEmail ? (
              <form onSubmit={handleEmailChangeSubmit} className="settings-change-form">
                <h3><FaEnvelope /> Change Email</h3>
                
                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Current Email
                  </label>
                  <input 
                    type="email" 
                    className="settings-input" 
                    value={currentEmail}
                    disabled
                  />
                </div>
                
                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Current Password
                  </label>
                  <input 
                    type="password" 
                    className="settings-input" 
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="settings-form-group">
                  <label className="settings-form-label">
                    New Email
                  </label>
                  <input 
                    type="email" 
                    className="settings-input" 
                    placeholder="Enter new email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Confirm New Email
                  </label>
                  <input 
                    type="email" 
                    className="settings-input" 
                    placeholder="Confirm new email"
                    value={confirmNewEmail}
                    onChange={(e) => setConfirmNewEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="settings-form-actions">
                  <button 
                    type="button" 
                    className="settings-cancel-button"
                    onClick={handleCancelEmailChange}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="settings-save-button"
                    disabled={isChangingEmail}
                  >
                    {isChangingEmail ? 'Updating...' : 'Update Email'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordChangeSubmit} className="settings-change-form">
                <h3><FaLock /> Change Password</h3>
                
                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Current Password
                  </label>
                  <input 
                    type="password" 
                    className="settings-input" 
                    placeholder="Enter your current password"
                    value={currentPasswordForPwChange}
                    onChange={(e) => setCurrentPasswordForPwChange(e.target.value)}
                    required
                  />
                </div>
                
                <div className="settings-form-group">
                  <label className="settings-form-label">
                    New Password
                  </label>
                  <input 
                    type="password" 
                    className="settings-input" 
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                
                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Confirm New Password
                  </label>
                  <input 
                    type="password" 
                    className="settings-input" 
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="settings-password-requirements">
                  <h4>Password Requirements:</h4>
                  <ul>
                    <li className={newPassword.length >= 8 ? 'requirement-met' : ''}>
                      At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(newPassword) ? 'requirement-met' : ''}>
                      At least 1 uppercase letter
                    </li>
                    <li className={/[a-z]/.test(newPassword) ? 'requirement-met' : ''}>
                      At least 1 lowercase letter
                    </li>
                    <li className={/\d/.test(newPassword) ? 'requirement-met' : ''}>
                      At least 1 number
                    </li>
                  </ul>
                </div>
                
                <div className="settings-form-actions">
                  <button 
                    type="button" 
                    className="settings-cancel-button"
                    onClick={handleCancelPasswordChange}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="settings-save-button"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">Settings</h2>
        </div>
        <div className="settings-modal-content">
          <div className="settings-tabs">
            <button
              className={`settings-tab-button ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              Appearance
            </button>
            <button
              className={`settings-tab-button ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Account
            </button>

          </div>
          <div className="settings-tab-content">
            {activeTab === 'appearance' && (
              <div>
                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Dark Mode
                    <div className="settings-form-description">
                      Switch between light and dark themes
                    </div>
                  </label>
                  <label className="settings-switch">
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={toggleTheme}
                    />
                    <span className="settings-slider"></span>
                  </label>
                </div>
              </div>
            )}
            {activeTab === 'account' && renderAccountTab()}
            {activeTab === 'notifications' && (
              <div>
                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Email Notifications
                    <div className="settings-form-description">
                      Receive email notifications
                    </div>
                  </label>
                  <label className="settings-switch">
                    <input type="checkbox" />
                    <span className="settings-slider"></span>
                  </label>
                </div>
                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Push Notifications
                    <div className="settings-form-description">
                      Receive push notifications
                    </div>
                  </label>
                  <label className="settings-switch">
                    <input type="checkbox" />
                    <span className="settings-slider"></span>
                  </label>
                </div>
                <button className="settings-save-button">Save Changes</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 