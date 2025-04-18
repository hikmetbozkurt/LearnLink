import React, { useState } from 'react';
import AssignmentCard from './AssignmentCard';
import AssignmentDetail from './AssignmentDetail';
import { Course } from '../../types/course';
import './AssignmentContent.css';

interface Assignment {
  assignment_id: string;
  title: string;
  description: string;
  due_date: string;
  course_id: string;
  course_name: string;
  submitted: boolean;
  graded: boolean;
  grade?: string | number;
  submission_count?: number;
  type?: 'assignment' | 'quiz' | 'file';
}

interface AssignmentContentProps {
  assignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  activeTab: string;
  onAssignmentUpdated: () => void;
}

const AssignmentContent: React.FC<AssignmentContentProps> = ({
  assignments,
  userCourses,
  adminCourses,
  activeTab,
  onAssignmentUpdated
}) => {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
  };
  
  const handleBack = () => {
    setSelectedAssignment(null);
    // Refresh assignments after returning from detail view
    onAssignmentUpdated();
  };
  
  // Check if user is admin for this course
  const isAdminForCourse = (courseId: string): boolean => {
    return adminCourses.some(course => course.course_id === courseId);
  };
  
  // If an assignment is selected, show its details
  if (selectedAssignment) {
    return (
      <AssignmentDetail
        assignment={selectedAssignment}
        isAdmin={isAdminForCourse(selectedAssignment.course_id)}
        onBack={handleBack}
        onUpdate={onAssignmentUpdated}
      />
    );
  }
  
  return (
    <div className="assignment-content">
      <div className="view-options">
        <button 
          className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setViewMode('grid')}
        >
          Grid
        </button>
        <button 
          className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
        >
          List
        </button>
      </div>
      
      <div className={`assignments-list ${viewMode}`}>
        {assignments.length > 0 ? (
          assignments.map(assignment => (
            <AssignmentCard
              key={assignment.assignment_id}
              assignment={assignment}
              isAdmin={isAdminForCourse(assignment.course_id)}
              onClick={() => handleAssignmentClick(assignment)}
            />
          ))
        ) : (
          <div className="no-assignments">
            <p>No assignments found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentContent; 