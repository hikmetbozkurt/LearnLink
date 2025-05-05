/**
 * File Upload Controller for LearnLink
 * 
 * Handles file uploads for course posts and assignment submissions
 * Supports both local storage and S3 storage
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as s3Service from '../services/s3Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Temporary upload directory for file processing
    const uploadDir = path.join(__dirname, '../uploads/temp');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const fileExtension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${fileExtension}`);
  }
});

// Configure multer upload settings
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Define allowed file extensions
    const allowedExtensions = [
      '.pdf', '.txt', '.zip', '.rar',
      '.doc', '.docx', '.docm', '.dot', '.dotx', '.dotm',
      '.xls', '.xlsx', '.xlsm', '.xlt', '.xltx', '.xltm', '.xlsb', '.csv',
      '.ppt', '.pptx', '.pptm', '.pot', '.potx', '.potm', '.pps', '.ppsx', '.ppsm'
    ];
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Only ${allowedExtensions.join(', ')} files are allowed`));
    }
  }
});

/**
 * Upload a file for a post
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadPostFile = async (req, res) => {
  try {
    // Check if file exists in the request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Check storage type (S3 or local)
    const storageType = req.body.storage_type || 'local';
    let fileUrl;
    
    if (storageType === 's3') {
      // Upload to S3
      fileUrl = await s3Service.uploadFile(req.file, 'posts/');
    } else {
      // Local storage (for backward compatibility)
      const localPath = `/uploads/posts/${req.file.filename}`;
      const destPath = path.join(__dirname, `../public${localPath}`);
      
      // Ensure destination directory exists
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Move file from temp directory to public uploads
      fs.renameSync(req.file.path, destPath);
      
      // Set local file URL
      fileUrl = localPath;
    }
    
    // Return the file URL
    return res.status(200).json({
      success: true,
      file_url: fileUrl
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error uploading file'
    });
  }
};

/**
 * Upload a file for an assignment submission
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadAssignmentFile = async (req, res) => {
  try {
    // Check if file exists in the request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Check storage type (S3 or local)
    const storageType = req.body.storage_type || 'local';
    let fileUrl;
    
    if (storageType === 's3') {
      // Upload to S3
      fileUrl = await s3Service.uploadFile(req.file, 'assignments/');
    } else {
      // Local storage (for backward compatibility)
      const localPath = `/uploads/assignments/${req.file.filename}`;
      const destPath = path.join(__dirname, `../public${localPath}`);
      
      // Ensure destination directory exists
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Move file from temp directory to public uploads
      fs.renameSync(req.file.path, destPath);
      
      // Set local file URL
      fileUrl = localPath;
    }
    
    // Return the file URL
    return res.status(200).json({
      success: true,
      file_url: fileUrl
    });
  } catch (error) {
    console.error('Error uploading assignment file:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error uploading assignment file'
    });
  }
};

/**
 * Delete a file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteFile = async (req, res) => {
  try {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'File URL is required'
      });
    }
    
    // Check if it's an S3 URL or local file
    if (fileUrl.includes('amazonaws.com')) {
      // Delete from S3
      await s3Service.deleteFile(fileUrl);
    } else {
      // Delete local file
      const localPath = path.join(__dirname, `../public${fileUrl}`);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting file'
    });
  }
};

export {
  upload,
  uploadPostFile,
  uploadAssignmentFile,
  deleteFile
}; 