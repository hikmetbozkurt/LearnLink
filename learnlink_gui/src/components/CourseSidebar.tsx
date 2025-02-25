import React from "react";
import { FaSearch, FaPlus } from "react-icons/fa";
import "../styles/components/coursesidebar.css";

type TabType = "dashboard" | "myCourses";

interface CourseSidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onCreateCourse: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({
  activeTab,
  setActiveTab,
  onCreateCourse,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="course-sidebar">
      <div className="sidebar-header">
        <h3>Course Navigation</h3>
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="sidebar-menu">
        <div
          className={`sidebar-item ${
            activeTab === "dashboard" ? "active" : ""
          }`}
          onClick={() => setActiveTab("dashboard")}
        >
          <span>Dashboard</span>
        </div>
        <div
          className={`sidebar-item ${
            activeTab === "myCourses" ? "active" : ""
          }`}
          onClick={() => setActiveTab("myCourses")}
        >
          <span>My Courses</span>
        </div>
      </div>
      <button className="create-button" onClick={onCreateCourse}>
        <FaPlus />
        <span>Create Course</span>
      </button>
    </div>
  );
};

export default CourseSidebar;
