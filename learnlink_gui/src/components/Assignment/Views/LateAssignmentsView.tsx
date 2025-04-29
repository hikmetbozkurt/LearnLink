import React from "react";
import { Course } from "../../../types/course";
import { Assignment } from "../../../types/assignment";
import { isPastDue } from "../../../utils/dateUtils";
import { ensureBoolean } from "../../../utils/assignmentFilters";
import BaseAssignmentView from "./BaseAssignmentView";

interface LateAssignmentsViewProps {
  assignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  onAssignmentUpdated: () => void;
  selectedCourse: string | null;
}

const LateAssignmentsView: React.FC<LateAssignmentsViewProps> = ({
  assignments,
  userCourses,
  adminCourses,
  onAssignmentUpdated,
  selectedCourse,
}) => {
  // Filter for late assignments (not submitted and past due date)
  const filterLateAssignments = (assignments: Assignment[]): Assignment[] => {
    return assignments.filter((assignment) => {
      const isSubmitted = ensureBoolean(assignment.submitted);
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
      emptyMessage={selectedCourse 
        ? "No late assignments found for this course." 
        : "No late assignments found."}
      viewName="Late Assignments"
      selectedCourse={selectedCourse}
    />
  );
};

export default LateAssignmentsView;
