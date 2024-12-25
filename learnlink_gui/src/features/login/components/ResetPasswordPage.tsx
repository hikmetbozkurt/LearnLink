import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import LockIcon from '@mui/icons-material/Lock';
import PasswordIcon from "@mui/icons-material/Password";
import api from "../../../api/axiosConfig";
import "./signin_style.css";

const ResetPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const resetEmail = sessionStorage.getItem('resetEmail');
    if (!resetEmail) {
      navigate('/forgot-password');
    } else {
      setEmail(resetEmail);
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      // First verify the code
      const verifyResponse = await api.post('/api/auth/verify-reset-code', {
        email,
        code: verificationCode
      });

      if (verifyResponse.data.success) {
        // If code is valid, reset the password
        const resetResponse = await api.post('/api/auth/reset-password', {
          email,
          code: verificationCode,
          newPassword
        });

        if (resetResponse.data.success) {
          sessionStorage.removeItem('resetEmail');
          alert('Password reset successful!');
          navigate('/');
        }
      }
    } catch (error: any) {
      if (error.response?.data?.error === 'INVALID_CODE') {
        setError('Invalid or expired verification code');
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container sign-in">
        <form onSubmit={handleSubmit}>
          <h1>Reset Password</h1>
          <div className="form-description">
            Enter the verification code sent to your email
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="input-group">
            <LockIcon className="input-icon" />
            <input
              type="text"
              placeholder="Verification Code"
              value={verificationCode}
              onChange={(e) => {
                setVerificationCode(e.target.value);
                setError("");
              }}
              required
            />
          </div>

          <div className="input-group">
            <PasswordIcon className="input-icon" />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError("");
              }}
              required
            />
          </div>

          <div className="input-group">
            <PasswordIcon className="input-icon" />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Reset Password"
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

export default ResetPasswordPage;
