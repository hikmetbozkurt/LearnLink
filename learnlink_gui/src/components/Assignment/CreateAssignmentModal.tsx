import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Course } from '../../types/course';
import { courseService } from '../../services/courseService';
import './CreateAssignmentModal.css';

interface Assignment {
  assignment_id?: string;
  title: string;
  description: string;
  due_date: string;
  course_id: string;
  type: 'assignment' | 'quiz' | 'file';
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
  adminCourses = []
}) => {
  const [formData, setFormData] = useState<Assignment>({
    title: '',
    description: '',
    due_date: '',
    course_id: '',
    type: 'assignment'
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // If it's edit mode and we have initial data, populate the form
    if (isEdit && initialData) {
      // Format the date string to YYYY-MM-DDThh:mm
      const dueDate = new Date(initialData.due_date);
      const year = dueDate.getFullYear();
      const month = String(dueDate.getMonth() + 1).padStart(2, '0');
      const day = String(dueDate.getDate()).padStart(2, '0');
      const hours = String(dueDate.getHours()).padStart(2, '0');
      const minutes = String(dueDate.getMinutes()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      setFormData({
        ...initialData,
        due_date: formattedDate
      });
    }
    
    // Load courses where user is admin if not provided
    if (adminCourses.length === 0) {
      loadAdminCourses();
    } else {
      setCourses(adminCourses);
    }
  }, [isEdit, initialData, adminCourses]);
  
  const loadAdminCourses = async () => {
    try {
      const allCourses = await courseService.getMyCourses();
      // Filter courses where user is admin
      const adminCoursesList = allCourses.filter(course => course.is_admin);
      setCourses(adminCoursesList);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    onSubmit(formData);
  };
  
  return (
    <div className="modal-overlay">
      <div className="assignment-modal">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Assignment' : 'Create Assignment'}</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
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
              <label htmlFor="type">Assignment Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="assignment">Regular Assignment</option>
                <option value="file">File Upload</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>
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
              {courses.map(course => (
                <option key={course.course_id} value={course.course_id}>
                  {course.title}
                </option>
              ))}
            </select>
            {courses.length === 0 && (
              <p className="no-courses-message">
                You don't have any courses where you're an admin. 
                You need to be a course admin to create assignments.
              </p>
            )}
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading || courses.length === 0}
            >
              {isLoading ? 'Saving...' : isEdit ? 'Update Assignment' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignmentModal; 