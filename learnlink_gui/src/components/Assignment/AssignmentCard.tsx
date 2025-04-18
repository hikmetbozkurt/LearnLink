import React from 'react';
import { format, isPast, isToday } from 'date-fns';
import { FaBook, FaFileAlt, FaQuestionCircle } from 'react-icons/fa';
import DeadlineCountdown from './DeadlineCountdown';
import './AssignmentCard.css';

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

interface AssignmentCardProps {
  assignment: Assignment;
  isAdmin: boolean;
  onClick: () => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({ 
  assignment, 
  isAdmin, 
  onClick 
}) => {
  const getStatusClass = () => {
    if (assignment.submitted) {
      return assignment.graded ? "status-graded" : "status-submitted";
    } else if (isPast(new Date(assignment.due_date))) {
      return "status-late";
    } else {
      return "status-pending";
    }
  };
  
  const getStatusText = () => {
    if (assignment.submitted) {
      return assignment.graded ? "Graded" : "Submitted";
    } else if (isPast(new Date(assignment.due_date))) {
      return "Late";
    } else {
      return "Pending";
    }
  };
  
  const getStatusForAdmin = () => {
    if (isAdmin) {
      return assignment.submission_count ? 
        `${assignment.submission_count} submissions` : 
        "No submissions";
    }
    return getStatusText();
  };
  
  // Icon based on assignment type
  const getTypeIcon = () => {
    switch(assignment.type) {
      case "quiz": return <FaQuestionCircle />;
      case "file": return <FaFileAlt />;
      default: return <FaBook />;
    }
  };
  
  return (
    <div className="assignment-card" onClick={onClick}>
      <div className="assignment-header">
        <div className="assignment-type-icon">
          {getTypeIcon()}
        </div>
        <span className={`assignment-status ${getStatusClass()}`}>
          {getStatusForAdmin()}
        </span>
      </div>
      
      <h3 className="assignment-title">{assignment.title}</h3>
      
      <div className="assignment-course">
        {assignment.course_name}
      </div>
      
      <div className="assignment-dates">
        <div className="assignment-due-date">
          Due: {format(new Date(assignment.due_date), "MMM d, yyyy 'at' h:mm a")}
        </div>
        
        {!assignment.submitted && !isPast(new Date(assignment.due_date)) && (
          <DeadlineCountdown dueDate={new Date(assignment.due_date)} />
        )}
      </div>
      
      {assignment.submitted && assignment.graded && (
        <div className="assignment-grade">
          Grade: <strong>{assignment.grade}</strong>
        </div>
      )}
    </div>
  );
};

export default AssignmentCard; 