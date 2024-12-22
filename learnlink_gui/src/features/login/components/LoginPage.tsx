import React, { useState } from "react";
import "./signin_style.css";
import { useNavigate } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PasswordIcon from "@mui/icons-material/Password";
import { login } from "../services/authService"; // Correct path to authService
import api from "../../../api/axiosConfig";

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
    navigate("/forgot-password"); // Will be done later! Navigate to Another page or container ?
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
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
    // animation needs to be added to sing in
    e.preventDefault();
    if (password === confirmPassword) {
      alert("Account created successfully");
      navigate("/login"); // Redirect to login page after successful signup
    } else {
      alert("Passwords do not match!"); // need something else rather than alert
    }
  };

  return (
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
            <a href="#" className="icon">
              <i className="fa-brands fa-google-plus-g"></i>
            </a>
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
  );
};

export default LoginPage;
