import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface Event {
    event_id: number;
    title: string;
    description: string;
    date: string;
    type: 'assignment' | 'exam' | 'meeting' | 'other';
    created_at: string;
    updated_at: string;
}

const eventService = {
    async getAllEvents(): Promise<Event[]> {
        const response = await axios.get(`${API_BASE_URL}/events`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    async createEvent(eventData: Omit<Event, 'event_id' | 'created_at' | 'updated_at'>): Promise<Event> {
        const response = await axios.post(`${API_BASE_URL}/events`, eventData, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    async updateEvent(eventId: number, eventData: Partial<Omit<Event, 'event_id' | 'created_at' | 'updated_at'>>): Promise<Event> {
        const response = await axios.put(`${API_BASE_URL}/events/${eventId}`, eventData, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    async deleteEvent(eventId: number): Promise<void> {
        await axios.delete(`${API_BASE_URL}/events/${eventId}`, {
            headers: getAuthHeaders()
        });
    },

    async clearPastEvents(): Promise<{count: number}> {
        const response = await axios.delete(`${API_BASE_URL}/events/past/clear`, {
            headers: getAuthHeaders()
        });
        return response.data;
    }
};

export default eventService; 