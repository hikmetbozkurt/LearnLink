import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
    createEvent,
    getEvents,
    updateEvent,
    deleteEvent
} from '../controllers/eventController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create a new event
router.post('/', createEvent);

// Get all events
router.get('/', getEvents);

// Update an event
router.put('/:event_id', updateEvent);

// Delete an event
router.delete('/:event_id', deleteEvent);

export default router; 