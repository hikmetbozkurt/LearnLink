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
  submission_count?: number;
  type?: "assignment" | "quiz" | "file";
  points?: number;
  grading_criteria?: string;
}

interface InProgressAssignmentsViewProps {
  assignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  onAssignmentUpdated: () => void;
  selectedCourse: string | null;
}

const InProgressAssignmentsView: React.FC<InProgressAssignmentsViewProps> = ({
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

  // Filter for in-progress assignments (submitted but not graded)
  const inProgressAssignments = assignments.filter((assignment) => {
    // For admin users, show submitted but not graded assignments from courses they manage
    if (isUserAdmin && isAdminForCourse(assignment.course_id)) {
      return (
        assignment.submission_count &&
        assignment.submission_count > 0 &&
        !assignment.graded
      );
    }

    // For regular users, show their submitted but not graded assignments
    return (
      assignment.submitted &&
      !assignment.graded &&
      userCourses.some(
        (course) =>
          course.course_id.toString() === assignment.course_id.toString()
      )
    );
  });

  useEffect(() => {
    console.log("InProgressAssignmentsView - Assignments:", assignments);
    console.log("User is admin:", isUserAdmin);
    console.log("Admin courses:", adminCourses);
    console.log("In-progress assignments:", inProgressAssignments);
  }, [assignments, inProgressAssignments, adminCourses, isUserAdmin]);

  const handleAssignmentClick = (assignment: Assignment) => {
    console.log("Assignment clicked:", assignment);
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
        {inProgressAssignments.length > 0 ? (
          inProgressAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.assignment_id}
              assignment={assignment}
              isAdmin={isAdminForCourse(assignment.course_id)}
              onClick={() => handleAssignmentClick(assignment)}
            />
          ))
        ) : (
          <div className="no-assignments">
            <p>No in-progress assignments found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InProgressAssignmentsView;
