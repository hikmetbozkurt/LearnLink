import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('appearance');
  const { isDarkMode, toggleTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
        </div>
        <div className="modal-content">
          <div className="tabs">
            <button
              className={`tab-button ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              Appearance
            </button>
            <button
              className={`tab-button ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Account
            </button>
            <button
              className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
            </button>
          </div>
          <div className="tab-content">
            {activeTab === 'appearance' && (
              <div>
                <div className="form-group">
                  <label className="form-label">
                    Dark Mode
                    <div className="form-description">
                      Switch between light and dark themes
                    </div>
                  </label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={toggleTheme}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            )}
            {activeTab === 'account' && (
              <div>
                <div className="form-group">
                  <label className="form-label">
                    Email
                    <div className="form-description">
                      Your email address
                    </div>
                  </label>
                  <input type="email" placeholder="Enter your email" />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Password
                    <div className="form-description">
                      Change your password
                    </div>
                  </label>
                  <input type="password" placeholder="Enter new password" />
                </div>
                <button className="save-button">Save Changes</button>
              </div>
            )}
            {activeTab === 'notifications' && (
              <div>
                <div className="form-group">
                  <label className="form-label">
                    Email Notifications
                    <div className="form-description">
                      Receive email notifications
                    </div>
                  </label>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Push Notifications
                    <div className="form-description">
                      Receive push notifications
                    </div>
                  </label>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                </div>
                <button className="save-button">Save Changes</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 