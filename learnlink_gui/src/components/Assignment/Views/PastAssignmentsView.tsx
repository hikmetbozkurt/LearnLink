import React from "react";
import { Course } from "../../../types/course";
import { Assignment } from "../../../types/assignment";
import { filterPastAssignments } from "../../../utils/assignmentFilters";
import BaseAssignmentView from "./BaseAssignmentView";

interface PastAssignmentsViewProps {
  assignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  onAssignmentUpdated: () => void;
  selectedCourse: string | null;
}

const PastAssignmentsView: React.FC<PastAssignmentsViewProps> = ({
  assignments,
  userCourses,
  adminCourses,
  onAssignmentUpdated,
  selectedCourse,
}) => {
  // Use the utility function to filter past assignments
  const filteredAssignments = filterPastAssignments(
    assignments,
    userCourses,
    adminCourses
  );

  return (
    <BaseAssignmentView
      assignments={assignments}
      filteredAssignments={filteredAssignments}
      userCourses={userCourses}
      adminCourses={adminCourses}
      onAssignmentUpdated={onAssignmentUpdated}
      emptyMessage={selectedCourse 
        ? "No past assignments found for this course." 
        : "No past assignments found."}
      viewName="Past Assignments"
      selectedCourse={selectedCourse}
    />
  );
};

export default PastAssignmentsView;
