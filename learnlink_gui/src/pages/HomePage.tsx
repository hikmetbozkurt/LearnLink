import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import api from '../api/axiosConfig';
import { 
  FaGraduationCap, 
  FaUsers, 
  FaCalendarAlt, 
  FaBell, 
  FaEnvelope, 
  FaBookReader,
  FaComments,
  FaClock,
  FaUserFriends,
  FaChartBar
} from 'react-icons/fa';
import '../styles/pages/home.css';

interface UserProfile {
  user_id?: string;
  id?: string | number;
  name: string;
  email: string;
  role?: string;
  profile_pic?: string;
  created_at?: string;
}

interface DashboardStats {
  totalFriends: number;
  totalCourses: number;
  totalMessages: number;
  unreadNotifications: number;
  upcomingEvents: number;
  totalChatrooms: number;
  activePosts: number;
  pendingAssignments: number;
  memberSince: string;
  lastLogin: string;
}

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalFriends: 0,
    totalCourses: 0,
    totalMessages: 0,
    unreadNotifications: 0,
    upcomingEvents: 0,
    totalChatrooms: 0,
    activePosts: 0,
    pendingAssignments: 0,
    memberSince: '',
    lastLogin: ''
  });

  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userString = localStorage.getItem('user');
        if (!userString) {
          console.error('No user found in localStorage');
          navigate('/');
          return;
        }
        
        const user = JSON.parse(userString);
        
        setUserProfile(user);
        
        // Use user_id or id field from the user object
        const userId = user.user_id || user.id;
        
        if (!userId) {
          console.error('No user ID found in user object:', user);
          // If user object doesn't have an ID, let's try to update it with a valid ID
          // This is just a temporary fix - ideally the login flow should ensure valid IDs
          if (user.email) {
            const fixedUser = {...user, user_id: '10', id: '10'};  // Using a default ID as fallback
            localStorage.setItem('user', JSON.stringify(fixedUser));
            await fetchDashboardStats('10');
          } else {
            // If completely invalid user, redirect to login
            navigate('/');
          }
          return;
        }
        
        // Fetch user's dashboard statistics
        await fetchDashboardStats(userId.toString());
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);
  
  const fetchDashboardStats = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !userId) {
        console.error('Missing token or userId:', { token, userId });
        return;
      }

      
      try {
        // Parallel API calls to get different statistics
        
        const [
          friendsRes,
          coursesRes,
          notificationsRes,
          eventsRes,
          userRes,
          messagesRes
        ] = await Promise.all([
          api.get(`/api/users/friends/${userId}`).catch(err => {
            console.error(`Error fetching friends for user ${userId}:`, err.response || err);
            return { data: [] };
          }),
          
          api.get(`/api/courses/user/${userId}`).catch(err => {
            console.error(`Error fetching courses for user ${userId}:`, err.response || err);
            return { data: [] };
          }),
          
          api.get(`/api/notifications/user/${userId}`).catch(err => {
            console.error(`Error fetching notifications for user ${userId}:`, err.response || err);
            return { data: [] };
          }),
          
          api.get(`/api/events/upcoming/${userId}`).catch(err => {
            console.error(`Error fetching events for user ${userId}:`, err.response || err);
            return { data: [] };
          }),
          
          api.get(`/api/users/${userId}`).catch(err => {
            console.error(`Error fetching user details for user ${userId}:`, err.response || err);
            return { data: {} };
          }),
          
          api.get(`/api/messages/stats/${userId}`).catch(err => {
            console.error(`Error fetching messages for user ${userId}:`, err.response || err);
            return { data: { total: 0 } };
          })
        ]);
                
        // Additional API calls might fail, but we should still show the page
        let chatroomsCount = 0;
        let postsCount = 0;
        let assignmentsCount = 0;
        
        try {
          const chatroomsRes = await api.get(`/api/chatrooms/user/${userId}`);
          chatroomsCount = chatroomsRes.data.length || 0;
          
          // You can add more API calls for other stats here
        } catch (err) {
          console.error('Error fetching additional stats:', err);
        }
        
        // Create a date formatter for member since date
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        const memberSince = userRes.data.created_at 
          ? dateFormatter.format(new Date(userRes.data.created_at))
          : 'Unknown';
        
        // Get counts from responses
        const unreadNotifications = notificationsRes.data.filter(
          (notification: any) => !notification.read
        ).length;

        setStats({
          totalFriends: Array.isArray(friendsRes.data) ? friendsRes.data.length : 0,
          totalCourses: Array.isArray(coursesRes.data) ? coursesRes.data.length : 0,
          totalMessages: messagesRes.data?.total || 0,
          unreadNotifications,
          upcomingEvents: Array.isArray(eventsRes.data) ? eventsRes.data.length : 0,
          totalChatrooms: chatroomsCount,
          activePosts: postsCount,
          pendingAssignments: assignmentsCount,
          memberSince,
          lastLogin: userRes.data.last_login 
            ? dateFormatter.format(new Date(userRes.data.last_login))
            : memberSince
        });
      } catch (error) {
        console.error('Error in Promise.all for dashboard stats:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set some default values if API calls fail
      setStats({
        totalFriends: 0,
        totalCourses: 0,
        totalMessages: 0,
        unreadNotifications: 0,
        upcomingEvents: 0,
        totalChatrooms: 0,
        activePosts: 0,
        pendingAssignments: 0,
        memberSince: userProfile?.created_at 
          ? new Date(userProfile.created_at).toLocaleDateString()
          : 'Unknown',
        lastLogin: 'Unknown'
      });
    }
  };
  
  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }
  
  return (
    <div className="home-container">
      <div className="dashboard-header">
        <div className="user-welcome">
          <h1>Welcome back, {userProfile?.name?.split(' ')[0]}!</h1>
        </div>
      </div>

      <div className="overview-cards">
        <Link to="/connections" className="overview-card">
          <div className="card-icon">
            <FaUserFriends />
          </div>
          <div className="card-content">
            <h3>Connections</h3>
            <div className="stat-number">{stats.totalFriends}</div>
            <div className="card-description">Network connections</div>
          </div>
        </Link>

        <Link to="/courses" className="overview-card">
          <div className="card-icon">
            <FaGraduationCap />
          </div>
          <div className="card-content">
            <h3>Courses</h3>
            <div className="stat-number">{stats.totalCourses}</div>
            <div className="card-description">Enrolled courses</div>
          </div>
        </Link>

        <Link to="/direct-messages" className="overview-card">
          <div className="card-icon">
            <FaEnvelope />
          </div>
          <div className="card-content">
            <h3>Messages</h3>
            <div className="stat-number">{stats.totalMessages}</div>
            <div className="card-description">Total messages</div>
          </div>
        </Link>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-section upcoming-events">
          <div className="section-header">
            <h2><FaCalendarAlt /> Upcoming Events</h2>
            <Link to="/events" className="view-all">View all</Link>
          </div>
          <div className="section-content">
            {stats.upcomingEvents > 0 ? (
              <p>You have {stats.upcomingEvents} upcoming events</p>
            ) : (
              <div className="empty-state">
                <p>No upcoming events</p>
                <Link to="/events" className="action-button">
                  Create Event
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-section courses">
          <div className="section-header">
            <h2><FaBookReader /> Active Courses</h2>
            <Link to="/courses" className="view-all">View all</Link>
          </div>
          <div className="section-content">
            {stats.totalCourses > 0 ? (
              <p>You are enrolled in {stats.totalCourses} courses</p>
            ) : (
              <div className="empty-state">
                <p>You are not enrolled in any courses</p>
                <Link to="/courses" className="action-button">
                  Find Courses
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-section activity">
          <div className="section-header">
            <h2><FaChartBar /> Your Activity</h2>
            <Link to="/progress" className="view-all">View details</Link>
          </div>
          <div className="section-content activity-stats">
            <div className="activity-item">
              <FaUserFriends className="activity-icon" />
              <div className="activity-info">
                <span className="activity-label">Connections</span>
                <span className="activity-value">{stats.totalFriends}</span>
              </div>
            </div>
            
            <div className="activity-item">
              <FaEnvelope className="activity-icon" />
              <div className="activity-info">
                <span className="activity-label">Messages</span>
                <span className="activity-value">{stats.totalMessages}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-section reminders">
          <div className="section-header">
            <h2><FaClock /> Upcoming</h2>
          </div>
          <div className="section-content">
            <div className="reminder-item">
              <div className="reminder-icon">
                <FaBookReader />
              </div>
              <div className="reminder-text">
                {stats.pendingAssignments > 0 ? (
                  <p>You have {stats.pendingAssignments} pending assignments</p>
                ) : (
                  <p>No pending assignments</p>
                )}
              </div>
            </div>
            
            <div className="reminder-item">
              <div className="reminder-icon">
                <FaBell />
              </div>
              <div className="reminder-text">
                {stats.unreadNotifications > 0 ? (
                  <p>You have {stats.unreadNotifications} unread notifications</p>
                ) : (
                  <p>No new notifications</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage; 