import React, { useState, useEffect, useContext } from 'react';
import AssignmentSidebar from '../components/Assignment/AssignmentSidebar';
import AssignmentArea from '../components/Assignment/AssignmentArea';
import CreateAssignmentModal from '../components/Assignment/CreateAssignmentModal';
import { NotificationContext } from '../contexts/NotificationContext';
import { AuthContext } from '../contexts/AuthContext';
import { assignmentService, Assignment as ServiceAssignment } from '../services/assignmentService';
import { notificationService } from '../services/notificationService';
import { courseService } from '../services/courseService';
import { Course } from '../types/course';
import '../styles/pages/shared.css';
import '../styles/pages/assignments.css';

// Define a local Assignment type that matches the one expected by AssignmentContent
interface Assignment {
  assignment_id: string;
  title: string;
  description: string;
  due_date: string;
  course_id: string;
  course_name: string;
  submitted: boolean;
  graded: boolean;
  grade?: string | number;
  submission_count?: number;
  type?: 'assignment' | 'quiz' | 'file';
  points?: number;
  grading_criteria?: string;
}

const AssignmentsPage: React.FC = () => {
  const { showNotification } = useContext(NotificationContext);
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('pending');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([]);
  const [adminCourses, setAdminCourses] = useState<Course[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user's courses
    const loadCourses = async () => {
      try {
        const courses = await courseService.getMyCourses();
        setUserCourses(courses);
        
        // Filter courses where user is admin
        const adminCoursesFiltered = courses.filter(course => course.is_admin);
        setAdminCourses(adminCoursesFiltered);
      } catch (error) {
        console.error("Error loading courses:", error);
        showNotification("Failed to load courses", "error");
      }
    };
    
    loadCourses();
  }, [showNotification]);

  useEffect(() => {
    // Load assignments when userCourses or activeTab changes
    if (userCourses.length > 0) {
      loadAssignments();
    }
  }, [userCourses, activeTab]);

  // Filter assignments when activeTab, selectedCourse, or searchQuery changes
  useEffect(() => {
    filterAssignments();
  }, [activeTab, selectedCourse, searchQuery, assignments]);

  const loadAssignments = async () => {
    setIsLoading(true);
    try {
      // Get assignments for all courses user is a member of
      const courseIds = userCourses.map(course => course.course_id);
      const allAssignments = await assignmentService.getAssignmentsByCourses(courseIds);
      
      setAssignments(allAssignments);
    } catch (error) {
      console.error("Error loading assignments:", error);
      showNotification("Failed to load assignments", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const filterAssignments = () => {
    let filtered = [...assignments];
    
    // Filter by tab
    switch(activeTab) {
      case "pending":
        filtered = filtered.filter(a => !a.submitted && new Date(a.due_date) > new Date());
        break;
      case "submitted":
        filtered = filtered.filter(a => a.submitted);
        break;
      case "graded":
        filtered = filtered.filter(a => a.graded);
        break;
      case "late":
        filtered = filtered.filter(a => !a.submitted && new Date(a.due_date) < new Date());
        break;
      case "all":
      default:
        // No tab filtering
        break;
    }
    
    // Filter by course if selected
    if (selectedCourse) {
      filtered = filtered.filter(a => a.course_id === selectedCourse);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Convert from ServiceAssignment to Assignment (ensuring submitted and graded are boolean values)
    const convertedAssignments: Assignment[] = filtered.map(a => ({
      ...a,
      submitted: Boolean(a.submitted),
      graded: Boolean(a.graded)
    }));
    
    setFilteredAssignments(convertedAssignments);
  };

  const handleCreateAssignment = async (assignmentData: Partial<ServiceAssignment>) => {
    console.log("handleCreateAssignment called with:", assignmentData);
    try {
      // Only allow creating assignments for courses where user is admin
      if (!adminCourses.some(course => course.course_id === assignmentData.course_id)) {
        console.error("Not an admin for this course:", assignmentData.course_id);
        console.log("Available admin courses:", adminCourses);
        showNotification("You don't have permission to create assignments for this course", "error");
        return;
      }
      
      console.log("Admin check passed, attempting to create assignment");
      
      // Create the assignment
      console.log("Calling assignmentService.createAssignment");
      const result = await assignmentService.createAssignment(assignmentData);
      console.log("Assignment created successfully:", result);
      
      // Create a notification for all course members
      try {
        console.log("Creating notification for assignment");
        await notificationService.createAssignmentNotification(
          result.course_id,
          result.assignment_id,
          result.title
        );
        console.log("Notification created successfully");
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
        // Don't return here, we still want to show success even if notification fails
      }
      
      showNotification("Assignment created successfully", "success");
      setShowCreateModal(false);
      loadAssignments();
    } catch (error) {
      console.error("Error creating assignment:", error);
      showNotification("Failed to create assignment", "error");
    }
  };

  return (
    <div className="assignments-page">
      <AssignmentSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCreateAssignment={() => setShowCreateModal(true)}
        canCreateAssignments={adminCourses.length > 0}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={filterAssignments}
        selectedCourse={selectedCourse}
        setSelectedCourse={(courseId: string | null) => setSelectedCourse(courseId)}
        userCourses={userCourses}
      />

      <AssignmentArea
        assignments={filteredAssignments}
        userCourses={userCourses}
        adminCourses={adminCourses}
        activeTab={activeTab}
        onAssignmentUpdated={loadAssignments}
      />

      {showCreateModal && (
        <CreateAssignmentModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAssignment}
          adminCourses={adminCourses}
        />
      )}
    </div>
  );
};

export default AssignmentsPage; 