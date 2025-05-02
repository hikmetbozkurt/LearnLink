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

  // Filter for graded assignments (submitted and graded)
  const filterGradedAssignments = (assignments: Assignment[]): Assignment[] => {
    return assignments.filter((assignment) => {
      const isSubmitted = ensureBoolean(assignment.submitted);
      const isGraded = ensureBoolean(assignment.graded);

      // An assignment is graded if it's both submitted and graded
      const isEligible = isSubmitted && isGraded;


      return isEligible;
    });
  };

  const filteredAssignments = filterGradedAssignments(assignments);


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
