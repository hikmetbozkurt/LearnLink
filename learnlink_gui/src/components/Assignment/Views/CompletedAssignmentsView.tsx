import React from "react";
import { Course } from "../../../types/course";
import { Assignment } from "../../../types/assignment";
import BaseAssignmentView from "./BaseAssignmentView";

interface CompletedAssignmentsViewProps {
  assignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  onAssignmentUpdated: () => void;
}

const CompletedAssignmentsView: React.FC<CompletedAssignmentsViewProps> = ({
  assignments,
  userCourses,
  adminCourses,
  onAssignmentUpdated,
}) => {
  // Filter for completed assignments (submitted and graded)
  const filterCompletedAssignments = (
    assignments: Assignment[]
  ): Assignment[] => {
    return assignments.filter((assignment) => {
      return assignment.submitted && assignment.graded;
    });
  };

  const filteredAssignments = filterCompletedAssignments(assignments);

  return (
    <BaseAssignmentView
      assignments={assignments}
      filteredAssignments={filteredAssignments}
      userCourses={userCourses}
      adminCourses={adminCourses}
      onAssignmentUpdated={onAssignmentUpdated}
      emptyMessage="No completed assignments found."
      viewName="Completed Assignments"
    />
  );
};

export default CompletedAssignmentsView;
