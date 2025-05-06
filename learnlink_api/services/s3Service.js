/**
 * AWS S3 Service for LearnLink
 * 
 * This service handles file uploads and downloads to/from AWS S3
 */

// Use dynamic import for aws-sdk since it's a CommonJS module
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const AWS = require('aws-sdk');

import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import config from '../config/env.js';

// Configure AWS with credentials from config
AWS.config.update({
  accessKeyId: config.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  region: config.AWS_REGION
});

// Create S3 service object
const s3 = new AWS.S3();

// Bucket name from config
const BUCKET_NAME = config.AWS_BUCKET_NAME;

/**
 * Uploads a file to S3
 * @param {Object} file - The file to upload (from multer middleware)
 * @param {string} folderPath - The folder path within the bucket (e.g., 'assignments/', 'posts/')
 * @returns {Promise<string>} - The URL of the uploaded file
 */
const uploadFile = async (file, folderPath = '') => {
  return new Promise(async (resolve, reject) => {
    // Set a timeout to prevent hanging uploads
    const uploadTimeout = setTimeout(() => {
      console.error(`S3 upload timeout for file: ${file?.originalname || 'unknown'}`);
      reject(new Error('S3 upload timed out after 30 seconds'));
    }, 30000); // 30 seconds timeout
    
    try {
      if (!file) {
        clearTimeout(uploadTimeout);
        throw new Error('No file provided');
      }

      // Validate file path exists
      if (!file.path || !fs.existsSync(file.path)) {
        clearTimeout(uploadTimeout);
        console.error('File path does not exist:', file.path);
        throw new Error('File path not found');
      }

      // Check AWS config is valid
      if (!config.AWS_ACCESS_KEY_ID || !config.AWS_SECRET_ACCESS_KEY || !config.AWS_BUCKET_NAME) {
        clearTimeout(uploadTimeout);
        console.error('AWS configuration is incomplete');
        throw new Error('AWS configuration is missing required values');
      }

      // Create a unique file name to prevent collisions
      const fileExtension = path.extname(file.originalname);
      const fileName = `${folderPath}${Date.now()}-${uuidv4()}${fileExtension}`;
      
      // Read file into buffer instead of using stream to avoid potential stream issues
      const fileContent = fs.readFileSync(file.path);
      
      // Determine if this file type should be downloaded rather than displayed inline
      const downloadableTypes = ['.txt', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar'];
      const isPdf = fileExtension.toLowerCase() === '.pdf';
      const isDownloadable = downloadableTypes.includes(fileExtension.toLowerCase());
      
      // Set up the upload parameters
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileContent,
        ContentType: file.mimetype,
        ACL: 'public-read', // Make the file publicly accessible
      };
      
      // Add ContentDisposition header based on file type
      if (isDownloadable) {
        // Force download for office and archive files
        uploadParams.ContentDisposition = `attachment; filename="${encodeURIComponent(file.originalname)}"`;
      } else if (isPdf) {
        // For PDFs, set to inline to allow browser viewing
        uploadParams.ContentDisposition = `inline; filename="${encodeURIComponent(file.originalname)}"`;
      }

      // Log upload attempt in development only
      if (process.env.NODE_ENV !== 'production') {
        console.log(`S3 upload attempt: ${fileName}, size: ${fileContent.length} bytes, type: ${file.mimetype}`);
      }

      // Upload the file
      const result = await s3.upload(uploadParams).promise();
      
      // Clean up the temporary file with error handling
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (unlinkError) {
        console.error('Error deleting temporary file (non-critical):', unlinkError);
        // Continue despite file deletion error
      }
      
      // Success log only in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(`S3 upload successful: ${result.Location}`);
      }
      
      // Clear the timeout and resolve with the file URL
      clearTimeout(uploadTimeout);
      resolve(result.Location);
    } catch (error) {
      // Clear the timeout and reject with the error
      clearTimeout(uploadTimeout);
      console.error('Error uploading file to S3:', error);
      reject(error);
    }
  });
};

/**
 * Deletes a file from S3
 * @param {string} fileUrl - The URL of the file to delete
 * @returns {Promise<boolean>} - Success status
 */
const deleteFile = async (fileUrl) => {
  try {
    // Extract the key from the file URL
    const key = fileUrl.split(`${BUCKET_NAME}/`)[1];
    
    if (!key) {
      throw new Error('Invalid file URL');
    }
    
    // Set up the delete parameters
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: key
    };
    
    // Delete the file
    await s3.deleteObject(deleteParams).promise();
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};

/**
 * Gets a signed URL for temporary access to a private file
 * @param {string} key - The key (path) of the file in S3
 * @param {number} expiresIn - Time in seconds before the URL expires (default: 60 seconds)
 * @returns {Promise<string>} - The signed URL
 */
const getSignedUrl = async (key, expiresIn = 60) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn
    };
    
    return s3.getSignedUrl('getObject', params);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
};

/**
 * Sets the CORS configuration for the S3 bucket
 * This should be called when your app initializes
 */
const configureBucketCORS = async () => {
  try {
    const corsConfig = {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          // Allow both production URLs and development URLs
          AllowedOrigins: [
            'http://localhost:3000',
            'https://localhost:3000',
            'http://learnlink-v1-env.eba-b28u347j.eu-north-1.elasticbeanstalk.com',
            'https://learnlink-v1-env.eba-b28u347j.eu-north-1.elasticbeanstalk.com',
            'http://learnlink.co',
            'https://learnlink.co',
            'https://*.learnlink.co',
            'http://*.learnlink.co',
            '*' // As a fallback - remove this in production for better security
          ],
          ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type', 'Content-Disposition', 'x-amz-*'],
          MaxAgeSeconds: 3600
        }
      ]
    };
    
    await s3.putBucketCors({
      Bucket: BUCKET_NAME,
      CORSConfiguration: corsConfig
    }).promise();
    

    return true;
  } catch (error) {
    console.error('Error setting CORS configuration for S3 bucket:', error);
    // Don't throw error as this is not critical for app functionality
    return false;
  }
};

export {
  uploadFile,
  deleteFile,
  getSignedUrl,
  configureBucketCORS,
  s3,
  BUCKET_NAME
}; 