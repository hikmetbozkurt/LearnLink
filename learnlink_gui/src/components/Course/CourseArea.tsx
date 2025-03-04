import React from "react";
import { FaUsers, FaSpinner } from "react-icons/fa";
import { Course } from "../../types/course";
import "./CourseArea.css";
import { courseService } from "../../services/courseService";
import { useNavigate } from "react-router-dom";

interface CourseAreaProps {
  courses: Course[];
  activeTab: "dashboard" | "myCourses";
  onJoinCourse: (courseId: string) => void;
  onCourseJoined: () => void;
}

const CourseArea: React.FC<CourseAreaProps> = ({
  courses,
  activeTab,
  onJoinCourse,
  onCourseJoined,
}) => {
  const navigate = useNavigate();

  // Buton görünürlük kontrolü için yardımcı fonksiyon
  const renderActionButtons = (course: Course) => {
    return (
      <div className="card-actions">
        {/* Join Course butonu: Sadece dashboard'da ve üye olmadığı kurslar için */}
        {activeTab === "dashboard" && !course.is_admin && !course.is_enrolled && (
          <button
            className="join-button"
            onClick={() => onJoinCourse(course.course_id)}
            disabled={course.student_count >= course.max_students}
          >
            {course.student_count >= course.max_students
              ? "Course Full"
              : "Join Course"}
          </button>
        )}

        {/* View Details butonu: Sadece üye olduğu kurslar için */}
        {course.is_enrolled && !course.is_admin && (
          <button
            className="view-details-button"
            onClick={() => navigate(`/courses/${course.course_id}`)}
          >
            View Details
          </button>
        )}

        {/* Manage Course butonu: Sadece admin olduğu kurslar için (mevcut haliyle kalacak) */}
        {course.is_admin && (
          <button
            className="view-details-button"
            onClick={() => navigate(`/courses/${course.course_id}`)}
          >
            Manage Course
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="course-area">
      <div className="course-header">
        <h2>{activeTab === "dashboard" ? "All Courses" : "My Courses"}</h2>
      </div>

      <div className="course-content">
        {courses.length === 0 ? (
          <p className="no-courses">
            {activeTab === "dashboard"
              ? "No courses available."
              : "You haven't enrolled in any courses yet."}
          </p>
        ) : (
          <div className="course-cards">
            {courses.map((course) => (
              <div key={course.course_id} className="course-card">
                <div className="card-body">
                  <div className="card-header">
                    <h3 className="course-title">{course.title}</h3>
                    {course.is_admin && (
                      <span className="admin-badge">Admin</span>
                    )}
                  </div>
                  <p className="course-instructor">
                    Instructor: {course.instructor_name}
                  </p>
                  <p className="course-description">{course.description}</p>
                  <div className="course-stats">
                    <div className="stat-item">
                      <FaUsers className="stat-icon" />
                      <span>
                        {course.student_count}/{course.max_students}
                      </span>
                    </div>
                  </div>
                  {renderActionButtons(course)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseArea;
