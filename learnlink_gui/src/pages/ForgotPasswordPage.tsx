import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useToast } from '../components/ToastProvider';
import '../styles/ForgotPasswordPage.css';
import { FaEnvelope } from 'react-icons/fa';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      if (response.status === 200) {
        showToast('Reset code sent successfully! Please check your email.', 'success');
        navigate('/reset-password', { state: { email } });
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.response?.status === 404) {
        showToast('Email address not found. Please check your email.', 'error');
      } else if (error.response?.status === 429) {
        showToast('Too many attempts. Please try again later.', 'error');
      } else if (error.response?.data?.message) {
        showToast(error.response.data.message, 'error');
      } else if (error.message.includes('Failed to send verification code')) {
        showToast('Failed to send verification code. Please try again later.', 'error');
      } else {
        showToast(
          'Unable to process your request. Please try again later.',
          'error'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h1 className="forgot-password-title">Forgot Password</h1>
        <p className="forgot-password-subtitle">
          Enter your email to reset your password
        </p>
        
        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="forgot-password-input"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="forgot-password-button"
          >
            {isLoading ? 'Sending...' : 'SEND RESET CODE'}
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

export default ForgotPasswordPage; 