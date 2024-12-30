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
      await api.post('/api/auth/forgot-password', { email });
      navigate('/reset-password');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to send reset code', 'error');
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