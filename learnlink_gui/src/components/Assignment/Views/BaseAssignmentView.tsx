import React, { useState, useEffect, useContext } from "react";
import AssignmentCard from "../AssignmentCard";
import AssignmentDetail from "../AssignmentDetail";
import { Course } from "../../../types/course";
import { Assignment } from "../../../types/assignment";
import { AuthContext } from "../../../contexts/AuthContext";
import { isAdminForCourse as utilIsAdminForCourse } from "../../../utils/assignmentFilters";
import "../AssignmentContent.css";
import "./AssignmentViews.css";

interface BaseAssignmentViewProps {
  assignments: Assignment[];
  filteredAssignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  onAssignmentUpdated: () => void;
  emptyMessage: string;
  viewName: string;
  selectedCourse: string | null;
}

const BaseAssignmentView: React.FC<BaseAssignmentViewProps> = ({
  assignments,
  filteredAssignments,
  userCourses,
  adminCourses,
  onAssignmentUpdated,
  emptyMessage,
  viewName,
  selectedCourse,
}) => {
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { user } = useContext(AuthContext);
  const isUserAdmin = adminCourses.length > 0;
  
  
  // Apply course filter if selected - this is now handled at the parent level
  // We're keeping this implementation as a fallback to ensure proper filtering
  const displayedAssignments = selectedCourse 
    ? filteredAssignments.filter(a => {
        const match = String(a.course_id).trim() === String(selectedCourse).trim();

        
        return match;
      })
    : filteredAssignments;

    
  // Get the course name for the selected course
  const [selectedCourseName, setSelectedCourseName] = useState<string>("");
  
  useEffect(() => {
    if (selectedCourse) {
      // Find the course in the user or admin courses
      const allCourses = [...userCourses, ...adminCourses];
      
      const course = allCourses.find(
        c => Number(c.course_id) === Number(selectedCourse)
      );
      
      const courseName = course?.title || "Selected Course";
      setSelectedCourseName(courseName);
      
    } else {
      setSelectedCourseName("");
    }
  }, [selectedCourse, userCourses, adminCourses, viewName]);

  // Check if user is admin for this course
  const isAdminForCourse = (courseId: string): boolean => {
    return utilIsAdminForCourse(courseId, adminCourses);
  };

  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
  };

  const handleBack = () => {
    setSelectedAssignment(null);
    onAssignmentUpdated();
  };

  // If an assignment is selected, show its details
  if (selectedAssignment) {
    return (
      <AssignmentDetail
        assignment={selectedAssignment}
        isAdmin={isAdminForCourse(selectedAssignment.course_id)}
        onBack={handleBack}
        onUpdate={onAssignmentUpdated}
        selectedCourse={selectedCourse}
      />
    );
  }

  return (
    <div className="assignment-content">
      {selectedCourse && (
        <div className="course-filter-indicator">
          <span>Filtered by course: <strong>{selectedCourseName}</strong></span>
          <span className="filter-count">
            Showing {displayedAssignments.length} assignment{displayedAssignments.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      
      <div className="view-options">
        <button
          className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
          onClick={() => setViewMode("grid")}
        >
          Grid
        </button>
        <button
          className={`view-btn ${viewMode === "list" ? "active" : ""}`}
          onClick={() => setViewMode("list")}
        >
          List
        </button>
      </div>

      <div className={`assignments-list ${viewMode}`}>
        {displayedAssignments.length > 0 ? (
          displayedAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.assignment_id}
              assignment={assignment}
              isAdmin={isAdminForCourse(assignment.course_id)}
              onClick={() => handleAssignmentClick(assignment)}
              viewMode={viewMode}
            />
          ))
        ) : (
          <div className="no-assignments">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseAssignmentView;
