import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { FaFilter, FaSync, FaTimes } from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import '../styles/pages/progress.css';
import api from '../api/axiosConfig';
import { API_URL } from '../config/config';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Fallback data for demonstration
const fallbackMessageStats = [
  { user_id: 1, name: "Ali", message_count: 120 },
  { user_id: 2, name: "Ayşe", message_count: 95 },
  { user_id: 3, name: "Mehmet", message_count: 78 },
  { user_id: 4, name: "Fatma", message_count: 65 },
  { user_id: 5, name: "Ahmet", message_count: 52 }
];

const fallbackCourseStats = [
  { user_id: 1, name: "Ali", course_count: 5 },
  { user_id: 2, name: "Ayşe", course_count: 4 },
  { user_id: 3, name: "Mehmet", course_count: 3 },
  { user_id: 4, name: "Fatma", course_count: 2 },
  { user_id: 5, name: "Ahmet", course_count: 1 }
];

const ProgressPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [userMessageStats, setUserMessageStats] = useState<any[]>([]);
  const [courseCompletionStats, setCourseCompletionStats] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    messages: true,
    courses: true
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [modalType, setModalType] = useState<'message' | 'course'>('message');
  const [useFallbackData, setUseFallbackData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user message statistics
        const messageStatsResponse = await api.get(`/api/messages/stats/user-messages`);
        setUserMessageStats(messageStatsResponse.data);
        setLoading(prev => ({ ...prev, messages: false }));

        // Fetch course completion statistics
        const courseStatsResponse = await api.get(`/api/courses/stats/completion`);
        setCourseCompletionStats(courseStatsResponse.data);
        setLoading(prev => ({ ...prev, courses: false }));
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setLoading({ messages: false, courses: false });
      }
    };

    fetchData();

    // Set a timeout to use fallback data if real data hasn't loaded within 3 seconds
    const fallbackTimer = setTimeout(() => {
      setLoading(prev => {
        if (prev.messages || prev.courses) {
          console.log('Using fallback data for demonstration');
          setUseFallbackData(true);
          
          if (prev.messages) {
            setUserMessageStats(fallbackMessageStats);
          }
          
          if (prev.courses) {
            setCourseCompletionStats(fallbackCourseStats);
          }
          
          return { messages: false, courses: false };
        }
        return prev;
      });
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // Handle chart click to open modal
  const handleChartClick = (type: 'message' | 'course', index: number) => {
    setModalType(type);
    if (type === 'message' && userMessageStats[index]) {
      setSelectedData(userMessageStats[index]);
      setModalOpen(true);
    } else if (type === 'course' && courseCompletionStats[index]) {
      setSelectedData(courseCompletionStats[index]);
      setModalOpen(true);
    }
  };

  // Data for the user message statistics chart
  const messageStatsData = {
    labels: userMessageStats.map(user => user.name),
    datasets: [
      {
        label: 'Messages Sent',
        data: userMessageStats.map(user => user.message_count),
        backgroundColor: isDarkMode ? '#7c4dff' : '#512da8',
      },
    ],
  };

  // Data for the course count chart
  const courseCompletionData = {
    labels: courseCompletionStats.map(user => user.name),
    datasets: [
      {
        label: 'Owned Courses',
        data: courseCompletionStats.map(user => user.course_count),
        backgroundColor: isDarkMode ? '#00c851' : '#20c997',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDarkMode ? '#b3b3b3' : '#333333'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.raw}`;
          }
        },
        backgroundColor: isDarkMode ? '#242424' : '#ffffff',
        titleColor: isDarkMode ? '#ffffff' : '#333333',
        bodyColor: isDarkMode ? '#b3b3b3' : '#666666',
        borderColor: isDarkMode ? '#333333' : '#dddddd',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          color: isDarkMode ? '#b3b3b3' : '#333333'
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        ticks: {
          color: isDarkMode ? '#b3b3b3' : '#333333'
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    onClick: (_event: any, elements: any) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        handleChartClick(elements[0].datasetIndex === 0 && elements[0].element.options.backgroundColor === (isDarkMode ? '#7c4dff' : '#512da8') ? 'message' : 'course', index);
      }
    }
  };

  return (
    <div className="progress-page">
      <div className="progress-header">
        <h1>Learning Progress Dashboard</h1>
        <p>Track your academic performance and learning journey with detailed analytics and insights.</p>
        {useFallbackData && (
          <div className="fallback-warning">
            <p>Note: Displaying demonstration data as the API connection couldn't be established.</p>
          </div>
        )}
      </div>
      
      <div className="charts-grid">
        <div className="chart-container">
          <div className="chart-header">
            <h2>User Message Activity</h2>
            <button className="filter-button" onClick={() => window.location.reload()}>
              <FaSync />
            </button>
          </div>
          <div className="chart-wrapper">
            {loading.messages ? (
              <div className="loading">Loading message statistics...</div>
            ) : userMessageStats.length > 0 ? (
              <Bar 
                data={messageStatsData} 
                options={{
                  ...chartOptions,
                  onClick: (_event, elements) => {
                    if (elements.length > 0) {
                      const index = elements[0].index;
                      handleChartClick('message', index);
                    }
                  }
                }} 
              />
            ) : (
              <div className="no-data">No message data available</div>
            )}
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h2>User Course Ownership</h2>
            <button className="filter-button" onClick={() => window.location.reload()}>
              <FaSync />
            </button>
          </div>
          <div className="chart-wrapper">
            {loading.courses ? (
              <div className="loading">Loading course statistics...</div>
            ) : courseCompletionStats.length > 0 ? (
              <Bar 
                data={courseCompletionData} 
                options={{
                  ...chartOptions,
                  onClick: (_event, elements) => {
                    if (elements.length > 0) {
                      const index = elements[0].index;
                      handleChartClick('course', index);
                    }
                  }
                }} 
              />
            ) : (
              <div className="no-data">No course data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for detailed view */}
      {modalOpen && selectedData && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalType === 'message' ? 'User Message Details' : 'Course Ownership Details'}</h3>
              <button className="close-button" onClick={() => setModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              {modalType === 'message' ? (
                <div className="user-message-details">
                  <p><strong>User:</strong> {selectedData.name}</p>
                  <p><strong>User ID:</strong> {selectedData.user_id}</p>
                  <p><strong>Total Messages Sent:</strong> {selectedData.message_count}</p>
                  <p><strong>Messages per day (avg):</strong> {Math.round(selectedData.message_count / 30)} (last 30 days)</p>
                </div>
              ) : (
                <div className="course-completion-details">
                  <p><strong>User:</strong> {selectedData.name}</p>
                  <p><strong>User ID:</strong> {selectedData.user_id}</p>
                  <p><strong>Total Owned Courses:</strong> {selectedData.course_count}</p>
                  <p><strong>Percentage of All Users:</strong> {Math.round((selectedData.course_count / courseCompletionStats.reduce((sum, user) => sum + user.course_count, 0)) * 100)}%</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressPage; 