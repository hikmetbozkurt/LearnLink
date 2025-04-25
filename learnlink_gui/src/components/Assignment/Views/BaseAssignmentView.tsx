import React, { useState, useEffect, useContext } from "react";
import AssignmentCard from "../AssignmentCard";
import AssignmentDetail from "../AssignmentDetail";
import { Course } from "../../../types/course";
import { Assignment } from "../../../types/assignment";
import { AuthContext } from "../../../contexts/AuthContext";
import { isAdminForCourse as utilIsAdminForCourse } from "../../../utils/assignmentFilters";
import "../AssignmentContent.css";
import "./AssignmentViews.css";

interface BaseAssignmentViewProps {
  assignments: Assignment[];
  filteredAssignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  onAssignmentUpdated: () => void;
  emptyMessage: string;
  viewName: string;
}

const BaseAssignmentView: React.FC<BaseAssignmentViewProps> = ({
  assignments,
  filteredAssignments,
  userCourses,
  adminCourses,
  onAssignmentUpdated,
  emptyMessage,
  viewName,
}) => {
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { user } = useContext(AuthContext);
  const isUserAdmin = adminCourses.length > 0;

  // Check if user is admin for this course
  const isAdminForCourse = (courseId: string): boolean => {
    return utilIsAdminForCourse(courseId, adminCourses);
  };

  // Log assignments for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(`${viewName} - all assignments:`, assignments);
      console.log(`${viewName} - filtered assignments:`, filteredAssignments);
      console.log("User is admin:", isUserAdmin);
      console.log(
        "Admin courses:",
        adminCourses.map((c) => c.course_id)
      );
    }
  }, [assignments, filteredAssignments, adminCourses, isUserAdmin, viewName]);

  const handleAssignmentClick = (assignment: Assignment) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`${viewName} - Assignment clicked:`, assignment);
    }
    setSelectedAssignment(assignment);
  };

  const handleBack = () => {
    setSelectedAssignment(null);
    onAssignmentUpdated();
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
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.assignment_id}
              assignment={assignment}
              isAdmin={isAdminForCourse(assignment.course_id)}
              onClick={() => handleAssignmentClick(assignment)}
            />
          ))
        ) : (
          <div className="no-assignments">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseAssignmentView;
