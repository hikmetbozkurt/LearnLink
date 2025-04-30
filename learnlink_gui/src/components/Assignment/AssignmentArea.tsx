import React, { useEffect } from "react";
import { Course } from "../../types/course";
import { Assignment } from "../../types/assignment";
import "./AssignmentArea.css";
import AllAssignmentsView from "./Views/AllAssignmentsView";
import PendingAssignmentsView from "./Views/PendingAssignmentsView";
import SubmittedAssignmentsView from "./Views/SubmittedAssignmentsView";
import LateAssignmentsView from "./Views/LateAssignmentsView";
import GradedAssignmentsView from "./Views/GradedAssignmentsView";
import PastAssignmentsView from "./Views/PastAssignmentsView";

interface AssignmentAreaProps {
  assignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  activeTab: string;
  onAssignmentUpdated: () => void;
  selectedCourse: string | null;
}

const AssignmentArea: React.FC<AssignmentAreaProps> = ({
  assignments,
  userCourses,
  adminCourses,
  activeTab,
  onAssignmentUpdated,
  selectedCourse,
}) => {
  // Get title based on active tab
  const getTabTitle = (): string => {
    switch (activeTab) {
      case "pending":
        return "Pending Assignments";
      case "submitted":
        return "Submitted Assignments";
      case "graded":
        return "Graded Assignments";
      case "late":
        return "Late Assignments";
      case "past":
        return "Past Assignments";
      case "all":
      default:
        return "All Assignments";
    }
  };

  // Render the appropriate view based on activeTab
  const renderView = () => {
    switch (activeTab) {
      case "pending":
        return (
          <PendingAssignmentsView
            assignments={assignments}
            userCourses={userCourses}
            adminCourses={adminCourses}
            onAssignmentUpdated={onAssignmentUpdated}
            selectedCourse={selectedCourse}
          />
        );
      case "submitted":
        return (
          <SubmittedAssignmentsView
            assignments={assignments}
            userCourses={userCourses}
            adminCourses={adminCourses}
            onAssignmentUpdated={onAssignmentUpdated}
            selectedCourse={selectedCourse}
          />
        );
      case "graded":
        return (
          <GradedAssignmentsView
            assignments={assignments}
            userCourses={userCourses}
            adminCourses={adminCourses}
            onAssignmentUpdated={onAssignmentUpdated}
            selectedCourse={selectedCourse}
          />
        );
      case "late":
        return (
          <LateAssignmentsView
            assignments={assignments}
            userCourses={userCourses}
            adminCourses={adminCourses}
            onAssignmentUpdated={onAssignmentUpdated}
            selectedCourse={selectedCourse}
          />
        );
      case "past":
        return (
          <PastAssignmentsView
            assignments={assignments}
            userCourses={userCourses}
            adminCourses={adminCourses}
            onAssignmentUpdated={onAssignmentUpdated}
            selectedCourse={selectedCourse}
          />
        );
      case "all":
      default:
        return (
          <AllAssignmentsView
            assignments={assignments}
            userCourses={userCourses}
            adminCourses={adminCourses}
            onAssignmentUpdated={onAssignmentUpdated}
            selectedCourse={selectedCourse}
          />
        );
    }
  };

  return (
    <div className="assignment-area">
      <div className="assignment-header">
        <h2>{getTabTitle()}</h2>
      </div>

      <div className="assignment-content">{renderView()}</div>
    </div>
  );
};

export default AssignmentArea;
