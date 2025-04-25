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
  // Filter for pending assignments (not submitted and not past due date)
  const filterPendingAssignments = (
    assignments: Assignment[]
  ): Assignment[] => {
    return assignments.filter((assignment) => {
      const isSubmitted = ensureBoolean(assignment.submitted);
      const isPastDueDate = isPastDue(assignment.due_date);

      // An assignment is pending if it's not submitted and not past due
      return !isSubmitted && !isPastDueDate;
    });
  };

  const filteredAssignments = filterPendingAssignments(assignments);

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
