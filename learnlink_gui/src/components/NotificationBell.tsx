import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FaBell, FaComment, FaEye, FaTrash, FaUserPlus, FaUserFriends } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useToast } from './ToastProvider';
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

interface NotificationBellProps {
  isOpen: boolean;
  onToggle: () => void;
}

const NotificationBell = forwardRef<NotificationBellRef, NotificationBellProps>((props, ref) => {
  const { isOpen, onToggle } = props;
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/notifications');
      if (response.data) {
        setNotifications(response.data);
        const unreadNotifs = response.data.filter((notif: ChatNotification) => !notif.read);
        setUnreadCount(unreadNotifs.length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showToast('Failed to load notifications', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Socket connection for real-time notifications
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io('http://localhost:5001', {
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
      auth: {
        token: token.replace(/['"]+/g, '')
      }
    });

    socket.on('connect', () => {
      console.log('Connected to notification socket');
    });

    socket.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Mark notification as read
  const handleNotificationClick = async (notification: ChatNotification) => {
    try {
      if (!notification.read) {
        await api.put(`/api/notifications/${notification.notifications_id}/read`);
        setNotifications(prev =>
          prev.map(n =>
            n.notifications_id === notification.notifications_id
              ? { ...n, read: true }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      if (notification.chatroom_id) {
        navigate(`/chatrooms?room=${notification.chatroom_id}`);
        onToggle();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showToast('Failed to update notification', 'error');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      onToggle();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      showToast('Failed to mark all as read', 'error');
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      await api.delete('/api/notifications/clear');
      setNotifications([]);
      setUnreadCount(0);
      onToggle();
    } catch (error) {
      console.error('Error clearing notifications:', error);
      showToast('Failed to clear notifications', 'error');
    }
  };

  // Format timestamp
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

  // Get notification icon based on content
  const getNotificationIcon = (notification: ChatNotification) => {
    if (notification.content.includes('friend request')) {
      return <FaUserPlus />;
    } else if (notification.content.includes('accepted your friend request')) {
      return <FaUserFriends />;
    } else {
      return <FaComment />;
    }
  };

  // Expose addNotification method
  useImperativeHandle(ref, () => ({
    addNotification: (data) => {
      const newNotification: ChatNotification = {
        notifications_id: Date.now(),
        sender_id: data.sender_id,
        recipient_id: parseInt(localStorage.getItem('userId') || '0'),
        content: data.content,
        chatroom_id: data.chatroom_id,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    }
  }));

  return (
    <div className="notification-bell-container">
      <button 
        className={`notification-bell ${isOpen ? 'active' : ''}`} 
        onClick={onToggle}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <div className="notification-actions">
                <button 
                  className="icon-button"
                  onClick={markAllAsRead} 
                  title="Mark all as read"
                >
                  <FaEye />
                </button>
                <button 
                  className="icon-button"
                  onClick={clearAllNotifications}
                  title="Clear all notifications"
                >
                  <FaTrash />
                </button>
              </div>
            )}
          </div>
          <div className="notification-list">
            {isLoading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">
                No notifications
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.notifications_id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification)}
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">{notification.content}</p>
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