import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
    createEvent,
    getEvents,
    updateEvent,
    deleteEvent,
    deletePastEvents,
    getUpcomingEvents
} from '../controllers/eventController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create a new event
router.post('/', createEvent);

// Get all events
router.get('/', getEvents);

// Get upcoming events for a specific user
router.get('/upcoming/:userId', getUpcomingEvents);

// Update an event
router.put('/:event_id', updateEvent);

// Delete an event
router.delete('/:event_id', deleteEvent);

// Delete all past events
router.delete('/past/clear', deletePastEvents);

export default router; 