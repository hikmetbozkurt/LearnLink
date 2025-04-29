import React from "react";
import { Course } from "../../../types/course";
import { Assignment } from "../../../types/assignment";
import { ensureBoolean } from "../../../utils/assignmentFilters";
import BaseAssignmentView from "./BaseAssignmentView";

interface GradedAssignmentsViewProps {
  assignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  onAssignmentUpdated: () => void;
  selectedCourse: string | null;
}

const GradedAssignmentsView: React.FC<GradedAssignmentsViewProps> = ({
  assignments,
  userCourses,
  adminCourses,
  onAssignmentUpdated,
  selectedCourse,
}) => {
  // Log input assignments
  if (process.env.NODE_ENV === "development") {
    console.log("GradedAssignmentsView - Input assignments:", assignments);
    console.log("GradedAssignmentsView - Selected Course:", selectedCourse);
  }

  // Filter for graded assignments (submitted and graded)
  const filterGradedAssignments = (assignments: Assignment[]): Assignment[] => {
    return assignments.filter((assignment) => {
      const isSubmitted = ensureBoolean(assignment.submitted);
      const isGraded = ensureBoolean(assignment.graded);

      // An assignment is graded if it's both submitted and graded
      const isEligible = isSubmitted && isGraded;

      // Log each assignment's status
      if (process.env.NODE_ENV === "development") {
        console.log(`Graded check - Assignment ${assignment.assignment_id}:`, {
          submitted: isSubmitted,
          graded: isGraded,
          eligible: isEligible,
        });
      }

      return isEligible;
    });
  };

  const filteredAssignments = filterGradedAssignments(assignments);

  // Log filtered assignments
  if (process.env.NODE_ENV === "development") {
    console.log(
      "GradedAssignmentsView - Filtered assignments:",
      filteredAssignments
    );
    if (selectedCourse) {
      console.log(
        "GradedAssignmentsView - Course filtered assignments:",
        filteredAssignments.filter((a) => a.course_id === selectedCourse)
      );
    }
  }

  return (
    <BaseAssignmentView
      assignments={assignments}
      filteredAssignments={filteredAssignments}
      userCourses={userCourses}
      adminCourses={adminCourses}
      onAssignmentUpdated={onAssignmentUpdated}
      emptyMessage={selectedCourse 
        ? "No graded assignments found for this course." 
        : "No graded assignments found."}
      viewName="Graded Assignments"
      selectedCourse={selectedCourse}
    />
  );
};

export default GradedAssignmentsView;
