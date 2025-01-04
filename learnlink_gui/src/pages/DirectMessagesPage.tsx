import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axiosConfig';
import ChatSidebar from '../components/Chat/ChatSidebar';
import ChatArea from '../components/Chat/ChatArea';
import '../styles/pages/chatrooms.css';

const SOCKET_URL = 'http://localhost:5001';

interface Message {
  id: number;
  content: string;
  sender_id: number;
  sender_name: string;
  created_at: string;
  dm_id?: number;
  chatroom_id?: number;
}

interface DirectMessage {
  id: string;
  name: string;
  lastMessage?: string;
  createdAt?: string;
}

const DirectMessagesPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const initialChat = location.state?.selectedChat || null;
  const [selectedChat, setSelectedChat] = useState<DirectMessage | null>(initialChat);
  const [messages, setMessages] = useState<Message[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const scrollToBottom = () => {
    if (messagesEndRef.current && (shouldScrollToBottom || isInitialLoad)) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setIsInitialLoad(false);
    }
  };

  // Handle scroll events to determine if we should auto-scroll
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;
      setShouldScrollToBottom(isNearBottom);
    }
  };

  // Only scroll on initial load and when sending messages
  useEffect(() => {
    if (isInitialLoad || shouldScrollToBottom) {
      scrollToBottom();
    }
  }, [messages]);

  // Reset isInitialLoad when changing chats
  useEffect(() => {
    setIsInitialLoad(true);
  }, [selectedChat]);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

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

    socket.on('connect', () => {
      if (user?.user_id) {
        socket.emit('user_connected', user.user_id.toString());
      }
    });

    socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason: string) => {
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    // Handle new messages
    const handleNewMessage = (message: Message) => {
      if (selectedChat && message.dm_id === parseInt(selectedChat.id)) {
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
        fetchDirectMessages();
      }
    };

    socket.on('new_direct_message', handleNewMessage);
    socket.on('direct_message', handleNewMessage);

    return () => {
      if (socket) {
        socket.off('new_direct_message', handleNewMessage);
        socket.off('direct_message', handleNewMessage);
        socket.disconnect();
      }
    };
  }, [user?.user_id, selectedChat]);

  // Handle joining/leaving DM rooms when chat is selected
  useEffect(() => {
    if (!socketRef.current || !selectedChat) return;

    socketRef.current.emit('join_dm', selectedChat.id);

    return () => {
      socketRef.current?.emit('leave_dm', selectedChat.id);
    };
  }, [selectedChat]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (selectedChat) {
      const fetchMessages = async () => {
        try {
          const response = await api.get(`/api/direct-messages/${selectedChat.id}/messages`);
          const messagesData = response.data.data || [];
          
          // Only update messages if there are new ones
          setMessages(prev => {
            const newMessages = messagesData.filter((msg: Message) => 
              !prev.some(existingMsg => existingMsg.id === msg.id)
            );
            
            if (newMessages.length === 0) return prev;
            return [...prev, ...newMessages];
          });
        } catch (error) {
          console.error('Error fetching messages:', error);
          setMessages([]);
        }
      };

      // Initial fetch
      const initialFetch = async () => {
        try {
          const response = await api.get(`/api/direct-messages/${selectedChat.id}/messages`);
          const messagesData = response.data.data || [];
          setMessages(messagesData);
          setShouldScrollToBottom(true);
        } catch (error) {
          console.error('Error in initial fetch:', error);
          setMessages([]);
        }
      };

      initialFetch();
      const interval = setInterval(fetchMessages, 1000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  // Fetch direct messages list
  useEffect(() => {
    fetchDirectMessages();
  }, []);

  const fetchDirectMessages = async () => {
    try {
      const response = await api.get('/api/direct-messages');
      const formattedMessages = response.data.map((msg: any) => ({
        id: String(msg.id),
        name: msg.name,
        lastMessage: msg.last_message,
        createdAt: msg.updated_at
      }));
      setDirectMessages(formattedMessages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching direct messages:', error);
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    try {
      const messageData = {
        content: newMessage.trim()
      };

      setNewMessage(''); // Clear input immediately
      const response = await api.post(`/api/direct-messages/${selectedChat.id}/messages`, messageData);
      
      // Only emit socket event, let the socket handler manage the messages state
      if (socketRef.current) {
        socketRef.current.emit('direct_message', response.data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.delete(`/api/direct-messages/${id}`);
      setDirectMessages(prev => prev.filter(dm => dm.id !== id));
      if (selectedChat?.id === id) {
        setSelectedChat(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // Ensure user ID is always a number
  const currentUserId = user?.user_id || user?.id || 0;

  return (
    <div className="chat-page">
      <div className="chat-container">
        <ChatSidebar
          rooms={directMessages}
          selectedRoom={selectedChat?.id}
          searchQuery=""
          onSearchChange={() => {}}
          onJoinRoom={(id) => {
            const chat = directMessages.find(dm => dm.id === id);
            if (chat) setSelectedChat(chat);
          }}
          onCreateRoom={() => {}}
          onDeleteRoom={handleDeleteConversation}
          hideCreateButton={true}
        />
        {selectedChat ? (
          <ChatArea
            messages={messages}
            currentUserId={currentUserId}
            roomName={selectedChat.name}
            newMessage={newMessage}
            onNewMessageChange={(e) => setNewMessage(e.target.value)}
            onSendMessage={handleSendMessage}
            formatMessageTime={formatMessageTime}
            type="direct"
            messagesEndRef={messagesEndRef}
            messagesContainerRef={messagesContainerRef}
            onScroll={handleScroll}
          />
        ) : (
          <div className="chat-main">
            <div className="no-chat-selected">
              <h2>Select a conversation to start messaging</h2>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessagesPage; 