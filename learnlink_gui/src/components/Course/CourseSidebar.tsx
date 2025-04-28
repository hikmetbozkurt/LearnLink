import React from "react";
import { FaSearch, FaPlus, FaGraduationCap, FaBookOpen, FaChalkboardTeacher } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { Course } from "../../types/course";
import "./CourseSidebar.css";

interface CourseSidebarProps {
  activeTab: "dashboard" | "myCourses";
  setActiveTab: (tab: "dashboard" | "myCourses") => void;
  onCreateCourse: () => void;
  searchQuery: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  myCourses: Course[];
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({
  activeTab,
  setActiveTab,
  onCreateCourse,
  searchQuery,
  onSearch,
  myCourses,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabChange = (tab: "dashboard" | "myCourses") => {
    setActiveTab(tab);
    if (tab === "dashboard") {
      navigate("/courses");
    } else {
      navigate("/courses");
    }
  };

  const handleCourseClick = (courseId: string) => {
    setActiveTab("myCourses");
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className="course-sidebar">
      <div className="course-sidebar-header">
        <h3>Course Navigation</h3>
        <div className="course-sidebar-search">
          <FaSearch className="course-sidebar-search-icon" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={onSearch}
            className="search-input"
          />
        </div>
      </div>

      <div className="course-sidebar-menu">
        <div
          className={`course-sidebar-nav-item ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => handleTabChange("dashboard")}
        >
          <FaGraduationCap style={{ marginRight: '10px', fontSize: '1.2rem' }} />
          <span>Dashboard</span>
        </div>
        
        <div className="course-sidebar-section">
          <div
            className={`course-sidebar-nav-item ${activeTab === "myCourses" ? "active" : ""}`}
            onClick={() => handleTabChange("myCourses")}
          >
            <FaBookOpen style={{ marginRight: '10px', fontSize: '1.2rem' }} />
            <span>My Courses</span>
          </div>
          
          {activeTab === "myCourses" && (
            <div className="course-sidebar-list">
              {myCourses.map((course) => (
                <div
                  key={course.course_id}
                  className={`course-sidebar-list-item ${location.pathname.includes(`/courses/${course.course_id}`) ? 'active' : ''}`}
                  onClick={() => handleCourseClick(course.course_id)}
                >
                  <span className="course-sidebar-title">
                    <FaChalkboardTeacher style={{ marginRight: '8px', fontSize: '0.9rem', opacity: '0.8' }} />
                    {course.title}
                  </span>
                  {course.is_admin && <span className="course-sidebar-admin-badge">Admin</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="course-sidebar-footer">
        <button className="course-sidebar-create-button" onClick={onCreateCourse}>
          <FaPlus />
          <span>Create Course</span>
        </button>
      </div>
    </div>
  );
};

export default CourseSidebar; 