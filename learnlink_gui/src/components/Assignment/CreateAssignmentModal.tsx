import React, { useState, useEffect, useCallback } from "react";
import {
  FaTimes,
  FaInfoCircle,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import { Course } from "../../types/course";
import { courseService } from "../../services/courseService";
import api from "../../api/axiosConfig";
import "./CreateAssignmentModal.css";

interface Assignment {
  assignment_id?: string;
  title: string;
  description: string;
  due_date: string;
  course_id: string;
  type: "assignment";
  points: number;
  grading_criteria?: string;
}

interface CreateAssignmentModalProps {
  isEdit?: boolean;
  initialData?: Assignment;
  onClose: () => void;
  onSubmit: (data: Partial<Assignment>) => void;
  adminCourses?: Course[];
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isEdit = false,
  initialData,
  onClose,
  onSubmit,
  adminCourses = [],
}) => {
  const [formData, setFormData] = useState<Assignment>({
    title: "",
    description: "",
    due_date: "",
    course_id: "",
    type: "assignment",
    points: 100,
    grading_criteria: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);

  const loadAdminCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const adminCoursesData = await courseService.getAdminCourses();
      setCourses(adminCoursesData);
    } catch (error) {
      console.error("Error loading admin courses:", error);
      setErrorMsg("Failed to load courses where you are an admin");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // If it's edit mode and we have initial data, populate the form
    if (isEdit && initialData) {
      try {
        // Format the date string to YYYY-MM-DDThh:mm
        const dueDate = new Date(initialData.due_date);
        const year = dueDate.getFullYear();
        const month = String(dueDate.getMonth() + 1).padStart(2, "0");
        const day = String(dueDate.getDate()).padStart(2, "0");
        const hours = String(dueDate.getHours()).padStart(2, "0");
        const minutes = String(dueDate.getMinutes()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;

        // Use a single state update to prevent multiple re-renders
        setFormData({
          ...initialData,
          due_date: formattedDate,
          points: initialData.points || 100,
          grading_criteria: initialData.grading_criteria || "",
        });
      } catch (error) {
        console.error("Error formatting date:", error);
      }
    }
  }, [isEdit, initialData]); // First useEffect dependencies

  useEffect(() => {
    if (isEdit) {
      if (initialData && initialData.course_id) {
        loadAdminCourses();
      }
    } else {
      loadAdminCourses();
    }
  }, [isEdit, initialData, loadAdminCourses]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrorMsg("");

    // Validate form data
    if (!formData.title.trim()) {
      setErrorMsg("Title is required");
      return;
    }
    if (!formData.description.trim()) {
      setErrorMsg("Description is required");
      return;
    }
    if (!formData.due_date) {
      setErrorMsg("Due date is required");
      return;
    }
    if (!formData.course_id) {
      setErrorMsg("Please select a course");
      return;
    }

    // Verify the selected course exists in admin courses

    const isAdmin = courses.some(
      (course) => course.course_id.toString() === formData.course_id.toString()
    );

    if (!isAdmin) {
      console.error("Selected course is not in admin courses list", {
        selectedCourse: formData.course_id,
        availableCourses: courses.map((c) => ({
          id: c.course_id,
          title: c.title,
        })),
      });
      setErrorMsg(
        "You must select a course where you are an admin to create an assignment"
      );
      return;
    }

    setIsLoading(true);

    // Ensure due_date is properly formatted as ISO string
    let dueDate = formData.due_date;
    try {
      // Parse the datetime-local input which is in the format "YYYY-MM-DDThh:mm"
      if (dueDate && dueDate.includes('T')) {
        // Extract the date and time parts
        const [datePart, timePart] = dueDate.split('T');
        
        // Ensure we have seconds
        let timeWithSeconds = timePart;
        if (!timeWithSeconds.includes(':')) {
          timeWithSeconds += ':00';
        } else if (timeWithSeconds.split(':').length === 2) {
          timeWithSeconds += ':00';
        }
        
        // Format as an ISO string but without timezone conversion
        dueDate = `${datePart}T${timeWithSeconds}.000`;
      }
    } catch (error) {
      console.error("Error formatting date:", error);
    }

    // Prepare the data for submission
    const submissionData: Partial<Assignment> = {
      ...formData,
      due_date: dueDate,
      points:
        typeof formData.points === "string"
          ? parseInt(formData.points)
          : formData.points || 100,
      course_id: formData.course_id.toString(),
    };

    try {
      if (isEdit && initialData && initialData.assignment_id) {
        // Update existing assignment


        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const apiUrl = `http://localhost:5001/api/assignments/${initialData.assignment_id}`;

        const response = await fetch(apiUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        });

        if (response.ok) {
          const result = await response.json();
          setSuccessMsg("Assignment updated successfully!");
          
          // Notify parent component to refresh the assignments list
          // Pass the result to maintain compatibility with existing code
          onSubmit(result);
          
          // Close the modal after successful submission
          onClose();
        } else {
          const errorText = await response.text();
          console.error("API error:", errorText);
          throw new Error(`API error: ${response.status} ${errorText}`);
        }
      } else {
        // Create new assignment

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const apiUrl = "http://localhost:5001/api/assignments";

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        });

        if (response.ok) {
          const result = await response.json();
          setSuccessMsg("Assignment created successfully!");
          
          // Notify parent component to refresh the assignments list
          // Pass the result to maintain compatibility with existing code
          onSubmit(result);
          
          // Close the modal after successful submission
          onClose();
        } else {
          const errorText = await response.text();
          console.error("API error:", errorText);
          throw new Error(`API error: ${response.status} ${errorText}`);
        }
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setErrorMsg(
        `Failed to ${isEdit ? "update" : "create"} assignment: ${errorMessage}`
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="create-assignment-modal-overlay">
      <div className="create-assignment-modal">
        <div className="create-assignment-modal-header">
          <h2>{isEdit ? "Edit Assignment" : "Create Assignment"}</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {successMsg && (
            <div className="create-assignment-success-message">
              <FaCheck /> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="create-assignment-error-message">
              <FaExclamationTriangle /> {errorMsg}
            </div>
          )}

          <div className="create-assignment-form-group">
            <label htmlFor="title">Assignment Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter a descriptive title"
              required
            />
          </div>

          <div className="create-assignment-form-group">
            <label htmlFor="description">Instructions</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide detailed instructions for students"
              rows={5}
              required
            />
          </div>

          <div className="create-assignment-form-row">
            <div className="create-assignment-form-group">
              <label htmlFor="due_date">Due Date</label>
              <input
                type="datetime-local"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="create-assignment-form-group">
              <label htmlFor="points">Points</label>
              <input
                type="number"
                id="points"
                name="points"
                value={formData.points}
                onChange={handleInputChange}
                min="0"
                max="1000"
                required
              />
              <p className="create-assignment-field-hint">Maximum points students can earn</p>
            </div>
          </div>

          <div className="create-assignment-form-group">
            <label htmlFor="grading_criteria">
              Grading Criteria (Optional)
            </label>
            <textarea
              id="grading_criteria"
              name="grading_criteria"
              value={formData.grading_criteria}
              onChange={handleInputChange}
              placeholder="Explain how this assignment will be graded"
              rows={3}
            />
          </div>

          <div className="create-assignment-form-group">
            <label htmlFor="course_id">Course</label>
            <select
              id="course_id"
              name="course_id"
              value={formData.course_id}
              onChange={handleInputChange}
              required
              disabled={isEdit} // Can't change course in edit mode
            >
              <option value="">-- Select Course --</option>
              {courses.map((course) => (
                <option key={course.course_id} value={course.course_id}>
                  {course.title}
                </option>
              ))}
            </select>
            {courses.length === 0 && (
              <div className="create-assignment-no-courses-message">
                <FaInfoCircle /> You don't have any courses where you're an
                admin. You need to be a course admin to create assignments.
              </div>
            )}
            <p className="create-assignment-field-hint">
              You can only create assignments for courses where you are an
              admin.
            </p>
          </div>

          <div className="create-assignment-info-box">
            <FaInfoCircle className="create-assignment-info-icon" />
            <div>
              <p>
                <strong>About Text Assignments</strong>
              </p>
              <p>
                Students will submit their responses as text entries. This is
                ideal for short essays, reflections, or questions that require
                paragraph-length answers.
              </p>
            </div>
          </div>

          <div className="create-assignment-form-actions">
            <button type="button" className="create-assignment-cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="create-assignment-submit-button"
              disabled={isLoading || courses.length === 0 || !!successMsg}
            >
              {isLoading
                ? "Saving..."
                : isEdit
                ? "Update Assignment"
                : "Create Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignmentModal;
