import React, { useEffect } from "react";
import { format, isPast, isToday, parseISO } from "date-fns";
import { FaBook, FaFileAlt, FaQuestionCircle } from "react-icons/fa";
import DeadlineCountdown from "./DeadlineCountdown";
import "./AssignmentCard.css";

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
  type?: "assignment" | "quiz" | "file";
}

interface AssignmentCardProps {
  assignment: Assignment;
  isAdmin: boolean;
  onClick: () => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  isAdmin,
  onClick,
}) => {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("Rendering assignment card for:", assignment);
      console.log("Submitted status:", assignment.submitted);
      console.log("Graded status:", assignment.graded);
    }
  }, [assignment]);

  // Safely parse the due date
  const getDueDate = () => {
    try {
      return assignment.due_date ? parseISO(assignment.due_date) : new Date();
    } catch (error) {
      console.error("Error parsing date:", error);
      return new Date();
    }
  };

  const dueDate = getDueDate();

  const getStatusClass = () => {
    // Check for explicit boolean values
    if (assignment.submitted === true) {
      return assignment.graded === true ? "status-graded" : "status-submitted";
    }

    // Then check for truthy values (for backward compatibility)
    if (assignment.submitted) {
      return assignment.graded ? "status-graded" : "status-submitted";
    }

    // Not submitted
    if (isPast(dueDate)) {
      return "status-late";
    } else {
      return "status-pending";
    }
  };

  const getStatusText = () => {
    // Check for explicit boolean values
    if (assignment.submitted === true) {
      return assignment.graded === true ? "Graded" : "Submitted";
    }

    // Then check for truthy values (for backward compatibility)
    if (assignment.submitted) {
      return assignment.graded ? "Graded" : "Submitted";
    }

    // Not submitted
    if (isPast(dueDate)) {
      return "Late";
    } else {
      return "Pending";
    }
  };

  const getStatusForAdmin = () => {
    if (isAdmin) {
      return assignment.submission_count
        ? `${assignment.submission_count} submissions`
        : "No submissions";
    }
    return getStatusText();
  };

  // Icon based on assignment type
  const getTypeIcon = () => {
    switch (assignment.type) {
      case "quiz":
        return <FaQuestionCircle />;
      case "file":
        return <FaFileAlt />;
      default:
        return <FaBook />;
    }
  };

  return (
    <div className="assignment-card" onClick={onClick}>
      <div className="assignment-header">
        <div className="assignment-type-icon">{getTypeIcon()}</div>
        <span className={`assignment-status ${getStatusClass()}`}>
          {getStatusForAdmin()}
        </span>
      </div>

      <h3 className="assignment-title">{assignment.title}</h3>

      <div className="assignment-course">{assignment.course_name}</div>

      <div className="assignment-dates">
        <div className="assignment-due-date">
          Due: {format(dueDate, "MMM d, yyyy 'at' h:mm a")}
        </div>

        {!assignment.submitted && !isPast(dueDate) && (
          <DeadlineCountdown dueDate={dueDate} />
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
