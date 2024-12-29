import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FaBell, FaComment } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import '../styles/components/NotificationBell.css';
import { io } from 'socket.io-client';

interface ChatNotification {
  notifications_id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  chatroom_id: number;
  read: boolean;
  created_at: string;
  updated_at: string;
  // Additional fields from joins
  sender_name?: string;
  chatroom_name?: string;
}

export interface NotificationBellRef {
  addNotification: (data: {
    sender_id: number;
    content: string;
    chatroom_id: number;
  }) => void;
}

const NotificationBell = forwardRef<NotificationBellRef, {}>((props, ref) => {
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const socket = io('http://localhost:5001');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    socket.on('connect', () => {
      console.log('Connected to notification socket');
      socket.emit('user_connected', user.id);
    });

    socket.on('new_notification', (notification) => {
      const newNotification: ChatNotification = {
        notifications_id: Date.now(),
        sender_id: -1, // Will be updated when fetching notifications
        recipient_id: user.id,
        content: notification.content,
        chatroom_id: notification.chatroom_id,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender_name: notification.sender_name,
        chatroom_name: notification.chatroom_name
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await api.get(`/api/notifications/user/${user.id}`);
      if (response.data.success) {
        setNotifications(response.data.data);
        const count = response.data.data.filter((notif: ChatNotification) => !notif.read).length;
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('No new notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId?: number) => {
    try {
      if (notificationId) {
        await api.put(`/api/notifications/${notificationId}/read`);
        setNotifications(notifications.map(notif => 
          notif.notifications_id === notificationId ? { ...notif, read: true } : notif
        ));
      } else {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        await api.put(`/api/notifications/read-all/${user.id}`);
        setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      }
      updateUnreadCount();
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleNotificationClick = (notification: ChatNotification) => {
    markAsRead(notification.notifications_id);
    navigate(`/chatrooms?room=${notification.chatroom_id}`);
    setShowDropdown(false);
  };

  const clearNotifications = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await api.delete(`/api/notifications/clear/${user.id}`);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const updateUnreadCount = () => {
    const count = notifications.filter(notif => !notif.read).length;
    setUnreadCount(count);
  };

  useEffect(() => {
    updateUnreadCount();
  }, [notifications]);

  useImperativeHandle(ref, () => ({
    addNotification: async (data: {
      sender_id: number;
      content: string;
      chatroom_id: number;
    }) => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const newNotification: ChatNotification = {
        notifications_id: Date.now(),
        sender_id: data.sender_id,
        recipient_id: user.id,
        content: data.content,
        chatroom_id: data.chatroom_id,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setNotifications(prev => [newNotification, ...prev]);
    }
  }));

  const handleClick = () => {
    setShowDropdown(!showDropdown);
    if (showDropdown && unreadCount > 0) {
      markAsRead();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container">
      <button className="notification-bell" onClick={handleClick}>
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Messages</h3>
            {notifications.length > 0 && (
              <button 
                className="clear-all"
                onClick={clearNotifications}
              >
                Clear all
              </button>
            )}
          </div>
          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : error ? (
              <div className="notification-message">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">
                No new messages
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.notifications_id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    <FaComment className="notification-type-icon" />
                  </div>
                  <div className="notification-content">
                    <div className="notification-message">
                      <strong>{notification.sender_name || 'User'}</strong> in{' '}
                      <strong>{notification.chatroom_name || 'Chat'}</strong>
                    </div>
                    <p>{notification.content}</p>
                    <span className="notification-time">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default NotificationBell; 