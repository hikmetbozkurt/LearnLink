import axios from 'axios';
import api from '../api/axiosConfig';

export interface Notification {
  notification_id: string;
  recipient_id: string;
  sender_id?: string;
  sender_name?: string;
  content: string;
  type: 'assignment' | 'message' | 'announcement' | 'grade' | 'system';
  reference_id?: string;
  timestamp: string;
  is_read: boolean;
}

export const notificationService = {
  // Get all notifications for the current user
  getNotifications: async (): Promise<Notification[]> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      const response = await api.get('/api/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },
  
  // Mark a notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      await api.put(`/api/notifications/${notificationId}/read`, {});
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      await api.put('/api/notifications/read-all', {});
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },
  
  // Create assignment notification
  createAssignmentNotification: async (courseId: string, assignmentId: string, assignmentTitle: string): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      // Use api config instead of axios directly
      await api.post('/api/notifications/assignment', {
        course_id: courseId,
        assignment_id: assignmentId,
        title: assignmentTitle
      });
    } catch (error) {
      console.error('Error creating assignment notification:', error);
      throw error;
    }
  },
  
  // Delete a notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      await api.delete(`/api/notifications/${notificationId}`);
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      throw error;
    }
  },
  
  // Clear all notifications
  clearAllNotifications: async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    
    try {
      await api.delete('/api/notifications/clear');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  }
}; 