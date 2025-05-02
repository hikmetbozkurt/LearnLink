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
  
  // DEBUG: Log props received by BaseAssignmentView
  console.log(`[${viewName}] BaseAssignmentView received:`, {
    filteredAssignmentsCount: filteredAssignments.length,
    selectedCourse,
    selectedCourseType: typeof selectedCourse,
    userCoursesCount: userCourses.length,
    adminCoursesCount: adminCourses.length
  });
  
  // Apply course filter if selected - this is now handled at the parent level
  // We're keeping this implementation as a fallback to ensure proper filtering
  const displayedAssignments = selectedCourse 
    ? filteredAssignments.filter(a => {
        const match = String(a.course_id).trim() === String(selectedCourse).trim();
        
        // Log each assignment matching attempt for debugging
        if (process.env.NODE_ENV === "development") {
          console.log(`Comparing assignment ${a.assignment_id} course match:`, {
            assignmentCourseId: a.course_id,
            assignmentCourseIdType: typeof a.course_id,
            selectedCourse: selectedCourse,
            selectedCourseType: typeof selectedCourse,
            match
          });
        }
        
        return match;
      })
    : filteredAssignments;
  
  // DEBUG: Log filtered assignments  
  console.log(`[${viewName}] After course filtering:`, {
    selectedCourse,
    selectedCourseType: typeof selectedCourse,
    beforeFilter: filteredAssignments.length,
    afterFilter: displayedAssignments.length,
    displayedAssignments: displayedAssignments.map(a => ({ 
      id: a.assignment_id, 
      title: a.title, 
      course_id: a.course_id,
      course_id_type: typeof a.course_id 
    })),
    filteredAssignments: filteredAssignments.slice(0, 3).map(a => ({ 
      id: a.assignment_id, 
      title: a.title, 
      course_id: a.course_id,
      course_id_type: typeof a.course_id 
    }))
  });
    
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
      
      // DEBUG: Log course selection details
      console.log(`[${viewName}] Selected course details:`, {
        selectedCourse,
        foundCourseName: courseName,
        allCourses: allCourses.map(c => ({ id: c.course_id, title: c.title }))
      });
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
