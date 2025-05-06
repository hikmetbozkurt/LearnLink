import { AuthService } from "../services/authService.js";
import { EmailService } from "../services/emailService.js";
import asyncHandler from "../utils/asyncHandler.js";
import pool from "../config/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import config from "../config/env.js";

const authService = new AuthService();
const emailService = new EmailService();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Database migration for login_provider field
// Run this once
const addLoginProviderField = async () => {
  try {
    // Check if the login_provider column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'login_provider'
    `;

    const checkResult = await pool.query(checkColumnQuery);

    if (checkResult.rows.length === 0) {
      // Set login_provider to 'google' for users who signed up with Google
      // This is a heuristic - users without passwords are likely Google users
      await pool.query(`
        UPDATE users 
        SET login_provider = 'google' 
        WHERE password IS NULL OR password = ''
      `);

      // Set login_provider to 'email' for other users
      await pool.query(`
        UPDATE users 
        SET login_provider = 'email' 
        WHERE (password IS NOT NULL AND password != '') AND (login_provider IS NULL)
      `);
    } else {
    }
  } catch (error) {
    console.error("Error during database migration:", error);
  }
};

// Run the migration
// addLoginProviderField().catch(error => {
//   console.error('Migration failed:', error);
// });

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Get user by email
    const result = await pool.query(
      "SELECT user_id, name, email, password, role, created_at, profile_pic FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Verify password
    if (!user.password) {
      console.error("User has no password hash:", user.email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Remove password from user object before sending
    delete user.password;

    // Send response in the expected format
    res.json({
      token,
      user: {
        id: user.user_id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        profile_pic: user.profile_pic,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      email: email,
    });
    res.status(500).json({ message: "Server error during login" });
  }
});

export const register = asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user exists
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user - Modified query to let PostgreSQL handle user_id
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, is_active) 
       VALUES ($1, $2, $3, $4, true) 
       RETURNING user_id, name, email, role, created_at, profile_pic`,
      [name, email, hashedPassword, role || "student"]
    );

    const newUser = result.rows[0];

    // Generate token
    const token = jwt.sign(
      { user_id: newUser.user_id, email: newUser.email },
      config.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Send response
    res.status(201).json({
      token,
      user: {
        id: newUser.user_id,
        user_id: newUser.user_id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at,
        profile_pic: newUser.profile_pic,
      },
    });
  } catch (error) {
    console.error("Registration error details:", {
      error: error.message,
      stack: error.stack,
      email,
      name,
    });
    res
      .status(500)
      .json({ message: "Error creating user", details: error.message });
  }
});

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.user_id;
  try {
    const result = await pool.query(
      `SELECT user_id, email, username, role, profile_pic
       FROM users 
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    res.json({
      id: user.user_id,
      user_id: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
      profile_pic: user.profile_pic,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // First check if user exists
    const userResult = await pool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const code = await authService.createResetToken(email);

    await emailService.sendVerificationCode(email, code);

    res.json({ message: "Reset code sent successfully" });
  } catch (error) {
    console.error("Password reset request error:", {
      error: error.message,
      stack: error.stack,
      email,
    });

    if (error.message === "User not found") {
      res.status(404).json({ message: "User not found" });
    } else if (
      error.message.includes("Email service not configured properly")
    ) {
      res.status(500).json({ message: "Email service configuration error" });
    } else if (error.message.includes("authentication failed")) {
      res.status(500).json({ message: "Email service authentication error" });
    } else if (error.message.includes("Invalid email address")) {
      res.status(400).json({ message: "Invalid email address format" });
    } else {
      res.status(500).json({
        message: "Error sending reset code",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    await authService.resetPassword(email, code, newPassword);
    res.json({ message: "Password reset successful" });
  } catch (error) {
    if (error.message === "Invalid or expired reset code") {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error resetting password" });
    }
  }
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: "Google credential is required" });
  }

  try {
    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error("Invalid Google token");
    }

    const { email, name, picture } = payload;

    // Check if user exists
    let result = await pool.query(
      "SELECT user_id, name, email, role, created_at, profile_pic, login_provider FROM users WHERE email = $1",
      [email]
    );

    let user;

    if (result.rows.length === 0) {
      // Create new user if doesn't exist
      // Generate a random password for Google users since our DB requires it
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      result = await pool.query(
        `INSERT INTO users (name, email, password, role, is_active, profile_pic, login_provider) 
         VALUES ($1, $2, $3, $4, true, $5, $6) 
         RETURNING user_id, name, email, role, created_at, profile_pic, login_provider`,
        [name, email, hashedPassword, "student", picture, "google"]
      );
    } else {
      // Update login_provider if user exists but doesn't have it set
      if (!result.rows[0].login_provider) {
        await pool.query(
          "UPDATE users SET login_provider = $1 WHERE user_id = $2",
          ["google", result.rows[0].user_id]
        );
      }
    }

    user = result.rows[0];

    // Generate token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Send response
    res.json({
      token,
      user: {
        id: user.user_id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        profile_pic: user.profile_pic || picture, // Use Google profile picture if no custom picture is set
        login_provider: user.login_provider,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(401).json({ message: "Invalid Google credentials" });
  }
});

// Check authentication provider for a user
export const checkAuthProvider = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Query to find if this user was created with Google login
    const result = await pool.query(
      "SELECT login_provider FROM users WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // If login_provider is 'google', user registered with Google
    // If null or 'email', user registered with email/password
    const provider = result.rows[0].login_provider || "email";

    res.json({ provider });
  } catch (error) {
    console.error("Error checking auth provider:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Change email endpoint
export const changeEmail = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newEmail } = req.body;
    const userId = req.user.user_id;

    if (!currentPassword || !newEmail) {
      return res
        .status(400)
        .json({ message: "Current password and new email are required" });
    }

    // Check if user exists and get their current data
    const userResult = await pool.query(
      "SELECT email, password, login_provider FROM users WHERE user_id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    // Check if user is a Google user
    if (user.login_provider === "google") {
      return res.status(403).json({
        message:
          "Google accounts cannot change email directly. Please update your email through Google.",
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Check if new email already exists
    const emailCheckResult = await pool.query(
      "SELECT user_id FROM users WHERE email = $1 AND user_id != $2",
      [newEmail, userId]
    );

    if (emailCheckResult.rows.length > 0) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // Update the email
    await pool.query("UPDATE users SET email = $1 WHERE user_id = $2", [
      newEmail,
      userId,
    ]);

    res.json({
      message: "Email updated successfully",
      email: newEmail,
    });
  } catch (error) {
    console.error("Error changing email:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Change password endpoint
export const changePassword = asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.user_id;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    // Check if user exists and get their current data
    const userResult = await pool.query(
      "SELECT email, password, login_provider FROM users WHERE user_id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    // Check if user is a Google user
    if (user.login_provider === "google") {
      return res.status(403).json({
        message:
          "Google accounts cannot change password directly. Please update your password through Google.",
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await pool.query("UPDATE users SET password = $1 WHERE user_id = $2", [
      hashedPassword,
      userId,
    ]);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error" });
  }
});
