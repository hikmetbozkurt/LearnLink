import React from 'react';
import { FaBook, FaUsers, FaGraduationCap, FaPlus, FaClock } from 'react-icons/fa';
import '../styles/pages/home.css';

const HomePage = () => {
  return (
    <div className="home-container">
      <div className="main-content">
        <div className="section-header">
          <h2 className="section-title">DASHBOARD</h2>
          <div className="header-actions">
            <button className="action-button">
              <FaPlus />
              <span>New Course</span>
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">12</div>
            <div className="stat-label">Active Courses</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">48</div>
            <div className="stat-label">Study Hours</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">5</div>
            <div className="stat-label">Active Groups</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">89%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>

        <div className="recent-activity">
          <h3 className="section-title">Recent Activity</h3>
          <div className="activity-item">
            <div className="activity-icon">
              <FaBook />
            </div>
            <div className="activity-content">
              <div className="activity-title">New Course Material Added</div>
              <div className="activity-time">2 hours ago</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">
              <FaUsers />
            </div>
            <div className="activity-content">
              <div className="activity-title">Joined Study Group: Advanced Math</div>
              <div className="activity-time">5 hours ago</div>
            </div>
          </div>
        </div>

        <div className="content-grid">
          <div className="card">
            <h3>My Courses</h3>
            <button className="action-button">
              <FaGraduationCap />
              <span>View All Courses</span>
            </button>
          </div>
          <div className="card">
            <h3>Study Groups</h3>
            <button className="action-button">
              <FaUsers />
              <span>Join Group</span>
            </button>
          </div>
          <div className="card">
            <h3>Upcoming Deadlines</h3>
            <button className="action-button">
              <FaClock />
              <span>View Calendar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 