import React, { useState, ChangeEvent, FormEvent, useEffect, useRef } from 'react';
import { FaPlus, FaSearch, FaTimes } from 'react-icons/fa';
import { io, Socket as SocketIOClient } from 'socket.io-client';
import api from '../api/axiosConfig';
import '../styles/pages/chatrooms.css';
import { Message } from '../types/message';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/ToastProvider';

// Socket interface'lerini tanımlayalım
interface ServerToClientEvents {
  receive_message: (message: Message) => void;
  new_chatroom: (chatroom: ChatRoom) => void;
  connect_error: (error: Error) => void;
  disconnect: (reason: string) => void;
  reconnect: (attemptNumber: number) => void;
}

interface ClientToServerEvents {
  user_connected: (userId: string) => void;
  join_room: (roomId: string) => void;
  leave_room: (roomId: string) => void;
  send_message: (data: { roomId: string; message: string; userId: string }) => void;
}

type SocketType = SocketIOClient<ServerToClientEvents, ClientToServerEvents>;

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  lastMessage?: string;
  memberCount?: number;
}

interface FormData {
  roomName: string;
  description: string;
}

const SOCKET_URL = 'http://localhost:5001';

const ChatroomsPage = () => {
  const { showToast } = useToast();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<FormData>({
    roomName: '',
    description: ''
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<SocketType | null>(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Chat odalarını yükle
  useEffect(() => {
    const fetchChatRooms = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/chatrooms');
        // Ensure we're setting an array
        setChatRooms(Array.isArray(response.data.data) ? response.data.data : []);
        console.log('Fetched chatrooms:', response.data);
      } catch (err) {
        console.error('Error fetching chatrooms:', err);
        setError('Failed to load chat rooms');
        setChatRooms([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatRooms();
  }, []);

  // Seçili odanın mesajlarını yükle
  useEffect(() => {
    if (selectedRoom) {
      const fetchMessages = async () => {
        try {
          const response = await api.get(`/api/chatrooms/${selectedRoom}/messages`);
          // Ensure we're setting an array of messages
          setMessages(Array.isArray(response.data.data) ? response.data.data : []);
          console.log('Fetched messages:', response.data);
        } catch (err) {
          console.error('Error fetching messages:', err);
          setError('Failed to load messages');
          setMessages([]); // Set empty array on error
        }
      };

      fetchMessages();
    } else {
      setMessages([]); // Clear messages when no room is selected
    }
  }, [selectedRoom]);

  useEffect(() => {
    // Socket.IO bağlantısını kur
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    socketRef.current = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: token.replace(/['"]+/g, '')
      }
    });

    const socket = socketRef.current;

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to chat server');
      // Don't clear auth data here
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to chat server after', attemptNumber, 'attempts');
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from chat server:', reason);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Socket event listeners
    socket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      if (user.id || user.user_id) {
        socket.emit('user_connected', (user.id || user.user_id).toString());
      }
    });

    socket.on('receive_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socket.on('new_chatroom', (chatroom: ChatRoom) => {
      setChatRooms(prev => [...prev, chatroom]);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []); // Empty dependency array since we want this to run once

  const handleCreateRoom = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('=== Create Room Process Started ===');
      console.log('Form Data:', formData);
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('User:', user);

      if (!token || !user.id) {
        console.error('Authentication missing:', { token: !!token, userId: user.id });
        throw new Error('Authentication required');
      }

      // Remove any quotes from the token if present
      const cleanToken = token.replace(/['"]+/g, '');
      
      console.log('Making API request to create room...');
      const response = await api.post('/api/chatrooms', 
        {
          name: formData.roomName,
          description: formData.description
        },
        {
          headers: {
            'Authorization': `Bearer ${cleanToken}`
          }
        }
      );

      console.log('API Response:', response.data);

      if (response.data) {
        console.log('Room created successfully, updating state...');
        setChatRooms(prev => [...prev, response.data.data]);
        setFormData({ roomName: '', description: '' });
        setShowCreateRoom(false);
      }
    } catch (err: any) {
      console.error('Error in handleCreateRoom:', {
        error: err,
        response: err.response,
        message: err.message
      });
      setError(err.response?.data?.message || 'Failed to create chat room');
    } finally {
      setIsLoading(false);
      console.log('=== Create Room Process Ended ===');
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      await api.post(`/api/chatrooms/${roomId}/join`);
      setSelectedRoom(roomId);
      setShowCreateRoom(false);
      
      if (socketRef.current) {
        socketRef.current.emit('join_room', roomId);
      }
    } catch (err) {
      setError('Failed to join room');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedRoom || !newMessage.trim() || !socketRef.current) return;

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Create the message in the format the server expects
      const messageToServer = {
        roomId: selectedRoom.toString(),
        message: newMessage.trim(),
        userId: user.id.toString()
      };

      // Create a temporary local message for immediate display
      const localMessage: Message = {
        id: -1, // temporary ID until server assigns one
        content: newMessage.trim(),
        sender_id: parseInt(user.id),
        sender_name: user.name,
        chatroom_id: parseInt(selectedRoom.toString()),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add to local state for immediate feedback
      setMessages(prev => [...prev, localMessage]);
      
      // Send to server
      await socketRef.current.emit('send_message', messageToServer);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Add this useEffect to handle scrolling when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add this useEffect to handle scrolling when a room is selected
  useEffect(() => {
    if (selectedRoom) {
      scrollToBottom();
    }
  }, [selectedRoom]);

  const renderMessages = () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    return (
      <>
        {messages.map((message, index) => {
          const isSelf = message.sender_id === currentUser.id;
          
          return (
            <div
              key={index}
              className={`message ${isSelf ? 'message-self' : 'message-other'}`}
            >
              <div className="message-info">
                <span className="message-sender">
                  {isSelf ? 'You' : message.sender_name}
                </span>
                <span className="message-timestamp">
                  {formatMessageTime(message.created_at)}
                </span>
              </div>
              <div className="message-content">
                {message.content}
              </div>
            </div>
          );
        })}
        <div className="scroll-anchor" />
      </>
    );
  };

  const filteredRooms = chatRooms?.filter(room => 
    room?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDeleteRoom = async (roomId: string) => {
    setRoomToDelete(roomId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!roomToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token) {
        showToast('You must be logged in to delete a chatroom', 'error');
        return;
      }

      // Remove quotes from token if they exist
      const cleanToken = token.replace(/['"]+/g, '');
      
      console.log('Attempting to delete room:', roomToDelete);
      
      const response = await api.delete(`/api/chatrooms/${roomToDelete}`, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          userId: user.id
        }
      });
      
      if (response.data.success) {
        setChatRooms(prevRooms => prevRooms.filter(room => room.id !== roomToDelete));
        if (selectedRoom === roomToDelete) {
          setSelectedRoom(null);
          setMessages([]);
        }
        showToast('Chatroom successfully deleted', 'success');
      }
    } catch (error: any) {
      console.error('Error deleting chatroom:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to delete chatroom. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setDeleteModalOpen(false);
      setRoomToDelete(null);
    }
  };

  return (
    <div className="chatrooms-page">
      {isLoading && <div className="loading-overlay">Loading...</div>}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="chatrooms-sidebar">
        <div className="chatrooms-header">
          <h2>Chat Rooms</h2>
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="chatrooms-list">
          {filteredRooms.map(room => (
            <div
              key={room.id}
              className={`chatroom-item ${selectedRoom === room.id ? 'active' : ''}`}
              onClick={() => handleJoinRoom(room.id)}
            >
              <div className="chatroom-info">
                <h3>{room.name}</h3>
                <p>{room.lastMessage}</p>
              </div>
              <span className="timestamp">{room.createdAt}</span>
              <button 
                className="delete-room-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteRoom(room.id);
                }}
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>

        <div 
          className="create-room-button" 
          onClick={() => setShowCreateRoom(true)}
          role="button"
          tabIndex={0}
        >
          <FaPlus />
          <span>Create Room</span>
        </div>
      </div>

      <div className="chat-main-area">
        {showCreateRoom ? (
          <div className="create-room-form">
            <h2>Create New Chat Room</h2>
            <form onSubmit={handleCreateRoom}>
              <div className="form-group">
                <label>Room Name</label>
                <input
                  type="text"
                  name="roomName"
                  placeholder="Enter room name"
                  value={formData.roomName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Enter room description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateRoom(false)}>
                  Cancel
                </button>
                <button type="submit" className="create-button">
                  Create Room
                </button>
              </div>
            </form>
          </div>
        ) : selectedRoom ? (
          <div className="chat-area">
            <div className="chat-header">
              <h2>{chatRooms.find(room => room.id === selectedRoom)?.name}</h2>
            </div>
            <div className="messages-container" ref={messagesContainerRef}>
              {renderMessages()}
            </div>
            <div className="chat-input-area">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button type="submit">Send</button>
              </form>
            </div>
          </div>
        ) : (
          <div className="no-chat-selected">
            <h2>Select a chat room or create a new one</h2>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Chatroom"
        message="Are you sure you want to delete this chatroom? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setRoomToDelete(null);
        }}
      />
    </div>
  );
};

export default ChatroomsPage; 