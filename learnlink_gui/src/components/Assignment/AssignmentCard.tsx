import React, { useEffect, useState } from "react";
import { format, isPast, isToday, parseISO, isValid } from "date-fns";
import { FaBook, FaFileAlt, FaQuestionCircle } from "react-icons/fa";
import DeadlineCountdown from "./DeadlineCountdown";
import "./AssignmentCard.css";
import { courseService } from "../../services/courseService";

interface Assignment {
  assignment_id: string;
  title: string;
  description: string;
  due_date: string;
  course_id: string;
  course_name?: string;
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
  const [courseName, setCourseName] = useState<string>(
    assignment.course_name || ""
  );

  // Fetch course name if not available
  useEffect(() => {
    const fetchCourseName = async () => {
      if (!assignment.course_name && assignment.course_id) {
        try {
          console.log("Fetching course name for course_id:", assignment.course_id, typeof assignment.course_id);
          const course = await courseService.getCourse(assignment.course_id);
          console.log("Fetched course:", course);
          setCourseName(course.title);
        } catch (error) {
          console.error("Error fetching course:", error);
          setCourseName(`Course ID: ${assignment.course_id}`);
        }
      }
    };

    fetchCourseName();
  }, [assignment.course_id, assignment.course_name]);

  // Safely parse the due date
  const getDueDate = () => {
    try {
      if (!assignment.due_date) return new Date();
      
      // Parse the ISO date string
      // First check if it has a Z at the end (UTC timezone)
      const hasTimezone = assignment.due_date.endsWith('Z');
      
      let parsedDate;
      if (hasTimezone) {
        // Parse with timezone conversion
        parsedDate = parseISO(assignment.due_date);
      } else {
        // Direct parse without timezone conversion to preserve local time
        parsedDate = parseISO(assignment.due_date);
      }
      
      // Log the original and parsed date for debugging
      console.log("Original due_date:", assignment.due_date);
      console.log("Parsed due_date:", parsedDate, "formatted:", format(parsedDate, "yyyy-MM-dd HH:mm:ss"));
      
      // Check if the date is valid
      if (!isValid(parsedDate)) {
        console.error("Invalid date format:", assignment.due_date);
        return new Date();
      }
      
      return parsedDate;
    } catch (error) {
      console.error("Error parsing date:", error, "Original value:", assignment.due_date);
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

      <div className="assignment-course">
        <strong>Course:</strong> {courseName}
      </div>

      <div className="assignment-dates">
        <div className="assignment-due-date">
          Due: {format(dueDate, "MMM d, yyyy 'at' HH:mm")}
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
