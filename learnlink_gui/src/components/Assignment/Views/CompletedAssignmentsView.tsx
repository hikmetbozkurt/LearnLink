import React from "react";
import { Course } from "../../../types/course";
import { Assignment } from "../../../types/assignment";
import BaseAssignmentView from "./BaseAssignmentView";

interface CompletedAssignmentsViewProps {
  assignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  onAssignmentUpdated: () => void;
  selectedCourse: string | null;
}

const CompletedAssignmentsView: React.FC<CompletedAssignmentsViewProps> = ({
  assignments,
  userCourses,
  adminCourses,
  onAssignmentUpdated,
  selectedCourse,
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
      emptyMessage={selectedCourse 
        ? "No completed assignments found for this course." 
        : "No completed assignments found."}
      viewName="Completed Assignments"
      selectedCourse={selectedCourse}
    />
  );
};

export default CompletedAssignmentsView;
