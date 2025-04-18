import React from 'react';
import { FaSearch, FaPlus, FaTasks, FaCheck, FaHourglassHalf, FaClock, FaListAlt } from 'react-icons/fa';
import { Course } from '../../types/course';
import './AssignmentSidebar.css';

interface AssignmentSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onCreateAssignment: () => void;
  canCreateAssignments: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
  selectedCourse: string | null;
  setSelectedCourse: (courseId: string | null) => void;
  userCourses: Course[];
}

const AssignmentSidebar: React.FC<AssignmentSidebarProps> = ({
  activeTab,
  setActiveTab,
  onCreateAssignment,
  canCreateAssignments,
  searchQuery,
  setSearchQuery,
  onSearch,
  selectedCourse,
  setSelectedCourse,
  userCourses
}) => {
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch();
  };
  
  const tabs = [
    { id: "all", label: "All Assignments", icon: <FaListAlt /> },
    { id: "pending", label: "Pending", icon: <FaHourglassHalf /> },
    { id: "submitted", label: "Submitted", icon: <FaCheck /> },
    { id: "late", label: "Late", icon: <FaClock /> },
    { id: "graded", label: "Graded", icon: <FaTasks /> }
  ];
  
  return (
    <div className="assignment-sidebar">
      <div className="sidebar-header">
        <h3>Assignments</h3>
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
      </div>
      
      <div className="sidebar-menu">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`sidebar-item ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </div>
        ))}
      </div>
      
      <div className="sidebar-filters">
        <h4>Filter by Course</h4>
        <select
          value={selectedCourse || ""}
          onChange={(e) => setSelectedCourse(e.target.value === "" ? null : e.target.value)}
          className="course-filter"
        >
          <option value="">All Courses</option>
          {userCourses.map(course => (
            <option key={course.course_id} value={course.course_id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>
      
      {canCreateAssignments && (
        <div className="sidebar-footer">
          <button className="create-button" onClick={onCreateAssignment}>
            <FaPlus />
            <span>Create Assignment</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AssignmentSidebar; 