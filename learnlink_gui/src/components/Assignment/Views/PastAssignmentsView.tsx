import React from "react";
import { Course } from "../../../types/course";
import { Assignment } from "../../../types/assignment";
import { isPast, parseISO } from "date-fns";
import {
  filterPastAssignments,
  sortAssignmentsByDueDate,
  ensureBoolean,
} from "../../../utils/assignmentFilters";
import BaseAssignmentView from "./BaseAssignmentView";
import "../AssignmentContent.css";

interface PastAssignmentsViewProps {
  assignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  onAssignmentUpdated: () => void;
}

const PastAssignmentsView: React.FC<PastAssignmentsViewProps> = ({
  assignments,
  userCourses,
  adminCourses,
  onAssignmentUpdated,
}) => {
  // Log input assignments for debugging
  if (process.env.NODE_ENV === "development") {
    console.log("PastAssignmentsView - Input assignments:", assignments);
    assignments.forEach((a) => {
      const dueDate = a.due_date ? parseISO(a.due_date) : new Date();
      const isPastDue = isPast(dueDate);
      const isGraded = ensureBoolean(a.graded);
      console.log(
        `Assignment ${
          a.assignment_id
        }: isPastDue=${isPastDue}, isGraded=${isGraded}, eligible=${
          isPastDue || isGraded
        }`
      );
    });
  }

  // Get past assignments using utility function (now includes both past due date and graded assignments)
  const pastAssignments = filterPastAssignments(
    assignments,
    userCourses,
    adminCourses
  );

  // Sort assignments by due date
  const sortedAssignments = sortAssignmentsByDueDate(pastAssignments);

  // Log filtered assignments
  if (process.env.NODE_ENV === "development") {
    console.log(
      "PastAssignmentsView - Filtered past assignments:",
      sortedAssignments
    );
    console.log(
      "PastAssignmentsView - Now showing both past due date assignments AND graded assignments"
    );
  }

  return (
    <BaseAssignmentView
      assignments={assignments}
      filteredAssignments={sortedAssignments}
      userCourses={userCourses}
      adminCourses={adminCourses}
      onAssignmentUpdated={onAssignmentUpdated}
      emptyMessage="No past assignments found."
      viewName="Past Assignments"
    />
  );
};

export default PastAssignmentsView;
