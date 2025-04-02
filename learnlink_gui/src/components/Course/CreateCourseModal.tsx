import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import "./CreateCourseModal.css";

interface CreateCourseModalProps {
  formData: {
    title: string;
    description: string;
  };
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isLoading: boolean;
}

const CreateCourseModal: React.FC<CreateCourseModalProps> = ({
  formData,
  onInputChange,
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
    onInputChange(e);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateCourseName(formData.title)) {
      onSubmit(e);
    }
  };

  return (
    <div className="create-room-modal">
      <div className="modal-content">
        <h2>Create New Course</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Course Title</label>
            <input
              type="text"
              name="title"
              placeholder="Enter course title"
              value={formData.title}
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
              name="description"
              placeholder="Enter course description"
              value={formData.description}
              onChange={onInputChange}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button
              type="submit"
              className="create-button"
              disabled={
                isLoading ||
                !formData.title.trim() ||
                !formData.description.trim()
              }
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
