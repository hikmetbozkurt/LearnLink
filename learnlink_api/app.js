import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import chatroomRoutes from './routes/chatroomRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import directMessageRoutes from './routes/directMessageRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import postRoutes from './routes/postRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
// import { configureBucketCORS } from './services/s3Service.js';

// Load environment variables
dotenv.config();

// Note: CORS configuration for S3 bucket should be done manually in AWS Console:
// 1. Go to S3 Console -> your bucket -> Permissions -> CORS
// 2. Add configuration with proper allowed origins, methods, and headers

// The automatic CORS configuration is disabled due to IAM permission restrictions.
// configureBucketCORS()
//   .then(success => {
//     if (success) {
//       console.log('S3 bucket CORS configured successfully');
//     } else {
//       console.warn('S3 bucket CORS configuration did not complete successfully');
//     }
//   })
//   .catch(err => {
//     console.error('Error during S3 CORS configuration:', err);
//   });

// No hardcoded credentials - the app will use environment variables directly
// AWS SDK will automatically use AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
// AWS_REGION and AWS_BUCKET_NAME from process.env

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Create temp directory for file uploads (temporary storage before S3 upload)
const tempUploadsPath = path.join(__dirname, 'uploads/temp');
fs.mkdirSync(tempUploadsPath, { recursive: true }); // Ensure the temp directory exists

// Add request logging middleware
app.use((req, res, next) => {
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/chatrooms", chatroomRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/direct-messages", directMessageRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api", postRoutes);
app.use("/api", commentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/files", fileRoutes); // Add file routes

// Add a test route to check API connectivity

// Handle multer file size errors
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size exceeds the 5MB limit'
    });
  }
  next(err);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`Error handling request: ${req.method} ${req.originalUrl}`);
  console.error('Error details:', err);
  console.error('Error stack:', err.stack);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ 
    error: {
      message: 'Not Found',
      status: 404,
      path: req.originalUrl
    }
  });
});

export default app;
