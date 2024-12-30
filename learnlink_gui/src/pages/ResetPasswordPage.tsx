import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useToast } from '../components/ToastProvider';
import '../styles/ResetPasswordPage.css';
import { FaKey, FaLock, FaEnvelope } from 'react-icons/fa';

const ResetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/api/auth/reset-password', {
        email,
        code,
        newPassword
      });
      navigate('/');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h1 className="reset-password-title">Reset Password</h1>
        <p className="reset-password-subtitle">
          Enter the code sent to your email and your new password
        </p>
        
        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="reset-password-input"
            />
          </div>

          <div className="input-group">
            <FaKey className="input-icon" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Reset Code"
              required
              className="reset-password-input"
            />
          </div>

          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              required
              className="reset-password-input"
            />
          </div>

          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              required
              className="reset-password-input"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="reset-password-button"
          >
            {isLoading ? 'Resetting...' : 'RESET PASSWORD'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="back-to-login-button"
          >
            BACK TO LOGIN
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 