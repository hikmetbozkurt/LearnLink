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
        console.log('Getting all events from API');
        const response = await api.get(`${API_BASE_URL}/events`);
        console.log('Events received:', response.data);
        return response.data;
    },

    async createEvent(eventData: Omit<Event, 'event_id' | 'created_at' | 'updated_at'>): Promise<Event> {
        console.log('Creating event with data:', eventData);
        const response = await api.post(`${API_BASE_URL}/events`, eventData);
        console.log('Event created:', response.data);
        return response.data;
    },

    async updateEvent(eventId: number, eventData: Partial<Omit<Event, 'event_id' | 'created_at' | 'updated_at'>>): Promise<Event> {
        console.log(`Updating event ${eventId} with data:`, eventData);
        const response = await api.put(`${API_BASE_URL}/events/${eventId}`, eventData);
        console.log('Event updated:', response.data);
        return response.data;
    },

    async deleteEvent(eventId: number): Promise<void> {
        console.log(`Deleting event ${eventId}`);
        await api.delete(`${API_BASE_URL}/events/${eventId}`);
        console.log(`Event ${eventId} deleted`);
    },

    async clearPastEvents(): Promise<{count: number}> {
        console.log('Clearing past events');
        const response = await api.delete(`${API_BASE_URL}/events/past/clear`);
        console.log('Past events cleared:', response.data);
        return response.data;
    }
};

export default eventService; 