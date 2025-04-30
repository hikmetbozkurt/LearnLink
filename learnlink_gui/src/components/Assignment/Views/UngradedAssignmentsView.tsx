import React from "react";
import { Course } from "../../../types/course";
import { Assignment } from "../../../types/assignment";
import BaseAssignmentView from "./BaseAssignmentView";

interface UngradedAssignmentsViewProps {
  assignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  onAssignmentUpdated: () => void;
  selectedCourse: string | null;
}

const UngradedAssignmentsView: React.FC<UngradedAssignmentsViewProps> = ({
  assignments,
  userCourses,
  adminCourses,
  onAssignmentUpdated,
  selectedCourse,
}) => {
  // Filter for ungraded assignments
  const filterUngradedAssignments = (
    assignments: Assignment[]
  ): Assignment[] => {
    return assignments.filter((assignment) => {
      // For admin users, show assignments from their courses that have submissions but aren't fully graded
      const isAdminForThisCourse = adminCourses.some(
        (course) =>
          course.course_id.toString() === assignment.course_id.toString()
      );

      if (isAdminForThisCourse) {
        // If submission_count exists and is greater than 0, there are ungraded submissions
        return (
          assignment.submission_count !== undefined &&
          assignment.submission_count > 0
        );
      }

      // For regular users, show their submitted but ungraded assignments
      return (
        assignment.submitted &&
        !assignment.graded &&
        userCourses.some(
          (course) =>
            course.course_id.toString() === assignment.course_id.toString()
        )
      );
    });
  };

  const filteredAssignments = filterUngradedAssignments(assignments);

  // Sort assignments by due date (oldest first to prioritize grading)
  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  return (
    <BaseAssignmentView
      assignments={assignments}
      filteredAssignments={sortedAssignments}
      userCourses={userCourses}
      adminCourses={adminCourses}
      onAssignmentUpdated={onAssignmentUpdated}
      emptyMessage={selectedCourse 
        ? "No ungraded assignments found for this course." 
        : "No ungraded assignments found."}
      viewName="Ungraded Assignments"
      selectedCourse={selectedCourse}
    />
  );
};

export default UngradedAssignmentsView;
