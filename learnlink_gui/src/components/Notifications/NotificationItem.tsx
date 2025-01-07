import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaEnvelope, FaUsers, FaUserFriends } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import api from '../../api/axiosConfig';
import './NotificationItem.css';

interface NotificationItemProps {
  notification: {
    notifications_id: number;
    content: string;
    type: string;
    created_at: string;
    read: boolean;
    reference_id: number;
    sender_id: number;
    sender_name?: string;
  };
  onMarkAsRead: (id: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
  const navigate = useNavigate();

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.put(`/api/notifications/${notification.notifications_id}/read`);
      onMarkAsRead(notification.notifications_id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleClick = async () => {
    console.log('Notification clicked:', notification);

    // Mark as read first
    if (!notification.read) {
      try {
        await api.put(`/api/notifications/${notification.notifications_id}/read`);
        onMarkAsRead(notification.notifications_id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Handle navigation based on type
    try {
      switch (notification.type) {
        case 'friend_request':
          console.log('Navigating to connections page');
          window.location.href = '/connections';
          break;

        case 'private_message':
          const response = await api.post('/api/direct-messages', {
            recipientId: notification.sender_id
          });
          window.location.href = '/direct-messages';
          break;

        case 'chat_message':
          window.location.href = '/chatrooms';
          break;

        default:
          console.log('Unknown notification type:', notification.type);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'private_message':
        return <FaEnvelope className="notification-icon private-message" />;
      case 'chat_message':
        return <FaUsers className="notification-icon chatroom-message" />;
      case 'friend_request':
        return <FaUserFriends className="notification-icon friend-request" />;
      default:
        return <FaBell className="notification-icon" />;
    }
  };

  return (
    <div 
      className={`notification-item ${notification.read ? 'read' : 'unread'}`}
      onClick={handleClick}
    >
      <div className="notification-icon-container">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="notification-content">
        <p>{notification.content}</p>
        <small>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</small>
      </div>
      {!notification.read && (
        <button 
          className="mark-read-button"
          onClick={handleMarkAsRead}
        >
          Mark as read
        </button>
      )}
    </div>
  );
};

export default NotificationItem; 