import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config(); // Only load .env in development
}

const config = {
  PORT: process.env.PORT || process.env.EB_PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  DB_HOST: process.env.DB_HOST || "",
  DB_USER: process.env.DB_USER || "",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME || "postgres",
  DB_PORT: process.env.DB_PORT || 5432,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRE: "24h",

  // Email
  EMAIL: process.env.EMAIL || "",
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || "",
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,

  // File Upload
  UPLOAD_PATH: process.env.UPLOAD_PATH || "uploads",
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

  // AWS S3
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || "eu-north-1",
  AWS_BUCKET_NAME:
    process.env.AWS_BUCKET_NAME || "elasticbeanstalk-eu-north-1-459015013425",
};

export default config;
