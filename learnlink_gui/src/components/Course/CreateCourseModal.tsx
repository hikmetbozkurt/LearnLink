import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import "./CreateCourseModal.css";

interface CreateCourseModalProps {
  courseName: string;
  courseDescription: string;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isLoading: boolean;
}

const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  courseName,
  courseDescription,
  onNameChange,
  onDescriptionChange,
  onFileChange,
  onSubmit,
  onClose,
  isLoading,
}) => {
  const [nameError, setNameError] = useState<string>("");

  const validateCourseName = (name: string): boolean => {
    // Sadece harfler, sayılar ve boşluğa izin ver
    const validNameRegex = /^[a-zA-Z0-9\s]+$/;

    if (name.length === 0) {
      setNameError("Course name is required");
      return false;
    }

    if (name.length > 50) {
      setNameError("Course name cannot exceed 50 characters");
      return false;
    }

    if (!validNameRegex.test(name)) {
      setNameError("Course name can only contain letters, numbers and spaces");
      return false;
    }

    // Sadece boşluklardan oluşan isimleri engelle
    if (name.trim().length === 0) {
      setNameError("Course name cannot be only spaces");
      return false;
    }

    // Minimum 3 karakter zorunluluğu
    if (name.trim().length < 3) {
      setNameError("Course name must be at least 3 characters");
      return false;
    }

    setNameError("");
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    validateCourseName(newName);
    onNameChange(e);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateCourseName(courseName)) {
      onSubmit(e);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Create New Course</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Course Name</label>
            <input
              type="text"
              placeholder="Enter course name"
              value={courseName}
              onChange={handleNameChange}
              className={nameError ? "error" : ""}
              maxLength={50}
              required
            />
            {nameError && <span className="error-message">{nameError}</span>}
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Enter course description"
              value={courseDescription}
              onChange={onDescriptionChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Course Avatar</label>
            <input type="file" accept="image/*" onChange={onFileChange} />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button
              type="submit"
              className="create-button"
              disabled={isLoading || !!nameError}
            >
              {isLoading ? "Creating..." : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourseModal;
