import React, { useEffect } from "react";
import { Course } from "../../../types/course";
import { Assignment } from "../../../types/assignment";
import { hasAccessToAssignment } from "../../../utils/assignmentFilters";
import BaseAssignmentView from "./BaseAssignmentView";
import "../AssignmentContent.css";

interface AllAssignmentsViewProps {
  assignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  onAssignmentUpdated: () => void;
  selectedCourse: string | null;
}

const AllAssignmentsView: React.FC<AllAssignmentsViewProps> = ({
  assignments,
  userCourses,
  adminCourses,
  onAssignmentUpdated,
  selectedCourse,
}) => {
  // Filter for visible assignments
  const visibleAssignments = assignments.filter((a) => {
    const hasAccess = hasAccessToAssignment(a, userCourses, adminCourses);


    return hasAccess;
  });

  return (
    <BaseAssignmentView
      assignments={assignments}
      filteredAssignments={visibleAssignments}
      userCourses={userCourses}
      adminCourses={adminCourses}
      onAssignmentUpdated={onAssignmentUpdated}
      emptyMessage={selectedCourse 
        ? "No assignments found for this course." 
        : "No assignments found."}
      viewName="All Assignments"
      selectedCourse={selectedCourse}
    />
  );
};

export default AllAssignmentsView;
