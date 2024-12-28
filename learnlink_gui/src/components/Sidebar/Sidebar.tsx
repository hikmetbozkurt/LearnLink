import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaHome, 
  FaComments, 
  FaBell, 
  FaGraduationCap, 
  FaTasks,
  FaCalendarAlt,
  FaChartLine,
  FaQuestionCircle
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { path: '/home', icon: <FaHome />, label: 'Home' },
    { path: '/chatrooms', icon: <FaComments />, label: 'Chatrooms' },
    { path: '/notifications', icon: <FaBell />, label: 'Notifications' },
    { path: '/courses', icon: <FaGraduationCap />, label: 'Courses' },
    { path: '/assignments', icon: <FaTasks />, label: 'Assignments' },
    { path: '/events', icon: <FaCalendarAlt />, label: 'Upcoming Events' },
    { path: '/progress', icon: <FaChartLine />, label: 'Progress Tracking' },
    { path: '/support', icon: <FaQuestionCircle />, label: 'Support Center' },
  ];

  return (
    <div className="sidebar">
      <div className="logo">
        <img src="/assets/images/learnlink-logo.jpeg" alt="LearnLink" />
        <span>LearnLink</span>
      </div>
      <nav className="nav-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              isActive ? 'nav-item active' : 'nav-item'
            }
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
