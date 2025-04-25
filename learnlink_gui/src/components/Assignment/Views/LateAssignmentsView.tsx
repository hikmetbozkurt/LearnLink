import React from "react";
import { Course } from "../../../types/course";
import { Assignment } from "../../../types/assignment";
import { isPastDue } from "../../../utils/dateUtils";
import BaseAssignmentView from "./BaseAssignmentView";

interface LateAssignmentsViewProps {
  assignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  onAssignmentUpdated: () => void;
}

const LateAssignmentsView: React.FC<LateAssignmentsViewProps> = ({
  assignments,
  userCourses,
  adminCourses,
  onAssignmentUpdated,
}) => {
  // Filter for late assignments (not submitted and past due date)
  const filterLateAssignments = (assignments: Assignment[]): Assignment[] => {
    return assignments.filter((assignment) => {
      const isSubmitted = assignment.submitted;
      const isLate = isPastDue(assignment.due_date);
      return !isSubmitted && isLate;
    });
  };

  const filteredAssignments = filterLateAssignments(assignments);

  return (
    <BaseAssignmentView
      assignments={assignments}
      filteredAssignments={filteredAssignments}
      userCourses={userCourses}
      adminCourses={adminCourses}
      onAssignmentUpdated={onAssignmentUpdated}
      emptyMessage="No late assignments found."
      viewName="Late Assignments"
    />
  );
};

export default LateAssignmentsView;
