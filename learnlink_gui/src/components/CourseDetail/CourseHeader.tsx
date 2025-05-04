import React, { useState, useEffect } from "react";
import { Course } from "../../types/course";
import "./CourseHeader.css";
import ConfirmModal from "../ConfirmModal";
import { useNavigate } from "react-router-dom";
import { courseService } from "../../services/courseService";
import { FaTrash, FaSignOutAlt, FaPlus } from "react-icons/fa";

interface CourseHeaderProps {
  course: Course | null;
  onCreatePost: () => void;
  onLeaveCourse: () => void;
  onDeleteCourse: () => void;
  isInstructor: boolean;
}

const CourseHeader: React.FC<CourseHeaderProps> = ({
  course,
  onCreatePost,
  onLeaveCourse,
  onDeleteCourse,
  isInstructor,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(isInstructor);
  const navigate = useNavigate();

  useEffect(() => {
    setShowDeleteButton(isInstructor);
  }, [isInstructor]);

  const handleActionClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    try {
      if (!course?.course_id) return;

      if (showDeleteButton) {
        await courseService.deleteCourse(course.course_id);
      } else {
        await courseService.leaveCourse(course.course_id);
      }

      // Önce my-courses endpoint'ini çağır
      await courseService.getMyCourses();

      setIsModalOpen(false);
      navigate("/courses", {
        replace: true,
        state: { refresh: true }, // state ekleyerek yenileme tetikleyicisi gönder
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="course-detail-header">
        <div className="course-info">
          <div className="title-row">
            <h1>{course?.title}</h1>
            <div className="action-buttons">
              <button
                className={showDeleteButton ? "delete-course-button" : "leave-course-button"}
                onClick={handleActionClick}
              >
                {showDeleteButton ? (
                  <>
                    <FaTrash /> Delete Course
                  </>
                ) : (
                  <>
                    <FaSignOutAlt /> Leave Course
                  </>
                )}
              </button>
              <button className="create-post-btn" onClick={onCreatePost}>
                <FaPlus /> Create Post
              </button>
            </div>
          </div>
          <div className="info-row">
            <span className="admin-label">Admin: {course?.instructor_name}</span>
            <span className="members-label">
              Members: {course?.student_count || 0} Students
            </span>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        title={showDeleteButton ? "Delete Course" : "Leave Course"}
        message={
          showDeleteButton
            ? "Are you sure you want to delete this course? This action cannot be undone."
            : "Are you sure you want to leave this course? You can join again later if you change your mind."
        }
        confirmButtonText={showDeleteButton ? "Delete Course" : "Leave Course"}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
};

export default CourseHeader;
