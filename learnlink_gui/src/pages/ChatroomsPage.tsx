import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axiosConfig';
import ChatSidebar from '../components/Chat/ChatSidebar';
import ChatArea from '../components/Chat/ChatArea';
import CreateRoomModal from '../components/Chat/CreateRoomModal';
import '../styles/pages/chatrooms.css';

const SOCKET_URL = 'http://localhost:5001';

interface ChatRoom {
  id: string;
  name: string;
  lastMessage?: string;
  createdAt?: string;
}

interface Message {
  id: number;
  content: string;
  sender_id: number;
  sender_name: string;
  created_at: string;
  chatroom_id?: number;
  roomId?: number;
}

const ChatroomsPage = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [formData, setFormData] = useState({ roomName: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser.id || currentUser.user_id;

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    socketRef.current = io(SOCKET_URL, {
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

    const socket = socketRef.current;

    socket.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to chat server');
    });

    socket.on('reconnect', (attemptNumber: number) => {
      console.log('Reconnected to chat server after', attemptNumber, 'attempts');
      setError(null);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from chat server:', reason);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    socket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      if (user.id || user.user_id) {
        socket.emit('user_connected', (user.id || user.user_id).toString());
      }
    });

    socket.on('new_chatroom', (chatroom: ChatRoom) => {
      setChatRooms(prev => [...prev, chatroom]);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Handle new messages
  useEffect(() => {
    if (!socketRef.current || !selectedRoom) return;

    const handleNewMessage = (message: Message) => {
      // Get the message room ID from either chatroom_id or roomId
      const messageRoomId = message.chatroom_id?.toString() || message.roomId?.toString();
      const currentRoomId = selectedRoom.toString();

      if (messageRoomId === currentRoomId) {
        setMessages(prev => {
          const exists = prev.some(m => 
            m.id === message.id || 
            (m.content === message.content && 
             m.sender_id === message.sender_id && 
             Math.abs(new Date(m.created_at).getTime() - new Date(message.created_at).getTime()) < 1000)
          );

          if (exists) return prev;
          return [...prev, message];
        });
      }
    };

    socketRef.current.on('receive_message', handleNewMessage);
    socketRef.current.emit('join_room', selectedRoom.toString());
    console.log('Joined room:', selectedRoom.toString());

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive_message', handleNewMessage);
        socketRef.current.emit('leave_room', selectedRoom.toString());
        console.log('Left room:', selectedRoom.toString());
      }
    };
  }, [selectedRoom]);

  // Fetch existing chatrooms
  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const response = await api.get('/api/chatrooms');
        const roomsData = Array.isArray(response.data) ? response.data : 
                         response.data.data ? response.data.data : [];
        setChatRooms(roomsData);
      } catch (err) {
        console.error('Error fetching chat rooms:', err);
        // Create notification for error
        await api.post('/api/notifications', {
          recipient_id: userId,
          content: 'Failed to load chat rooms',
          type: 'error'
        });
      }
    };

    fetchChatRooms();
  }, [userId]);

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInMilliseconds = now.getTime() - messageDate.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // Same day formatting
    if (diffInDays === 0) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    // Yesterday
    if (diffInDays === 1) {
      return `Yesterday ${messageDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`;
    }

    // Within last 7 days
    if (diffInDays < 7) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${days[messageDate.getDay()]} ${messageDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`;
    }

    // Older messages
    return messageDate.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', '');
  };

  // Handle input changes for create room form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Filter rooms based on search query
  const filteredRooms = chatRooms?.filter(room => 
    room?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Handle room selection and joining
  useEffect(() => {
    if (!socketRef.current || !selectedRoom) return;

    // Join the room when selected
    socketRef.current.emit('join_room', selectedRoom.toString());
    console.log('Joined room:', selectedRoom.toString());

    return () => {
      socketRef.current?.emit('leave_room', selectedRoom.toString());
      console.log('Left room:', selectedRoom.toString());
    };
  }, [selectedRoom]);

  // Load messages when room is selected
  useEffect(() => {
    if (selectedRoom) {
      const fetchMessages = async () => {
        try {
          const response = await api.get(`/api/chatrooms/${selectedRoom}/messages`);
          const messagesData = response.data.data || [];
          setMessages(messagesData);
        } catch (err) {
          console.error('Error fetching messages:', err);
          setError('Failed to load messages');
          setMessages([]);
        }
      };

      fetchMessages();
      const interval = setInterval(fetchMessages, 1000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [selectedRoom]);

  const handleSendMessage = async () => {
    if (!selectedRoom || !newMessage.trim()) return;

    try {
      const messageData = {
        content: newMessage.trim()
      };

      const response = await api.post(`/api/chatrooms/${selectedRoom}/messages`, messageData);
      
      // Add the message to the local state immediately
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      
      // Emit the message through socket for real-time update
      if (socketRef.current) {
        socketRef.current.emit('chatroom_message', response.data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCreateRoom = async () => {
    if (!formData.roomName.trim()) return;

    setIsLoading(true);
    try {
      const response = await api.post('/api/chatrooms', {
        name: formData.roomName.trim()
      });

      setChatRooms(prev => [...prev, response.data]);
      setFormData({ roomName: '' });
      setShowCreateRoom(false);
      setError(null);
    } catch (err) {
      console.error('Error creating chatroom:', err);
      setError('Failed to create chatroom');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        <ChatSidebar
          rooms={filteredRooms}
          selectedRoom={selectedRoom || undefined}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onJoinRoom={setSelectedRoom}
          onCreateRoom={() => setShowCreateRoom(true)}
          onDeleteRoom={() => {}}
        />
        {selectedRoom ? (
          <ChatArea
            messages={messages}
            currentUserId={userId}
            roomName={chatRooms.find(room => room.id === selectedRoom)?.name}
            newMessage={newMessage}
            onNewMessageChange={(e) => setNewMessage(e.target.value)}
            onSendMessage={handleSendMessage}
            formatMessageTime={formatMessageTime}
            type="chatroom"
          />
        ) : (
          <div className="chat-main">
            <div className="no-chat-selected">
              <h2>Select a chat room to start messaging</h2>
            </div>
          </div>
        )}
      </div>

      {showCreateRoom && (
        <CreateRoomModal
          formData={formData}
          onInputChange={handleInputChange}
          onSubmit={handleCreateRoom}
          onClose={() => setShowCreateRoom(false)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default ChatroomsPage; 