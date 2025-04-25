import React from "react";
import { Course } from "../../../types/course";
import { Assignment } from "../../../types/assignment";
import { isPastDue } from "../../../utils/dateUtils";
import { ensureBoolean } from "../../../utils/assignmentFilters";
import BaseAssignmentView from "./BaseAssignmentView";

interface PendingAssignmentsViewProps {
  assignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  onAssignmentUpdated: () => void;
}

const PendingAssignmentsView: React.FC<PendingAssignmentsViewProps> = ({
  assignments,
  userCourses,
  adminCourses,
  onAssignmentUpdated,
}) => {
  // Log the input assignments
  if (process.env.NODE_ENV === "development") {
    console.log("PendingAssignmentsView - Input assignments:", assignments);
  }

  // Filter for pending assignments (not submitted and not past due date)
  const filterPendingAssignments = (
    assignments: Assignment[]
  ): Assignment[] => {
    return assignments.filter((assignment) => {
      const isSubmitted = ensureBoolean(assignment.submitted);
      const isPastDueDate = isPastDue(assignment.due_date);

      // An assignment is pending if it's not submitted and not past due
      const isEligible = !isSubmitted && !isPastDueDate;

      // Log each assignment evaluation
      if (process.env.NODE_ENV === "development") {
        console.log(`Pending check - Assignment ${assignment.assignment_id}:`, {
          submitted: isSubmitted,
          pastDue: isPastDueDate,
          eligible: isEligible,
        });
      }

      return isEligible;
    });
  };

  const filteredAssignments = filterPendingAssignments(assignments);

  // Log the filtered assignments
  if (process.env.NODE_ENV === "development") {
    console.log(
      "PendingAssignmentsView - Filtered pending assignments:",
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
      emptyMessage="No pending assignments found."
      viewName="Pending Assignments"
    />
  );
};

export default PendingAssignmentsView;
