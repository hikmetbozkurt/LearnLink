import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import "./signin_style.css";

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"pending" | "success">("success");
  const [redirectMessage, setRedirectMessage] = useState(""); // Track the redirect message
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    setLoading(true);
    setRedirectMessage("Loading... Redirecting to Login Page"); // Set the message for going back to login
    setTimeout(() => {
      navigate("/"); // login page : '/'
    }, 2000); // Simulate loading delay
  };

  const handleGoToResetPassword = () => {
    navigate("/reset-password"); // Navigate to ResetPasswordPage for testing
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Password reset link sent to your email.");
    //handleBackToLogin(); // Simulate going back after email reset
    handleGoToResetPassword(); // Temporarily navigate to ResetPasswordPage for testing
  };

  useEffect(() => {
    setLoading(true);
    setRedirectMessage("Loading... Redirecting to Forgot Password Page"); // Message for Forgot Password Page
    setTimeout(() => {
      setLoading(false); // End loading once the Forgot Password page is ready
    }, 3000); // Simulate loading delay for page load
  }, []);

  return (
    <div className={`container ${loading ? "loading" : ""}`}>
      {loading ? (
        <div className="loading-container">
          <CircularProgress />
          <p>{redirectMessage}</p> {/* Dynamic message here */}
        </div>
      ) : (
        <>
          {/* Left side of the container */}
          <div className="form-container sign-in">
            <form onSubmit={handleSubmit}>
              <h1>Forgot Your Password?</h1>
              <p>Enter your email to receive a password reset link.</p>
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
              {/* <button type="submit">Send Reset Link</button>*/}
              <button type="submit" onClick={() => navigate("/reset-password")}>
                Send Reset Link
              </button>
            </form>
          </div>

          {/* Right side of the container */}
          <div className="toggle-container">
            <div className="toggle">
              <div className="toggle-panel toggle-right">
                <h1>Go back to the Login Page</h1>
                <p>
                  Ready to log in? Click below to head back to your account.
                </p>
                <button onClick={handleBackToLogin}>Go to Login</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ForgotPasswordPage;
