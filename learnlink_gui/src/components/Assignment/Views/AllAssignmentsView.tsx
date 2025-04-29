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
  // Log the input assignments and selected course
  if (process.env.NODE_ENV === "development") {
    console.log("AllAssignmentsView - Input assignments:", assignments);
    console.log("AllAssignmentsView - Selected Course:", selectedCourse);
    console.log(
      "AllAssignmentsView - User courses:",
      userCourses.map((c) => c.course_id)
    );
    console.log(
      "AllAssignmentsView - Admin courses:",
      adminCourses.map((c) => c.course_id)
    );
  }

  // Filter for visible assignments
  const visibleAssignments = assignments.filter((a) => {
    const hasAccess = hasAccessToAssignment(a, userCourses, adminCourses);

    if (process.env.NODE_ENV === "development") {
      console.log(
        `Assignment ${a.assignment_id} - hasAccess: ${hasAccess}, submitted: ${a.submitted}, graded: ${a.graded}`
      );
    }

    return hasAccess;
  });

  // Log the filtered assignments
  if (process.env.NODE_ENV === "development") {
    console.log(
      "AllAssignmentsView - Filtered assignments:",
      visibleAssignments
    );
    if (selectedCourse) {
      console.log(
        "AllAssignmentsView - Course filtered assignments:",
        visibleAssignments.filter((a) => {
          const isMatch = Number(a.course_id) === Number(selectedCourse);
          console.log(`Assignment ${a.assignment_id} course match check:`, {
            assignmentCourseId: a.course_id,
            assignmentCourseIdType: typeof a.course_id,
            selectedCourse,
            selectedCourseType: typeof selectedCourse,
            isMatch
          });
          return isMatch;
        })
      );
    }
  }

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
