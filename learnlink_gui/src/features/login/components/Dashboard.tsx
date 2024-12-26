import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { FaBell, FaUser, FaEnvelope, FaGraduationCap, FaSignOutAlt, FaCaretDown } from 'react-icons/fa';
import styled from 'styled-components';
import api from '../../../api/axiosConfig';
import './dashboard_style.css';

const SOCKET_URL = 'http://localhost:5001';

// Styled components for icons
const StyledUserIcon = styled(FaUser)`
  font-size: 1.5rem;
  margin-right: 0.8rem;
`;

const StyledEnvelopeIcon = styled(FaEnvelope)`
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #6B4EE6;
`;

const StyledGraduationCapIcon = styled(FaGraduationCap)`
  font-size: 2rem;
  color: #6B4EE6;
`;

const StyledCaretDownIcon = styled(FaCaretDown)`
  margin-left: 4px;
  font-size: 1rem;
  color: #666;
`;

const HeaderLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  .logo-icon {
    font-size: 2rem;
    color: #6B4EE6;
  }
  
  span {
    font-size: 1.5rem;
    font-weight: 600;
    color: #6B4EE6;
  }
`;

const NotificationsPanel = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  width: 300px;
  max-height: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow-y: auto;
  z-index: 1000;
  margin-top: 0.5rem;
`;

const NotificationItem = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  
  &:hover {
    background: #f5f5f5;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const UserMenuContainer = styled.div`
  position: relative;
  cursor: pointer;
`;

const UserMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  z-index: 1000;
`;

const MenuItem = styled.div`
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  
  &:hover {
    background: #f5f5f5;
  }
`;

interface Message {
  id: string;
  message_id?: number;
  sender_id: number;
  receiver_id: number;
  sender_name: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface User {
  user_id: number;
  name: string;
  email: string;
  role: string;
  unread_messages?: number;
}

interface Notification {
  id: string;
  sender_name: string;
  content: string;
  timestamp: string;
  read: boolean;
}

const formatMessageTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    // If message is from today, show only time
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }

    // If message is from this year, show date and time
    if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // If message is from previous years, show full date
    return date.toLocaleDateString([], { 
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Time unavailable';
  }
};

const Dashboard = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<number>(0);
  const socketRef = useRef<any>(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/');
      return;
    }
    
    const userData = JSON.parse(userStr);
    const transformedUser: User = {
      user_id: userData.id || userData.user_id,
      name: userData.name,
      email: userData.email,
      role: userData.role
    };
    
    setCurrentUser(transformedUser);
    fetchStudents();

    // Socket connection
    socketRef.current = io(SOCKET_URL);

    // Register user with socket
    socketRef.current.emit('user_connected', transformedUser.user_id);
    console.log('Emitted user_connected with ID:', transformedUser.user_id);

    // Listen for incoming messages
    socketRef.current.on('receive_message', (message: Message) => {
      console.log('Received message:', message);
      setMessages(prev => [...prev, message]);
      handleNewMessage(message);
    });

    // Listen for sent message confirmation
    socketRef.current.on('message_sent', (message: Message) => {
      console.log('Message sent confirmation:', message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [navigate]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching students...');

      if (!token) {
        console.error('No auth token found');
        navigate('/');
        return;
      }

      const response = await api.get('/api/users/students', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Students response:', response.data);
      
      if (response.data.success) {
        const filteredStudents = response.data.data.filter((user: User) => 
          user.user_id !== currentUser?.user_id
        );
        console.log('Filtered students:', filteredStudents);
        setStudents(filteredStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleUserSelect = async (user: User) => {
    try {
      console.log('Selected user:', user);
      setSelectedUser(user);
      
      if (!currentUser?.user_id) {
        console.error('No current user ID found');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await api.get(`/api/messages/${currentUser.user_id}/${user.user_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setMessages(response.data.data);
      }
      setNotifications(0);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !currentUser) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    const messageData: Message = {
      id: Date.now().toString(),
      sender_id: currentUser.user_id,
      receiver_id: selectedUser.user_id,
      content: newMessage,
      timestamp: new Date().toISOString(),
      sender_name: currentUser.name,
      read: false
    };

    try {
      console.log('Sending message:', messageData);
      
      // Send to backend API with token
      await api.post('/api/messages', messageData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Emit through socket
      socketRef.current.emit('private_message', messageData);
      
      // Update local state
      setMessages(prev => [...prev, messageData]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleNewMessage = (message: Message) => {
    if (!selectedUser || selectedUser.user_id !== message.sender_id) {
      setNotifications(prev => prev + 1);
      setNotificationsList(prev => [{
        id: message.id,
        sender_name: message.sender_name,
        content: message.content,
        timestamp: message.timestamp,
        read: false
      }, ...prev]);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleNotificationItemClick = (notification: Notification) => {
    // Find the sender in students list
    const sender = students.find(student => student.name === notification.sender_name);
    if (sender) {
      handleUserSelect(sender);
      setShowNotifications(false);
      setNotifications(0);
      setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="dashboard-main">
      <div className="dashboard-header">
        <HeaderLogo>
          <StyledGraduationCapIcon />
          <span>LearnLink</span>
        </HeaderLogo>
        <div className="header-actions">
          <div className="notification-icon" onClick={handleNotificationClick}>
            <FaBell />
            {notifications > 0 && <span className="notification-badge">{notifications}</span>}
            {showNotifications && (
              <NotificationsPanel className="notifications-panel">
                {notificationsList.length === 0 ? (
                  <NotificationItem>No new notifications</NotificationItem>
                ) : (
                  notificationsList.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      onClick={() => handleNotificationItemClick(notification)}
                      className="notification-item"
                    >
                      <div className="notification-sender">{notification.sender_name}</div>
                      <div className="notification-preview">{notification.content}</div>
                      <div className="notification-time">{formatMessageTime(notification.timestamp)}</div>
                    </NotificationItem>
                  ))
                )}
              </NotificationsPanel>
            )}
          </div>
          <div className="user-profile">
            <UserMenuContainer onClick={() => setShowUserMenu(!showUserMenu)}>
              <StyledUserIcon />
              <span>{currentUser?.name}</span>
              <StyledCaretDownIcon />
              {showUserMenu && (
                <UserMenu>
                  <MenuItem onClick={handleLogout}>
                    <FaSignOutAlt />
                    Logout
                  </MenuItem>
                </UserMenu>
              )}
            </UserMenuContainer>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="users-sidebar">
          <h2>Students</h2>
          {students.length === 0 ? (
            <div className="no-students">
              <p>No other students available</p>
            </div>
          ) : (
            <div className="users-list">
              {students.map((user: User) => (
                <div
                  key={user.user_id}
                  className={`user-item ${selectedUser?.user_id === user.user_id ? 'active' : ''}`}
                  onClick={() => handleUserSelect(user)}
                >
                  <StyledUserIcon />
                  <div className="user-info">
                    <span className="user-name">{user.name}</span>
                    {user.unread_messages && user.unread_messages > 0 && (
                      <span className="unread-badge">{user.unread_messages}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chat-section">
          {selectedUser ? (
            <>
              <div className="chat-header">
                <h2>Chat with {selectedUser.name}</h2>
              </div>
              
              <div className="messages-container">
                {messages.map((msg) => (
                  <div 
                    key={msg.id || msg.message_id || Date.now() + Math.random()} 
                    className={`message ${msg.sender_id === currentUser?.user_id ? 'sent' : 'received'}`}
                  >
                    <div className="message-sender">{msg.sender_name}</div>
                    <div className="message-content">{msg.content}</div>
                    <div className="message-timestamp">
                      {formatMessageTime(msg.timestamp)}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="message-form">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="message-input"
                />
                <button type="submit" className="send-button">Send</button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <StyledEnvelopeIcon />
              <p>Select a user to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 