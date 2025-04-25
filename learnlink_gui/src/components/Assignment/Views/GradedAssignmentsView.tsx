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
}

const GradedAssignmentsView: React.FC<GradedAssignmentsViewProps> = ({
  assignments,
  userCourses,
  adminCourses,
  onAssignmentUpdated,
}) => {
  // Log input assignments
  if (process.env.NODE_ENV === "development") {
    console.log("GradedAssignmentsView - Input assignments:", assignments);
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
  }

  return (
    <BaseAssignmentView
      assignments={assignments}
      filteredAssignments={filteredAssignments}
      userCourses={userCourses}
      adminCourses={adminCourses}
      onAssignmentUpdated={onAssignmentUpdated}
      emptyMessage="No graded assignments found."
      viewName="Graded Assignments"
    />
  );
};

export default GradedAssignmentsView;
