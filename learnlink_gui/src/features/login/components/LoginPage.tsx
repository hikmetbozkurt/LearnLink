import React, { useState, useEffect } from "react";
import "./signin_style.css";
import { useNavigate } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PasswordIcon from "@mui/icons-material/Password";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import api from "../../../api/axiosConfig";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "your-client-id-here";

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();

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
      console.log('Google Sign-In successful. Sending token to backend...');
      const response = await api.post("/api/auth/google", {
        credential: credentialResponse.credential,
      });

      if (response.data.success) {
        // Store the token in localStorage
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        console.log('Backend authentication successful');
        alert("Google Sign-in successful!");
        navigate("/dashboard");
      } else {
        console.error('Backend authentication failed:', response.data.message);
        alert(response.data.message || "Google Sign-in failed. Please try again.");
      }
    } catch (error: any) {
      console.error('Google Sign-in error:', error);
      alert(error.response?.data?.message || "An error occurred during Google Sign-in");
    }
  };

  const handleGoogleError = () => {
    console.error('Google Sign-In failed');
    alert("Google Sign-in failed. Please try again.");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/auth/login", {
        email: email,
        password: password,
      });
      if (response.data.success) {
        alert("Login successful");
        navigate("/dashboard");
      } else {
        alert(response.data.message || "Login failed. Please try again.");
      }
    } catch (error) {}
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // First check if passwords match
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await api.post("/api/auth/signup", {
        username: username, // This will be stored as 'name' in the database
        email: email,
        password: password
      });

      if (response.data.success) {
        alert("Account created successfully!");
        setIsSignUp(false); // Switch back to login view
        // Clear the form
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      } else {
        alert(response.data.message || "Failed to create account. Please try again.");
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      alert(error.response?.data?.message || "An error occurred during signup");
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || ''}>
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
          <form id="loginForm" onSubmit={handleLogin}>
            <h1>Sign In</h1>
            <div className="social-icons">
              <span>with&nbsp;&nbsp;</span>
              <div className="icon" style={{ position: 'relative' }}>
                <i className="fa-brands fa-google-plus-g"></i>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0 }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    type="icon"
                    shape="circle"
                    size="large"
                  />
                </div>
              </div>
            </div>
            <span>or use your email and password</span>
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
