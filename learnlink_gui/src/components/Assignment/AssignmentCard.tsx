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
    // For course admin, check submission count
    if (isAdmin) {
      return assignment.submission_count && assignment.submission_count > 0
        ? "status-has-submissions"
        : "status-no-submissions";
    }

    // For regular user, check their submission status
    if (assignment.submitted === true) {
      return assignment.graded === true ? "status-graded" : "status-submitted";
    }

    // Not submitted
    if (isPast(dueDate)) {
      return "status-late";
    } else {
      return "status-pending";
    }
  };

  const getStatusText = () => {
    // For regular user, check their submission status
    if (assignment.submitted === true) {
      return assignment.graded === true ? "Graded" : "Submitted";
    }

    // Not submitted
    if (isPast(dueDate)) {
      return "Late";
    } else {
      return "Not Submitted";
    }
  };

  const getStatusForAdmin = () => {
    if (isAdmin) {
      if (typeof assignment.submission_count !== "undefined") {
        // Show singular or plural based on count
        return assignment.submission_count === 1
          ? "1 Submission"
          : `${assignment.submission_count} Submissions`;
      } else {
        return "0 Submissions";
      }
    }

    // For regular users, show their submission status
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
    <div
      className={`assignment-card ${isAdmin ? "admin-created" : ""}`}
      onClick={onClick}
    >
      <div className="assignment-header">
        <div className="assignment-type-icon">{getTypeIcon()}</div>
        <span className={`assignment-status ${getStatusClass()}`}>
          {getStatusForAdmin()}
        </span>
      </div>

      <h3 className="assignment-title">
        {assignment.title}
        {isAdmin && <span className="admin-badge">Creator</span>}
      </h3>

      <div className="assignment-course">{assignment.course_name}</div>

      <div className="assignment-dates">
        <div className="assignment-due-date">
          Due: {format(dueDate, "MMM d, yyyy 'at' h:mm a")}
        </div>

        {!assignment.submitted && !isPast(dueDate) && !isAdmin && (
          <DeadlineCountdown dueDate={dueDate} />
        )}
      </div>

      {isAdmin && (
        <div className="assignment-admin-info">
          {typeof assignment.submission_count !== "undefined"
            ? `${assignment.submission_count} student submission${
                assignment.submission_count !== 1 ? "s" : ""
              }`
            : "No submissions yet"}
        </div>
      )}

      {assignment.submitted && assignment.graded && !isAdmin && (
        <div className="assignment-grade">
          Grade: <strong>{assignment.grade}</strong>
        </div>
      )}
    </div>
  );
};

export default AssignmentCard;
