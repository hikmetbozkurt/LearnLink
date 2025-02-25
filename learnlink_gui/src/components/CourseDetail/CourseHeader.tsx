import React from 'react';
import { FaUsers, FaPlus } from 'react-icons/fa';
import { Course } from '../../types/course';
import './CourseHeader.css';

interface CourseHeaderProps {
  course: Course | null;
  onCreatePost: () => void;
}

const CourseHeader: React.FC<CourseHeaderProps> = ({ course, onCreatePost }) => {
  if (!course) return null;

  return (
    <div className="course-detail-header">
      <div className="header-content">
        <div className="course-info">
          <h1>{course.title}</h1>
          <p className="instructor">Instructor: {course.instructor_name}</p>
          <p className="description">{course.description}</p>
        </div>

        <div className="course-stats">
          <div className="stat-item">
            <FaUsers className="stat-icon" />
            <span>
              {course.student_count}/{course.max_students} Students
            </span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button className="create-post-button" onClick={onCreatePost}>
          <FaPlus />
          Create Post
        </button>
      </div>
    </div>
  );
};

export default CourseHeader; 