/**
 * File Upload Routes for LearnLink
 * 
 * Handles routes for file uploads and downloads
 */

import express from 'express';
import * as fileController from '../controllers/fileUploadController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Route for uploading post files
router.post('/upload/post', fileController.upload.single('file'), fileController.uploadPostFile);

// Route for uploading assignment files
router.post('/upload/assignment', fileController.upload.single('file'), fileController.uploadAssignmentFile);

// Route for deleting files
router.delete('/delete', fileController.deleteFile);

export default router; 