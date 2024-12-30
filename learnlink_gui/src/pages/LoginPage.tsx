import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PasswordIcon from "@mui/icons-material/Password";
import { authService } from "../services/authService";
import '../styles/pages/login.css';
import api from "../api/axiosConfig";
import axios from "axios";
import { API_URL } from '../config/config';
import { useToast } from '../components/ToastProvider';

console.log('Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);

const GOOGLE_CLIENT_ID = "69975858042-qg58t1vmhplr463opgmg4dca01jdaal4.apps.googleusercontent.com";

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  // Toggle between sign-in and sign-up views
  const toggleView = () => {
    setIsSignUp(!isSignUp);
  };

  const handleForgotPasswordClick = () => {
    navigate("/forgot-password");
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      console.log('Google login started with credential response:', credentialResponse);
      
      const response = await api.post('/api/auth/google', {
        credential: credentialResponse.credential
      });

      console.log('Google login response:', response);

      if (response.data?.token && response.data?.user) {
        // Clean and store token
        const cleanToken = response.data.token.replace(/['"]+/g, '');
        
        // Ensure user data has all required fields
        const userData = {
          id: response.data.user.user_id || response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          role: response.data.user.role || 'student'
        };

        // Store the data
        localStorage.setItem('token', cleanToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('Google login - Stored auth data:', {
          token: cleanToken,
          user: userData
        });

        // Verify data is stored correctly
        const storedToken = localStorage.getItem('token');
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (storedToken && storedUser.id && storedUser.email) {
          console.log('Google login - Verification successful, navigating to home');
          navigate('/home');
        } else {
          console.error('Google login - Failed to verify stored data:', { storedToken, storedUser });
          throw new Error('Failed to store authentication data');
        }
      } else {
        console.error('Google login - Invalid response format:', response);
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Google login error:', error);
      showToast('Failed to login with Google', 'error');
      
      // Clean up any partial data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was unsuccessful. Please try again.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password
      });

      // The response directly contains token and user
      const { token, user } = response.data;
      
      // Store token without quotes
      localStorage.setItem('token', token.replace(/['"]+/g, ''));
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate('/home');
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/auth/register', {
        name: username,
        email,
        password,
        role: 'student'
      });

      // The response directly contains token and user
      const { token, user } = response.data;
      
      // Store token without quotes
      localStorage.setItem('token', token.replace(/['"]+/g, ''));
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(user));
      
      // Navigate to home page
      navigate('/home');
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.response?.data?.message || "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className={`container ${isSignUp ? "active" : ""}`} id="container">
        <div className="form-container sign-up">
          <form id="signUpForm" onSubmit={handleSignUp}>
            <h1>Create Account</h1>
            <div className="input-group">
              <PersonIcon className="input-icon" />
              <input
                type="text"
                placeholder="Username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="input-group">
              <EmailIcon className="input-icon" />
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="input-group">
              <PasswordIcon className="input-icon" />
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <i
                className={`fa-solid ${
                  passwordVisible ? "fa-eye" : "fa-eye-slash"
                }`}
                onClick={togglePasswordVisibility}
                id="togglePassword"
                style={{ cursor: "pointer" }}
              ></i>
            </div>
            <div className="input-group">
              <PasswordIcon className="input-icon" />
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Confirm Password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button type="submit">Sign Up</button>
          </form>
        </div>
        <div className="form-container sign-in">
          <form onSubmit={handleLogin}>
            <h1>Sign In</h1>
            
            {error && (
              <div className="error-message" style={{ 
                color: '#ff3333',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}

            <div className="social-icons">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                useOneTap={false}
                ux_mode="popup"
              />
            </div>

            <div className="divider">
              <span>or use your email and password</span>
            </div>

            <div className="input-group">
              <EmailIcon className="input-icon" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                required
              />
            </div>
            <div className="input-group">
              <PasswordIcon className="input-icon" />
              <input
                type={passwordVisible ? "text" : "password"}
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <i
                className={`fa-solid ${
                  passwordVisible ? "fa-eye" : "fa-eye-slash"
                }`}
                onClick={togglePasswordVisibility}
                id="togglePassword"
                style={{ cursor: "pointer" }}
              ></i>
            </div>
            <div className="forgot">
              <span onClick={handleForgotPasswordClick} className="forgot-link">
                Forget Your Password?
              </span>
            </div>
            <button type="submit">SIGN IN</button>
          </form>
        </div>
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Welcome Back to LearnLink!</h1>
              <p>Enter your personal details to sign in.</p>
              <button className="hidden" onClick={toggleView}>
                Sign In
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>Start Learning with LearnLink !</h1>
              <p>
                Register now and become part of our growing learning community.
              </p>
              <button className="hidden" onClick={toggleView}>
                Join LearnLink
              </button>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default LoginPage; 