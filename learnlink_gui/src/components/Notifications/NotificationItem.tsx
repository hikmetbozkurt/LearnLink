import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaEnvelope, FaUsers, FaUserFriends, FaBook, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
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
    e.stopPropagation(); // Prevent triggering the parent div's click
    try {
      await api.put(`/api/notifications/${notification.notifications_id}/read`);
      onMarkAsRead(notification.notifications_id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleClick = async () => {
    // Mark as read if not already read
    if (!notification.read) {
      try {
        await api.put(`/api/notifications/${notification.notifications_id}/read`);
        onMarkAsRead(notification.notifications_id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'private_message':
        // Get or create DM conversation and navigate to it
        try {
          const response = await api.post('/api/direct-messages', {
            recipientId: notification.sender_id
          });
          navigate('/direct-messages', {
            state: {
              selectedChat: {
                id: String(response.data.id),
                name: notification.sender_name
              }
            }
          });
        } catch (error) {
          console.error('Error navigating to direct message:', error);
        }
        break;

      case 'chatroom_message':
        navigate('/chatrooms', {
          state: { selectedRoom: String(notification.reference_id) }
        });
        break;

      // Add other cases as needed
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'private_message':
        return <FaEnvelope className="notification-icon private-message" />;
      case 'chatroom_message':
        return <FaUsers className="notification-icon chatroom-message" />;
      case 'friend_request':
        return <FaUserFriends className="notification-icon friend-request" />;
      case 'course_update':
        return <FaBook className="notification-icon course-update" />;
      case 'request_accepted':
        return <FaCheckCircle className="notification-icon request-accepted" />;
      case 'request_rejected':
        return <FaTimesCircle className="notification-icon request-rejected" />;
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