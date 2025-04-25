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
}

const AssignmentArea: React.FC<AssignmentAreaProps> = ({
  assignments,
  userCourses,
  adminCourses,
  activeTab,
  onAssignmentUpdated,
}) => {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(`AssignmentArea - Active tab: ${activeTab}`);
      console.log("AssignmentArea - Received assignments:", assignments);
      console.log("AssignmentArea - Assignment data check:");
      assignments.forEach((a) => {
        console.log(
          `Assignment ${a.assignment_id}: submitted=${a.submitted}, graded=${
            a.graded
          }, type=${typeof a.submitted}/${typeof a.graded}`
        );
      });
    }
  }, [activeTab, assignments]);

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
    if (process.env.NODE_ENV === "development") {
      console.log(`Rendering view for tab: ${activeTab}`);
    }

    switch (activeTab) {
      case "pending":
        return (
          <PendingAssignmentsView
            assignments={assignments}
            userCourses={userCourses}
            adminCourses={adminCourses}
            onAssignmentUpdated={onAssignmentUpdated}
          />
        );
      case "submitted":
        return (
          <SubmittedAssignmentsView
            assignments={assignments}
            userCourses={userCourses}
            adminCourses={adminCourses}
            onAssignmentUpdated={onAssignmentUpdated}
          />
        );
      case "graded":
        return (
          <GradedAssignmentsView
            assignments={assignments}
            userCourses={userCourses}
            adminCourses={adminCourses}
            onAssignmentUpdated={onAssignmentUpdated}
          />
        );
      case "late":
        return (
          <LateAssignmentsView
            assignments={assignments}
            userCourses={userCourses}
            adminCourses={adminCourses}
            onAssignmentUpdated={onAssignmentUpdated}
          />
        );
      case "past":
        return (
          <PastAssignmentsView
            assignments={assignments}
            userCourses={userCourses}
            adminCourses={adminCourses}
            onAssignmentUpdated={onAssignmentUpdated}
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
