import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import { authService } from "../services/authService";
import '../styles/pages/login.css';

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authService.forgotPassword(email);

      if (response.success) {
        sessionStorage.setItem('resetEmail', email);
        navigate('/reset-password');
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError('Email is not registered');
      } else {
        setError('Failed to process request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container sign-in">
        <form onSubmit={handleSubmit}>
          <h1>Forgot Password</h1>
          <div className="form-description">
            Enter your email to reset your password
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="input-group">
            <EmailIcon className="input-icon" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Send Reset Code"
            )}
          </button>

          <button 
            type="button"
            onClick={() => navigate('/')}
            className="secondary-button"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 