import axios from 'axios';
import api from '../api/axiosConfig';

// We'll keep API_BASE_URL for building URLs, but use the configured api instance for requests
const API_BASE_URL = '/api';

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
        const response = await api.get(`${API_BASE_URL}/events`);
        return response.data;
    },

    async createEvent(eventData: Omit<Event, 'event_id' | 'created_at' | 'updated_at'>): Promise<Event> {
        const response = await api.post(`${API_BASE_URL}/events`, eventData);
        return response.data;
    },

    async updateEvent(eventId: number, eventData: Partial<Omit<Event, 'event_id' | 'created_at' | 'updated_at'>>): Promise<Event> {
        const response = await api.put(`${API_BASE_URL}/events/${eventId}`, eventData);
        return response.data;
    },

    async deleteEvent(eventId: number): Promise<void> {
        await api.delete(`${API_BASE_URL}/events/${eventId}`);
    },

    async clearPastEvents(): Promise<{count: number}> {
        const response = await api.delete(`${API_BASE_URL}/events/past/clear`);
        return response.data;
    }
};

export default eventService; 