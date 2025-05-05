import dotenv from 'dotenv'
dotenv.config()

const config = {
  PORT: process.env.PORT || process.env.EB_PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DB_HOST: process.env.DB_HOST || 'database-1.cdsoayeo8v8y.eu-north-1.rds.amazonaws.com',
  DB_USER: process.env.DB_USER || 'learnlink',
  DB_PASSWORD: process.env.DB_PASSWORD || 'learnlink',
  DB_NAME: process.env.DB_NAME || 'postgres',
  DB_PORT: process.env.DB_PORT || 5432,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || '9f0e4d8d2b8c6aa5fae3839c0cd747c3a20f1d22e7dd6f7c',
  JWT_EXPIRE: '24h',
  
  // Email
  EMAIL: process.env.EMAIL || 'learnlink411@gmail.com',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || 'lfjvkxanwfztgkjo',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER || 'learnlink411@gmail.com',
  SMTP_PASS: process.env.SMTP_PASS || 'lfjvkxanwfztgkjo',
  
  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  
  // File Upload
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // AWS S3
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || 'eu-north-1',
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || 'elasticbeanstalk-eu-north-1-459015013425'
}

export default config 