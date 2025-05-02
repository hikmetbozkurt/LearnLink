import React, { useState, useEffect, useContext } from "react";
import AssignmentCard from "../AssignmentCard";
import AssignmentDetail from "../AssignmentDetail";
import { Course } from "../../../types/course";
import { AuthContext } from "../../../contexts/AuthContext";
import "../AssignmentContent.css";

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
  points?: number;
  grading_criteria?: string;
}

interface UpcomingAssignmentsViewProps {
  assignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  onAssignmentUpdated: () => void;
  selectedCourse: string | null;
}

const UpcomingAssignmentsView: React.FC<UpcomingAssignmentsViewProps> = ({
  assignments,
  userCourses,
  adminCourses,
  onAssignmentUpdated,
  selectedCourse,
}) => {
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { user } = useContext(AuthContext);
  const isUserAdmin = adminCourses.length > 0;

  // Helper function to check if a date is upcoming (due date is in the future)
  const isUpcoming = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    return due > now;
  };

  // Filter for upcoming assignments (due date in the future)
  const upcomingAssignments = assignments.filter((assignment) => {
    const isAssignmentUpcoming = isUpcoming(assignment.due_date);

    // For admin users, show upcoming assignments from courses they manage
    if (isUserAdmin && isAdminForCourse(assignment.course_id)) {
      return isAssignmentUpcoming;
    }

    // For regular users, show their upcoming assignments (not submitted or not graded)
    return (
      isAssignmentUpcoming &&
      !assignment.submitted &&
      userCourses.some(
        (course) =>
          course.course_id.toString() === assignment.course_id.toString()
      )
    );
  });

  useEffect(() => {
  }, [assignments, upcomingAssignments, adminCourses, isUserAdmin]);

  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
  };

  const handleBack = () => {
    setSelectedAssignment(null);
    onAssignmentUpdated();
  };

  // Check if user is admin for this course
  const isAdminForCourse = (courseId: string): boolean => {
    return adminCourses.some(
      (course) => course.course_id.toString() === courseId.toString()
    );
  };

  // If an assignment is selected, show its details
  if (selectedAssignment) {
    return (
      <AssignmentDetail
        assignment={selectedAssignment}
        isAdmin={isAdminForCourse(selectedAssignment.course_id)}
        onBack={handleBack}
        onUpdate={onAssignmentUpdated}
        selectedCourse={selectedCourse}
      />
    );
  }

  // Sort assignments by due date (closest first)
  const sortedAssignments = [...upcomingAssignments].sort((a, b) => {
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  return (
    <div className="assignment-content">
      <div className="view-options">
        <button
          className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
          onClick={() => setViewMode("grid")}
        >
          Grid
        </button>
        <button
          className={`view-btn ${viewMode === "list" ? "active" : ""}`}
          onClick={() => setViewMode("list")}
        >
          List
        </button>
      </div>

      <div className={`assignments-list ${viewMode}`}>
        {sortedAssignments.length > 0 ? (
          sortedAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.assignment_id}
              assignment={assignment}
              isAdmin={isAdminForCourse(assignment.course_id)}
              onClick={() => handleAssignmentClick(assignment)}
            />
          ))
        ) : (
          <div className="no-assignments">
            <p>No upcoming assignments found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingAssignmentsView;
