import api from '../api/axiosConfig';

const fetchChatRooms = async () => {
  try {
    const response = await api.get('/api/chatrooms');
    return response.data;
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    throw error;
  }
};

export const chatService = {
  fetchChatRooms,
  // ... diğer chat metodları
}; 