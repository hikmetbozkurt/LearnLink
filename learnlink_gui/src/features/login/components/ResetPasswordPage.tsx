import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import "./signin_style.css";

const ResetPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);
    setRedirectMessage("Resetting your password...");

    // Simulate API call for password reset
    setTimeout(() => {
      setLoading(false);
      alert("Your password has been successfully reset!");
      handleBackToLogin(); // Redirect to login after password reset
    }, 2000);
  };

  useEffect(() => {
    setLoading(true);
    setRedirectMessage("Loading... Redirecting to Reset Password Page"); // Message for Reset Password Page
    setTimeout(() => {
      setLoading(false); // End loading once the Reset Password page is ready
    }, 2000); // Simulate loading delay for page load
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
              <h1>Reset Your Password</h1>
              <p>Enter a new password to reset your account password.</p>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="New Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <button type="submit">Reset Password</button>
            </form>
          </div>

          {/* Right side of the container */}
          <div className="toggle-container">
            <div className="toggle">
              <div className="toggle-panel toggle-right">
                <h1>Go back to the Login Page</h1>
                <p>
                  Ready to log in with your new password? Click below to return
                  to your account.
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

export default ResetPasswordPage;
