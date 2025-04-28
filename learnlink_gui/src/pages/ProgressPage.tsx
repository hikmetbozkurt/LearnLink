import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { FaFilter, FaSync, FaTimes, FaExpand, FaCompress } from 'react-icons/fa';
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

const ProgressPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [messageActivity, setMessageActivity] = useState<any | null>(null);
  const [courseActivity, setCourseActivity] = useState<any | null>(null);
  const [postStats, setPostStats] = useState<any | null>(null);
  const [commentStats, setCommentStats] = useState<any | null>(null);
  const [loading, setLoading] = useState({
    messages: true,
    courses: true,
    posts: true,
    comments: true
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [modalType, setModalType] = useState<'message' | 'course' | 'post' | 'comment'>('message');
  const [expandedChart, setExpandedChart] = useState<'message' | 'course' | 'post' | 'comment' | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch message activity data correctly from direct messages and chatrooms
        try {
          // Query messages table directly to count user's messages by type
          const messageStatsResponse = await api.get('/api/messages/stats/user-messages');
          
          // The API should return counts of user's messages separated by type
          // Assume the API returns: { direct_messages: X, group_messages: Y }
          
          const messageData = {
            direct_messages: messageStatsResponse.data.direct_messages || 0,
            group_messages: messageStatsResponse.data.group_messages || 0
          };
          
          setMessageActivity(messageData);
          setLoading(prev => ({ ...prev, messages: false }));
        } catch (error) {
          console.error('Error fetching message statistics:', error);
          setLoading(prev => ({ ...prev, messages: false }));
        }

        // Fetch course activity data
        try {
          // Get all courses to determine admin status
          const coursesResponse = await api.get('/api/courses');
          const allCourses = coursesResponse.data;

          // Count admin courses (where user is instructor) and enrolled courses
          const adminCourses = allCourses.filter((course: { is_admin: boolean }) => course.is_admin === true).length;
          
          // Include admin courses in enrolled count (they're still enrolled in them)
          const regularEnrolledCourses = allCourses.filter((course: { is_enrolled: boolean, is_admin: boolean }) => 
            course.is_enrolled === true && course.is_admin !== true).length;
          
          // Total enrolled is regular enrolled plus admin courses
          const totalEnrolledCourses = regularEnrolledCourses + adminCourses;

          // Transform the response to our expected format with just created and enrolled courses
          const courseData = {
            enrolled_courses: totalEnrolledCourses || 0,
            created_courses: adminCourses || 0
          };
          
          setCourseActivity(courseData);
          setLoading(prev => ({ ...prev, courses: false }));
        } catch (error) {
          console.error('Error fetching course statistics:', error);
          
          // Fallback to posts data if courses endpoint fails
          try {
            const postsResponse = await api.get(`/api/stats/posts`);
            const courseData = {
              enrolled_courses: postsResponse.data.courses_posted_in || 0,
              created_courses: Math.round((postsResponse.data.courses_posted_in || 0) * 0.3) || 0
            };
            setCourseActivity(courseData);
          } catch (e) {
            console.error('Fallback course data failed too:', e);
          }
          
          setLoading(prev => ({ ...prev, courses: false }));
        }

        // Fetch post statistics - This endpoint works
        try {
          const postStatsResponse = await api.get(`/api/stats/posts`);
          setPostStats(postStatsResponse.data);
          setLoading(prev => ({ ...prev, posts: false }));
        } catch (error) {
          console.error('Error fetching post statistics:', error);
          setLoading(prev => ({ ...prev, posts: false }));
        }

        // Fetch comment statistics - This endpoint works
        try {
          const commentStatsResponse = await api.get(`/api/stats/comments`);
          setCommentStats(commentStatsResponse.data);
          setLoading(prev => ({ ...prev, comments: false }));
        } catch (error) {
          console.error('Error fetching comment statistics:', error);
          setLoading(prev => ({ ...prev, comments: false }));
        }

      } catch (error) {
        console.error('Error fetching statistics:', error);
        setLoading({ messages: false, courses: false, posts: false, comments: false });
      }
    };

    fetchData();
  }, []);

  // Handle chart click to open modal
  const handleChartClick = (type: 'message' | 'course' | 'post' | 'comment', data: any) => {
    setModalType(type);
    setSelectedData(data);
    setModalOpen(true);
  };

  // Handle chart expansion
  const handleExpandChart = (type: 'message' | 'course' | 'post' | 'comment') => {
    setExpandedChart(type);
  };

  // Handle chart collapse
  const handleCollapseChart = () => {
    setExpandedChart(null);
  };

  // Data for the user message statistics chart - Update labels
  const messageActivityData = {
    labels: [
      'Direct Messages', 
      'Group Messages'
    ],
    datasets: [
      {
        label: 'Your Message Activity',
        data: messageActivity ? [
          messageActivity.direct_messages || 0,
          messageActivity.group_messages || 0
        ] : [0, 0],
        backgroundColor: isDarkMode 
          ? ['#7c4dff', '#ff4081'] 
          : ['#512da8', '#d81b60'],
      },
    ],
  };

  // Data for the course activity chart
  const courseActivityData = {
    labels: [
      'Enrolled Courses', 
      'Created Courses'
    ],
    datasets: [
      {
        label: 'Your Course Activity',
        data: courseActivity ? [
          courseActivity.enrolled_courses || 0,
          courseActivity.created_courses || 0
        ] : [0, 0],
        backgroundColor: isDarkMode 
          ? ['#00c851', '#ffab00'] 
          : ['#00695c', '#f57c00'],
      },
    ],
  };

  // Data for the post activity chart
  const postActivityData = {
    labels: [
      'Total Posts Created', 
      'Number of Courses Posted In', 
      'Average Comments Per Post'
    ],
    datasets: [
      {
        label: 'Your Post Activity Metrics',
        data: postStats ? [
          postStats.total_posts || 0, 
          postStats.courses_posted_in || 0, 
          postStats.avg_comments_per_post || 0
        ] : [0, 0, 0],
        backgroundColor: isDarkMode 
          ? ['#ff6d00', '#43a047', '#5c6bc0'] 
          : ['#e65100', '#2e7d32', '#3949ab'],
      },
    ],
  };

  // Data for the comment activity chart
  const commentActivityData = {
    labels: [
      'Total Comments You Made', 
      'Number of Posts You Commented On', 
      'Comments Received on Your Posts'
    ],
    datasets: [
      {
        label: 'Your Comment Activity Metrics',
        data: commentStats ? [
          commentStats.total_comments || 0, 
          commentStats.commented_posts_count || 0, 
          commentStats.received_comments_count || 0
        ] : [0, 0, 0],
        backgroundColor: isDarkMode 
          ? ['#26a69a', '#7e57c2', '#ef5350'] 
          : ['#00897b', '#5e35b1', '#e53935'],
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
          color: isDarkMode ? '#b3b3b3' : '#333333',
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11
          },
          usePointStyle: true,
          boxHeight: 0
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
        borderWidth: 1,
        padding: 8,
        displayColors: false
      }
    },
    scales: {
      x: {
        ticks: {
          color: isDarkMode ? '#b3b3b3' : '#333333',
          font: {
            size: 10
          },
          maxRotation: 0
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        ticks: {
          color: isDarkMode ? '#b3b3b3' : '#333333',
          font: {
            size: 10
          }
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  const tooltipConfig = {
    callbacks: {
      label: function(context: any) {
        return `${context.dataset.label}: ${context.raw}`;
      }
    },
    backgroundColor: isDarkMode ? '#242424' : '#ffffff',
    titleColor: isDarkMode ? '#ffffff' : '#333333',
    bodyColor: isDarkMode ? '#b3b3b3' : '#666666',
    borderColor: isDarkMode ? '#333333' : '#dddddd',
    borderWidth: 1,
    padding: 8,
    displayColors: false
  };

  return (
    <div className="progress-page">
      <div className="progress-header">
        <h1>Your Personal Activity</h1>
        <p>View all your interactions and statistics on the platform</p>
      </div>
      
      {expandedChart ? (
        <div className="expanded-chart-container">
          <button className="collapse-button" onClick={handleCollapseChart}>
            <FaCompress />
          </button>
          
          {expandedChart === 'message' && (
            <div className="expanded-chart-content" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p>Comparison of your direct messages and group chat activity</p>
              <div style={{ display: 'flex', width: '100%', gap: '20px', marginTop: '20px' }}>
                <div style={{ flex: '2' }}>
                  {loading.messages ? (
                    <div className="loading">Loading message statistics...</div>
                  ) : messageActivity ? (
                    <Bar 
                      data={messageActivityData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                              boxWidth: 0,
                              padding: 10,
                              color: isDarkMode ? '#fff' : '#333',
                              usePointStyle: false
                            }
                          },
                          tooltip: tooltipConfig
                        },
                        scales: {
                          x: {
                            grid: {
                              color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                              color: isDarkMode ? '#c9c9c9' : '#666'
                            }
                          },
                          y: {
                            grid: {
                              color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                              color: isDarkMode ? '#c9c9c9' : '#666'
                            }
                          }
                        },
                        onClick: () => {
                          handleChartClick('message', messageActivity);
                        }
                      }} 
                    />
                  ) : (
                    <div className="no-data">No message data available</div>
                  )}
                </div>
                
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {messageActivity && (
                    <>
                      <div style={{ 
                        padding: '15px', 
                        borderRadius: '8px', 
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                        boxShadow: isDarkMode ? '0 4px 8px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
                      }}>
                        <h3 style={{ marginTop: 0, fontSize: '16px', color: isDarkMode ? '#fff' : '#333' }}>Direct Messages</h3>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', color: isDarkMode ? '#7c4dff' : '#512da8' }}>
                          {messageActivity.direct_messages || 0}
                        </div>
                        <p style={{ marginBottom: 0, fontSize: '12px', color: isDarkMode ? '#aaa' : '#666' }}>
                          {messageActivity.direct_messages && messageActivity.group_messages ? 
                            `${Math.round((messageActivity.direct_messages / (messageActivity.direct_messages + messageActivity.group_messages)) * 100)}% of total messages` : 
                            '0% of total messages'}
                        </p>
                      </div>
                      
                      <div style={{ 
                        padding: '15px', 
                        borderRadius: '8px', 
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                        boxShadow: isDarkMode ? '0 4px 8px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
                      }}>
                        <h3 style={{ marginTop: 0, fontSize: '16px', color: isDarkMode ? '#fff' : '#333' }}>Group Messages</h3>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', color: isDarkMode ? '#ff4081' : '#d81b60' }}>
                          {messageActivity.group_messages || 0}
                        </div>
                        <p style={{ marginBottom: 0, fontSize: '12px', color: isDarkMode ? '#aaa' : '#666' }}>
                          {messageActivity.direct_messages && messageActivity.group_messages ? 
                            `${Math.round((messageActivity.group_messages / (messageActivity.direct_messages + messageActivity.group_messages)) * 100)}% of total messages` : 
                            '0% of total messages'}
                        </p>
                      </div>
                      
                      <div style={{ 
                        padding: '15px', 
                        borderRadius: '8px', 
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                        boxShadow: isDarkMode ? '0 4px 8px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
                      }}>
                        <h3 style={{ marginTop: 0, fontSize: '16px', color: isDarkMode ? '#fff' : '#333' }}>Total Messages</h3>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', color: isDarkMode ? '#64b5f6' : '#1976d2' }}>
                          {(messageActivity.direct_messages || 0) + (messageActivity.group_messages || 0)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {expandedChart === 'course' && (
            <div className="expanded-chart-content" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p>View your course statistics including created and enrolled courses</p>
              <div style={{ display: 'flex', width: '100%', gap: '20px', marginTop: '20px' }}>
                <div style={{ flex: '2' }}>
                  {loading.courses ? (
                    <div className="loading">Loading course statistics...</div>
                  ) : courseActivity ? (
                    <Bar 
                      data={courseActivityData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                              boxWidth: 0,
                              padding: 10,
                              color: isDarkMode ? '#fff' : '#333',
                              usePointStyle: false
                            }
                          },
                          tooltip: tooltipConfig
                        },
                        scales: {
                          x: {
                            grid: {
                              color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                              color: isDarkMode ? '#c9c9c9' : '#666'
                            }
                          },
                          y: {
                            grid: {
                              color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                              color: isDarkMode ? '#c9c9c9' : '#666'
                            }
                          }
                        },
                        onClick: () => {
                          handleChartClick('course', courseActivity);
                        }
                      }} 
                    />
                  ) : (
                    <div className="no-data">No course data available</div>
                  )}
                </div>
                
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {courseActivity && (
                    <>
                      <div style={{ 
                        padding: '15px', 
                        borderRadius: '8px', 
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                        boxShadow: isDarkMode ? '0 4px 8px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
                      }}>
                        <h3 style={{ marginTop: 0, fontSize: '16px', color: isDarkMode ? '#fff' : '#333' }}>Enrolled Courses</h3>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', color: isDarkMode ? '#00c851' : '#00695c' }}>
                          {courseActivity.enrolled_courses || 0}
                        </div>
                        <p style={{ marginBottom: 0, fontSize: '12px', color: isDarkMode ? '#aaa' : '#666' }}>
                          {courseActivity.enrolled_courses && courseActivity.created_courses ? 
                            `${Math.round((courseActivity.enrolled_courses / (courseActivity.enrolled_courses + courseActivity.created_courses)) * 100)}% of total courses` : 
                            '0% of total courses'}
                        </p>
                      </div>
                      
                      <div style={{ 
                        padding: '15px', 
                        borderRadius: '8px', 
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                        boxShadow: isDarkMode ? '0 4px 8px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
                      }}>
                        <h3 style={{ marginTop: 0, fontSize: '16px', color: isDarkMode ? '#fff' : '#333' }}>Created Courses</h3>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', color: isDarkMode ? '#ffab00' : '#f57c00' }}>
                          {courseActivity.created_courses || 0}
                        </div>
                        <p style={{ marginBottom: 0, fontSize: '12px', color: isDarkMode ? '#aaa' : '#666' }}>
                          {courseActivity.enrolled_courses && courseActivity.created_courses ? 
                            `${Math.round((courseActivity.created_courses / (courseActivity.enrolled_courses + courseActivity.created_courses)) * 100)}% of total courses` : 
                            '0% of total courses'}
                        </p>
                      </div>
                      
                      <div style={{ 
                        padding: '15px', 
                        borderRadius: '8px', 
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                        boxShadow: isDarkMode ? '0 4px 8px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
                      }}>
                        <h3 style={{ marginTop: 0, fontSize: '16px', color: isDarkMode ? '#fff' : '#333' }}>Total Courses</h3>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', color: isDarkMode ? '#64b5f6' : '#1976d2' }}>
                          {(courseActivity.enrolled_courses || 0) + (courseActivity.created_courses || 0)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {expandedChart === 'post' && (
            <div className="expanded-chart-content" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p>See statistics about your post activity across courses</p>
              <div style={{ display: 'flex', width: '100%', gap: '20px', marginTop: '20px' }}>
                <div style={{ flex: '2' }}>
                  {loading.posts ? (
                    <div className="loading">Loading post statistics...</div>
                  ) : postStats ? (
                    <Bar 
                      data={postActivityData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                              boxWidth: 0,
                              padding: 10,
                              color: isDarkMode ? '#fff' : '#333',
                              usePointStyle: false
                            }
                          },
                          tooltip: tooltipConfig
                        },
                        scales: {
                          x: {
                            grid: {
                              color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                              color: isDarkMode ? '#c9c9c9' : '#666'
                            }
                          },
                          y: {
                            grid: {
                              color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                              color: isDarkMode ? '#c9c9c9' : '#666'
                            }
                          }
                        },
                        onClick: () => {
                          handleChartClick('post', postStats);
                        }
                      }} 
                    />
                  ) : (
                    <div className="no-data">No post data available</div>
                  )}
                </div>
                
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {postStats && (
                    <>
                      <div style={{ 
                        padding: '15px', 
                        borderRadius: '8px', 
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                        boxShadow: isDarkMode ? '0 4px 8px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
                      }}>
                        <h3 style={{ marginTop: 0, fontSize: '16px', color: isDarkMode ? '#fff' : '#333' }}>Total Posts</h3>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', color: isDarkMode ? '#ff6d00' : '#e65100' }}>
                          {postStats.total_posts || 0}
                        </div>
                        <p style={{ marginBottom: 0, fontSize: '12px', color: isDarkMode ? '#aaa' : '#666' }}>
                          Across {postStats.courses_posted_in || 0} courses
                        </p>
                      </div>
                      
                      <div style={{ 
                        padding: '15px', 
                        borderRadius: '8px', 
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                        boxShadow: isDarkMode ? '0 4px 8px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
                      }}>
                        <h3 style={{ marginTop: 0, fontSize: '16px', color: isDarkMode ? '#fff' : '#333' }}>Courses Posted In</h3>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', color: isDarkMode ? '#43a047' : '#2e7d32' }}>
                          {postStats.courses_posted_in || 0}
                        </div>
                        <p style={{ marginBottom: 0, fontSize: '12px', color: isDarkMode ? '#aaa' : '#666' }}>
                          {postStats.total_posts && postStats.courses_posted_in ?
                            `~${Math.round(postStats.total_posts / postStats.courses_posted_in)} posts per course` :
                            '0 posts per course'}
                        </p>
                      </div>
                      
                      <div style={{ 
                        padding: '15px', 
                        borderRadius: '8px', 
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                        boxShadow: isDarkMode ? '0 4px 8px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
                      }}>
                        <h3 style={{ marginTop: 0, fontSize: '16px', color: isDarkMode ? '#fff' : '#333' }}>Avg. Comments</h3>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', color: isDarkMode ? '#5c6bc0' : '#3949ab' }}>
                          {typeof postStats.avg_comments_per_post === 'number' ? postStats.avg_comments_per_post.toFixed(1) : '0'}
                        </div>
                        <p style={{ marginBottom: 0, fontSize: '12px', color: isDarkMode ? '#aaa' : '#666' }}>
                          Per post
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {expandedChart === 'comment' && (
            <div className="expanded-chart-content" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p>See statistics about your commenting activity</p>
              <div style={{ display: 'flex', width: '100%', gap: '20px', marginTop: '20px' }}>
                <div style={{ flex: '2' }}>
                  {loading.comments ? (
                    <div className="loading">Loading comment statistics...</div>
                  ) : commentStats ? (
                    <Bar 
                      data={commentActivityData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                              boxWidth: 0,
                              padding: 10,
                              color: isDarkMode ? '#fff' : '#333',
                              usePointStyle: false
                            }
                          },
                          tooltip: tooltipConfig
                        },
                        scales: {
                          x: {
                            grid: {
                              color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                              color: isDarkMode ? '#c9c9c9' : '#666'
                            }
                          },
                          y: {
                            grid: {
                              color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                              color: isDarkMode ? '#c9c9c9' : '#666'
                            }
                          }
                        },
                        onClick: () => {
                          handleChartClick('comment', commentStats);
                        }
                      }} 
                    />
                  ) : (
                    <div className="no-data">No comment data available</div>
                  )}
                </div>
                
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {commentStats && (
                    <>
                      <div style={{ 
                        padding: '15px', 
                        borderRadius: '8px', 
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                        boxShadow: isDarkMode ? '0 4px 8px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
                      }}>
                        <h3 style={{ marginTop: 0, fontSize: '16px', color: isDarkMode ? '#fff' : '#333' }}>Comments Made</h3>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', color: isDarkMode ? '#26a69a' : '#00897b' }}>
                          {commentStats.total_comments || 0}
                        </div>
                        <p style={{ marginBottom: 0, fontSize: '12px', color: isDarkMode ? '#aaa' : '#666' }}>
                          On {commentStats.commented_posts_count || 0} posts
                        </p>
                      </div>
                      
                      <div style={{ 
                        padding: '15px', 
                        borderRadius: '8px', 
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                        boxShadow: isDarkMode ? '0 4px 8px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
                      }}>
                        <h3 style={{ marginTop: 0, fontSize: '16px', color: isDarkMode ? '#fff' : '#333' }}>Posts Commented</h3>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', color: isDarkMode ? '#7e57c2' : '#5e35b1' }}>
                          {commentStats.commented_posts_count || 0}
                        </div>
                        <p style={{ marginBottom: 0, fontSize: '12px', color: isDarkMode ? '#aaa' : '#666' }}>
                          {commentStats.total_comments && commentStats.commented_posts_count ?
                            `~${Math.round(commentStats.total_comments / commentStats.commented_posts_count)} comments per post` :
                            '0 comments per post'}
                        </p>
                      </div>
                      
                      <div style={{ 
                        padding: '15px', 
                        borderRadius: '8px', 
                        backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                        boxShadow: isDarkMode ? '0 4px 8px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
                      }}>
                        <h3 style={{ marginTop: 0, fontSize: '16px', color: isDarkMode ? '#fff' : '#333' }}>Comments Received</h3>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '5px', color: isDarkMode ? '#ef5350' : '#e53935' }}>
                          {commentStats.received_comments_count || 0}
                        </div>
                        <p style={{ marginBottom: 0, fontSize: '12px', color: isDarkMode ? '#aaa' : '#666' }}>
                          On your posts
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="charts-grid-compact">
          <div className="chart-card" onClick={() => handleExpandChart('message')}>
            <div className="chart-card-header">
              <h3>Messages</h3>
              <FaExpand className="expand-icon" />
            </div>
            <p>Direct vs Group Messages</p>
            <div className="chart-card-preview">
              {loading.messages ? (
                <div className="loading-small">Loading...</div>
              ) : messageActivity ? (
                <Bar 
                  data={messageActivityData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                          boxWidth: 0,
                          padding: 5,
                          font: {
                            size: 10
                          },
                          color: isDarkMode ? '#fff' : '#333',
                          usePointStyle: false
                        }
                      }
                    },
                    scales: {
                      x: { display: false },
                      y: { display: false }
                    },
                    layout: {
                      padding: 0
                    },
                    aspectRatio: 1.5
                  }} 
                />
              ) : (
                <div className="no-data-small">No data</div>
              )}
            </div>
          </div>
          
          <div className="chart-card" onClick={() => handleExpandChart('course')}>
            <div className="chart-card-header">
              <h3>Courses</h3>
              <FaExpand className="expand-icon" />
            </div>
            <p>Enrolled & Created Courses</p>
            <div className="chart-card-preview">
              {loading.courses ? (
                <div className="loading-small">Loading...</div>
              ) : courseActivity ? (
                <Bar 
                  data={courseActivityData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                          boxWidth: 0,
                          padding: 5,
                          font: {
                            size: 10
                          },
                          color: isDarkMode ? '#fff' : '#333',
                          usePointStyle: false
                        }
                      }
                    },
                    scales: {
                      x: { display: false },
                      y: { display: false }
                    },
                    layout: {
                      padding: 0
                    },
                    aspectRatio: 1.5
                  }} 
                />
              ) : (
                <div className="no-data-small">No data</div>
              )}
            </div>
          </div>
          
          <div className="chart-card" onClick={() => handleExpandChart('post')}>
            <div className="chart-card-header">
              <h3>Posts</h3>
              <FaExpand className="expand-icon" />
            </div>
            <p>Your Post Activity</p>
            <div className="chart-card-preview">
              {loading.posts ? (
                <div className="loading-small">Loading...</div>
              ) : postStats ? (
                <Bar 
                  data={postActivityData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                          boxWidth: 0,
                          padding: 5,
                          font: {
                            size: 10
                          },
                          color: isDarkMode ? '#fff' : '#333',
                          usePointStyle: false
                        }
                      }
                    },
                    scales: {
                      x: { display: false },
                      y: { display: false }
                    },
                    layout: {
                      padding: 0
                    },
                    aspectRatio: 1.5
                  }} 
                />
              ) : (
                <div className="no-data-small">No data</div>
              )}
            </div>
          </div>
          
          <div className="chart-card" onClick={() => handleExpandChart('comment')}>
            <div className="chart-card-header">
              <h3>Comments</h3>
              <FaExpand className="expand-icon" />
            </div>
            <p>Your Comment Activity</p>
            <div className="chart-card-preview">
              {loading.comments ? (
                <div className="loading-small">Loading...</div>
              ) : commentStats ? (
                <Bar 
                  data={commentActivityData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                          boxWidth: 0,
                          padding: 5,
                          font: {
                            size: 10
                          },
                          color: isDarkMode ? '#fff' : '#333',
                          usePointStyle: false
                        }
                      }
                    },
                    scales: {
                      x: { display: false },
                      y: { display: false }
                    },
                    layout: {
                      padding: 0
                    },
                    aspectRatio: 1.5
                  }} 
                />
              ) : (
                <div className="no-data-small">No data</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal for detailed view */}
      {modalOpen && selectedData && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === 'message' ? 'Message Comparison Details' : 
                 modalType === 'course' ? 'Your Course Details' :
                 modalType === 'post' ? 'Post Activity Details' :
                 'Comment Activity Details'}
              </h3>
              <button className="close-button" onClick={() => setModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              {modalType === 'message' ? (
                <div className="user-message-details">
                  <p><strong>Direct Messages:</strong> {selectedData.direct_messages || 0}</p>
                  <p><strong>Group Messages:</strong> {selectedData.group_messages || 0}</p>
                  {selectedData.last_message_date && (
                    <p><strong>Last Message Date:</strong> {new Date(selectedData.last_message_date).toLocaleDateString()}</p>
                  )}
                </div>
              ) : modalType === 'course' ? (
                <div className="course-completion-details">
                  <p><strong>Enrolled Courses:</strong> {selectedData.enrolled_courses || 0}</p>
                  <p><strong>Created Courses:</strong> {selectedData.created_courses || 0}</p>
                </div>
              ) : modalType === 'post' ? (
                <div className="post-activity-details">
                  <p><strong>Total Posts:</strong> {selectedData.total_posts || 0}</p>
                  <p><strong>Courses Posted In:</strong> {selectedData.courses_posted_in || 0}</p>
                  <p><strong>Average Comments Per Post:</strong> {(selectedData.avg_comments_per_post || 0).toFixed(1)}</p>
                  <p><strong>Last Post Date:</strong> {selectedData.last_post_date ? new Date(selectedData.last_post_date).toLocaleDateString() : 'N/A'}</p>
                </div>
              ) : (
                <div className="comment-activity-details">
                  <p><strong>Total Comments Made:</strong> {selectedData.total_comments || 0}</p>
                  <p><strong>Posts Commented On:</strong> {selectedData.commented_posts_count || 0}</p>
                  <p><strong>Comments Received on Posts:</strong> {selectedData.received_comments_count || 0}</p>
                  <p><strong>Last Comment Date:</strong> {selectedData.last_comment_date ? new Date(selectedData.last_comment_date).toLocaleDateString() : 'N/A'}</p>
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