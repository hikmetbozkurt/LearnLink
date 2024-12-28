import React from 'react';
import '../styles/pages/home.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <h1>Welcome to LearnLink</h1>
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Recent Courses</h3>
          {/* Course list */}
        </div>
        <div className="dashboard-card">
          <h3>Upcoming Assignments</h3>
          {/* Assignment list */}
        </div>
        <div className="dashboard-card">
          <h3>Recent Messages</h3>
          {/* Message list */}
        </div>
        <div className="dashboard-card">
          <h3>Progress Overview</h3>
          {/* Progress charts */}
        </div>
      </div>
    </div>
  );
};

export default HomePage; 