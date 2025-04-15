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
            <button
              className={`settings-tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
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
            {activeTab === 'account' && (
              <div>
                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Email
                    <div className="settings-form-description">
                      Your email address
                    </div>
                  </label>
                  <input type="email" className="settings-input" placeholder="Enter your email" />
                </div>
                <div className="settings-form-group">
                  <label className="settings-form-label">
                    Password
                    <div className="settings-form-description">
                      Change your password
                    </div>
                  </label>
                  <input type="password" className="settings-input" placeholder="Enter new password" />
                </div>
                <button className="settings-save-button">Save Changes</button>
              </div>
            )}
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