import pool from "../config/database.js";

// Create a new event
export const createEvent = async (req, res) => {
    try {
        const { title, description, date, type, course_id } = req.body;
        const created_by = req.user.user_id;

        const query = `
            INSERT INTO events (title, description, date, type, created_by, course_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        
        const result = await pool.query(query, [title, description, date, type, created_by, course_id]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
};

// Get all events for a user
export const getEvents = async (req, res) => {
    try {
        console.log('User object:', req.user);
        
        if (!req.user || !req.user.user_id) {
            console.error('No user or user_id found in request');
            return res.status(401).json({ error: 'User not authenticated properly' });
        }

        const userId = req.user.user_id;
        console.log('Fetching events for user:', userId);

        const query = `
            SELECT *
            FROM events
            WHERE created_by = $1
            ORDER BY date ASC
        `;
        
        console.log('Executing query:', query);
        console.log('With userId:', userId);

        const result = await pool.query(query, [userId]);
        console.log('Query result:', result.rows);

        res.json(result.rows);
    } catch (error) {
        console.error('Detailed error in getEvents:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Failed to fetch events',
            details: error.message,
            code: error.code
        });
    }
};

// Update an event
export const updateEvent = async (req, res) => {
    try {
        const { event_id } = req.params;
        const { title, description, date, type, course_id } = req.body;
        const userId = req.user.user_id;
        
        const query = `
            UPDATE events
            SET title = $1, 
                description = $2, 
                date = $3, 
                type = $4, 
                course_id = $5
            WHERE event_id = $6 AND created_by = $7
            RETURNING *
        `;
        
        const result = await pool.query(query, [title, description, date, type, course_id, event_id, userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found or unauthorized' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
};

// Delete an event
export const deleteEvent = async (req, res) => {
    try {
        const { event_id } = req.params;
        const userId = req.user.user_id;
        
        const query = `
            DELETE FROM events
            WHERE event_id = $1 AND created_by = $2
            RETURNING event_id
        `;
        
        const result = await pool.query(query, [event_id, userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found or unauthorized' });
        }
        
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};

// Delete all past events
export const deletePastEvents = async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        const query = `
            DELETE FROM events
            WHERE date < NOW() AND created_by = $1
            RETURNING event_id
        `;
        
        const result = await pool.query(query, [userId]);
        
        res.json({ 
            message: 'Past events deleted successfully',
            count: result.rowCount
        });
    } catch (error) {
        console.error('Error deleting past events:', error);
        res.status(500).json({ error: 'Failed to delete past events' });
    }
}; 