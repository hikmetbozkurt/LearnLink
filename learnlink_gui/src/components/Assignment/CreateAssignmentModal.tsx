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
  onSubmit: (data: Assignment) => void;
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
    console.log("Loading admin courses");
    setIsLoading(true);
    try {
      const adminCoursesData = await courseService.getAdminCourses();
      console.log("Loaded admin courses:", adminCoursesData);
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
    console.log(`Input changed: ${name} = ${value}`);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);

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
    console.log("Checking if course is admin course:", {
      selectedCourseId: formData.course_id,
      adminCourses: courses.map((c) => ({ id: c.course_id, title: c.title })),
    });

    const isAdmin = courses.some(
      (course) => course.course_id.toString() === formData.course_id.toString()
    );
    console.log("Is admin for selected course:", isAdmin);

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

    console.log("Form validation passed, proceeding with submission");
    setIsLoading(true);

    // Prepare the data for submission
    const submissionData = {
      ...formData,
      points:
        typeof formData.points === "string"
          ? parseInt(formData.points)
          : formData.points || 100,
      course_id: formData.course_id.toString(),
    };

    try {
      let result;

      if (isEdit && initialData && initialData.assignment_id) {
        // Update existing assignment
        console.log(
          `Updating assignment ${initialData.assignment_id} with data:`,
          submissionData
        );

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
          result = await response.json();
          console.log("Assignment updated successfully:", result);
          setSuccessMsg("Assignment updated successfully!");
        } else {
          const errorText = await response.text();
          console.error("API error:", errorText);
          throw new Error(`API error: ${response.status} ${errorText}`);
        }
      } else {
        // Create new assignment
        console.log("Creating new assignment with data:", submissionData);

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
          result = await response.json();
          console.log("Assignment created successfully:", result);
          setSuccessMsg("Assignment created successfully!");
        } else {
          const errorText = await response.text();
          console.error("API error:", errorText);
          throw new Error(`API error: ${response.status} ${errorText}`);
        }
      }

      // Call the onSubmit callback to trigger the loadAssignments function
      onSubmit(result);

      // Close the modal after successful submission
      onClose();
    } catch (error) {
      console.error("Error submitting assignment:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.log("Error details:", errorMessage);
      setErrorMsg(
        `Failed to ${isEdit ? "update" : "create"} assignment: ${errorMessage}`
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="assignment-modal">
        <div className="modal-header">
          <h2>{isEdit ? "Edit Assignment" : "Create Assignment"}</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {successMsg && (
            <div className="success-message">
              <FaCheck /> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="error-message">
              <FaExclamationTriangle /> {errorMsg}
            </div>
          )}

          <div className="form-group">
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

          <div className="form-group">
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

          <div className="form-row">
            <div className="form-group">
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

            <div className="form-group">
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
              <p className="field-hint">Maximum points students can earn</p>
            </div>
          </div>

          <div className="form-group">
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

          <div className="form-group">
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
              <div className="no-courses-message">
                <FaInfoCircle /> You don't have any courses where you're an
                admin. You need to be a course admin to create assignments.
              </div>
            )}
            <p className="field-hint">
              You can only create assignments for courses where you are an
              admin.
            </p>
          </div>

          <div className="assignment-info-box">
            <FaInfoCircle className="info-icon" />
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

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
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
