import React from 'react';
import { Course } from '../../types/course';
import './AssignmentArea.css';
import AssignmentContent from './AssignmentContent';

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

interface AssignmentAreaProps {
  assignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  activeTab: string;
  onAssignmentUpdated: () => void;
}

const AssignmentArea: React.FC<AssignmentAreaProps> = ({
  assignments,
  userCourses,
  adminCourses,
  activeTab,
  onAssignmentUpdated
}) => {
  // Get title based on active tab
  const getTabTitle = (): string => {
    switch(activeTab) {
      case "pending": return "Pending Assignments";
      case "submitted": return "Submitted Assignments";
      case "graded": return "Graded Assignments";
      case "late": return "Late Assignments";
      case "all": 
      default: return "All Assignments";
    }
  };

  return (
    <div className="assignment-area">
      <div className="assignment-header">
        <h2>{getTabTitle()}</h2>
      </div>

      <div className="assignment-content">
        <AssignmentContent
          assignments={assignments}
          userCourses={userCourses}
          adminCourses={adminCourses}
          activeTab={activeTab}
          onAssignmentUpdated={onAssignmentUpdated}
        />
      </div>
    </div>
  );
};

export default AssignmentArea; 