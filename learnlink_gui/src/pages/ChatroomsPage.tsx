import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axiosConfig';
import ChatSidebar from '../components/Chat/ChatSidebar';
import ChatArea from '../components/Chat/ChatArea';
import CreateRoomModal from '../components/Chat/CreateRoomModal';
import '../styles/pages/chatrooms.css';

const SOCKET_URL = 'http://learnlink-v1-env.eba-b28u347j.eu-north-1.elasticbeanstalk.com';

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
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const scrollToBottom = () => {
    if (messagesEndRef.current && (shouldScrollToBottom || isInitialLoad)) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setIsInitialLoad(false);
    }
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;
      setShouldScrollToBottom(isNearBottom);
    }
  };

  useEffect(() => {
    if (isInitialLoad || shouldScrollToBottom) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    setIsInitialLoad(true);
  }, [selectedRoom]);

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

    socket.on('disconnect', (reason: string) => {
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    socket.on('connect', () => {
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

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive_message', handleNewMessage);
        socketRef.current.emit('leave_room', selectedRoom.toString());
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
        await api.post('/api/notifications', {
          recipient_id: userId,
          content: 'Failed to load chat rooms',
          type: 'error'
        });
      }
    };

    fetchChatRooms();
  }, [userId]);

  // Load messages when room is selected
  useEffect(() => {
    if (selectedRoom) {
      const fetchMessages = async () => {
        try {
          const response = await api.get(`/api/chatrooms/${selectedRoom}/messages`);
          const messagesData = response.data.data || [];
          
          // Only update messages if there are new ones
          setMessages(prev => {
            const newMessages = messagesData.filter((msg: Message) => 
              !prev.some(existingMsg => existingMsg.id === msg.id)
            );
            
            if (newMessages.length === 0) return prev;
            return [...prev, ...newMessages];
          });
        } catch (err) {
          console.error('Error fetching messages:', err);
          setError('Failed to load messages');
        }
      };

      // Initial fetch
      const initialFetch = async () => {
        try {
          const response = await api.get(`/api/chatrooms/${selectedRoom}/messages`);
          const messagesData = response.data.data || [];
          setMessages(messagesData);
          setShouldScrollToBottom(true);
        } catch (err) {
          console.error('Error in initial fetch:', err);
          setMessages([]);
        }
      };

      initialFetch();
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

      setNewMessage(''); // Clear input immediately
      const response = await api.post(`/api/chatrooms/${selectedRoom}/messages`, messageData);
      
      // Only emit socket event, let the socket handler manage the messages state
      if (socketRef.current) {
        socketRef.current.emit('chatroom_message', response.data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    if (!timestamp) return '';
    
    // Create a date object from the timestamp
    const date = new Date(timestamp);
    
    // Add 3 hours to compensate for the time zone difference
    date.setHours(date.getHours() + 3);
    
    // Format the time in 24-hour format
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false // Use 24-hour format
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredRooms = chatRooms?.filter(room => 
    room?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateRoom = async (e?: React.FormEvent) => {
    // Prevent default form submission if event is provided
    if (e) e.preventDefault();
    
    if (!formData.roomName.trim()) return;

    setIsLoading(true);
    try {
      console.log('Creating chatroom with name:', formData.roomName.trim());
      
      const response = await api.post('/api/chatrooms', {
        name: formData.roomName.trim(),
        description: '' // Add a description parameter since the backend expects it
      });

      console.log('Chatroom creation response:', response.data);
      setChatRooms(prev => [...prev, response.data]);
      setFormData({ roomName: '' });
      setShowCreateRoom(false);
      setError(null);
    } catch (err: any) {
      console.error('Error creating chatroom:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to create chatroom');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await api.delete(`/api/chatrooms/${roomId}`);
      setChatRooms(prev => prev.filter(room => room.id !== roomId));
      if (selectedRoom === roomId) {
        setSelectedRoom(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting chatroom:', error);
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
          onDeleteRoom={handleDeleteRoom}
          title="Chat Rooms"
          searchPlaceholder="Search rooms..."
          currentUserId={Number(userId)}
        />
        {selectedRoom ? (
          <ChatArea
            messages={messages}
            currentUserId={Number(userId)}
            roomName={chatRooms.find(room => room.id === selectedRoom)?.name || ''}
            newMessage={newMessage}
            onNewMessageChange={(e) => setNewMessage(e.target.value)}
            onSendMessage={handleSendMessage}
            formatMessageTime={formatMessageTime}
            type="chatroom"
            messagesEndRef={messagesEndRef}
            messagesContainerRef={messagesContainerRef}
            onScroll={handleScroll}
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