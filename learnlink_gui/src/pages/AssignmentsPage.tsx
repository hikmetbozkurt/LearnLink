import React, { useState, useEffect, useContext } from "react";
import AssignmentSidebar from "../components/Assignment/AssignmentSidebar";
import AssignmentArea from "../components/Assignment/AssignmentArea";
import CreateAssignmentModal from "../components/Assignment/CreateAssignmentModal";
import { NotificationContext } from "../contexts/NotificationContext";
import { AuthContext } from "../contexts/AuthContext";
import {
  assignmentService,
  Assignment as ServiceAssignment,
} from "../services/assignmentService";
import { notificationService } from "../services/notificationService";
import { courseService } from "../services/courseService";
import { Course } from "../types/course";
import { ensureBoolean } from "../utils/assignmentFilters";
import "../styles/pages/shared.css";
import "../styles/pages/assignments.css";
import { differenceInHours, parseISO, format, isPast } from "date-fns";

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
  type?: "assignment" | "quiz" | "file";
  points?: number;
  grading_criteria?: string;
}

// Pagination configuration
const ITEMS_PER_PAGE = 10;

const AssignmentsPage: React.FC = () => {
  const { showNotification } = useContext(NotificationContext);
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([]);
  const [adminCourses, setAdminCourses] = useState<Course[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedAssignments, setPaginatedAssignments] = useState<
    Assignment[]
  >([]);

  useEffect(() => {
    // Load user's courses
    const loadCourses = async () => {
      try {
        const courses = await courseService.getMyCourses();
        setUserCourses(courses);

        // Filter courses where user is admin
        const adminCoursesFiltered = courses.filter(
          (course) => course.is_admin
        );
        setAdminCourses(adminCoursesFiltered);
      } catch (error) {
        console.error("Error loading courses:", error);
        showNotification("Failed to load courses", "error");
      }
    };

    // Test API connection
    const testApiConnection = async () => {
      try {
        if (process.env.NODE_ENV === "development") {
          console.log("Testing API connection...");
          const token = localStorage.getItem("token");
          console.log("Auth token present:", !!token);

          // Make a direct fetch call to test connectivity
          const response = await fetch(
            "http://localhost:5001/api/assignments",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          console.log("API test response status:", response.status);
          const data = await response.text();
          console.log("API test response data:", data);
        }
      } catch (error) {
        console.error("API connection test failed:", error);
      }
    };

    testApiConnection();
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

  // Update paginated assignments when filtered assignments or page changes
  useEffect(() => {
    paginateAssignments();
  }, [filteredAssignments, currentPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedCourse, searchQuery]);

  // Refresh assignments when the create modal is closed
  useEffect(() => {
    if (!showCreateModal) {
      loadAssignments();
    }
  }, [showCreateModal]);

  // Set up auto-refresh for assignments
  useEffect(() => {
    // Refresh assignments every 5 minutes to keep data fresh
    const refreshInterval = setInterval(() => {
      if (userCourses.length > 0 && !isLoading) {
        if (process.env.NODE_ENV === "development") {
          console.log("Auto-refreshing assignments data");
        }
        loadAssignments();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [userCourses, isLoading]);

  // Log when selectedCourse changes
  useEffect(() => {
    console.log("AssignmentsPage - selectedCourse changed:", {
      selectedCourse,
      type: typeof selectedCourse
    });
  }, [selectedCourse]);

  // Add event listener for visibility changes to refresh when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        userCourses.length > 0 &&
        !isLoading
      ) {
        if (process.env.NODE_ENV === "development") {
          console.log("Page visible again, refreshing assignments");
        }
        loadAssignments();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userCourses, isLoading]);

  const loadAssignments = async () => {
    setIsLoading(true);
    try {
      // Get assignments for all courses user is a member of
      const courseIds = userCourses.map((course) => course.course_id);

      if (courseIds.length === 0) {
        console.warn("No course IDs found for user, can't load assignments");
        setAssignments([]);
        setIsLoading(false);
        return;
      }

      const allAssignments = await assignmentService.getAssignmentsByCourses(
        courseIds
      );

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

    // Filter by course if selected
    if (selectedCourse) {
      console.log("Filtering assignments by course_id:", {
        selectedCourse,
        selectedCourseType: typeof selectedCourse
      });
      
      filtered = filtered.filter((a) => {
        const courseMatch = String(a.course_id).trim() === String(selectedCourse).trim();
        console.log(`Assignment ${a.assignment_id} course filtering:`, {
          assignmentCourseId: a.course_id,
          assignmentCourseIdType: typeof a.course_id,
          selectedCourse,
          match: courseMatch
        });
        return courseMatch;
      });
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Process assignments to ensure all fields have correct data types
    const processedAssignments: Assignment[] = filtered.map((a) => {
      // Convert the assignment from ServiceAssignment to Assignment
      // Ensure all fields have the correct data types
      const processedAssignment = {
        ...a,
        // Explicitly ensure submitted and graded are proper boolean values
        submitted: ensureBoolean(a.submitted),
        graded: ensureBoolean(a.graded),
        course_name: a.course_name || "",
        type: a.type || "assignment",
        points: a.points || 100,
      };

      return processedAssignment;
    });

    setFilteredAssignments(processedAssignments);

    // Update total pages
    setTotalPages(Math.ceil(processedAssignments.length / ITEMS_PER_PAGE));
  };

  const paginateAssignments = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedItems = filteredAssignments.slice(startIndex, endIndex);
    setPaginatedAssignments(paginatedItems);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleCreateAssignment = async (
    assignmentData: Partial<ServiceAssignment>
  ) => {
    try {
      // Check if this is a result from the modal's API call (has assignment_id)
      if (assignmentData.assignment_id) {
        console.log("Received assignment result from modal:", assignmentData);
        
        // Create a notification for all course members
        try {
          // Ensure all required properties exist before creating notification
          if (assignmentData.course_id && assignmentData.title) {
            await notificationService.createAssignmentNotification(
              assignmentData.course_id,
              assignmentData.assignment_id,
              assignmentData.title
            );
          } else {
            console.warn("Missing required properties for notification:", assignmentData);
          }
        } catch (notificationError) {
          console.error("Error creating notification:", notificationError);
          // Still show success for the assignment, but notify user about the notification issue
          showNotification(
            "Assignment created, but notification delivery failed",
            "error"
          );
        }

        showNotification("Assignment created successfully", "success");
        setShowCreateModal(false);
        
        // Clear the submissions cache to ensure fresh data
        assignmentService.clearSubmissionsCache();
        
        loadAssignments();
        return;
      }

      // Only allow creating assignments for courses where user is admin
      if (
        !adminCourses.some(
          (course) => course.course_id === assignmentData.course_id
        )
      ) {
        console.error(
          "Not an admin for this course:",
          assignmentData.course_id
        );
        showNotification(
          "You don't have permission to create assignments for this course",
          "error"
        );
        return;
      }

      try {
        const result = await assignmentService.createAssignment(assignmentData);

        // Create a notification for all course members
        try {
          await notificationService.createAssignmentNotification(
            result.course_id,
            result.assignment_id,
            result.title
          );
        } catch (notificationError) {
          console.error("Error creating notification:", notificationError);
          // Still show success for the assignment, but notify user about the notification issue
          showNotification(
            "Assignment created, but notification delivery failed",
            "error"
          );
        }

        showNotification("Assignment created successfully", "success");
        setShowCreateModal(false);
        
        // Clear the submissions cache to ensure fresh data
        assignmentService.clearSubmissionsCache();
        
        loadAssignments();
      } catch (apiError) {
        console.error("API Error in createAssignment:", apiError);
        showNotification(
          `Failed to create assignment: ${
            apiError instanceof Error ? apiError.message : "Unknown error"
          }`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error in handleCreateAssignment:", error);
      showNotification("Failed to create assignment", "error");
    }
  };

  const checkUpcomingDeadlines = () => {
    if (process.env.NODE_ENV === "development") {
      console.log("Checking for upcoming deadlines");
    }

    // Only check if user has permission to show notifications
    if (!("Notification" in window)) {
      return; // Browser doesn't support notifications
    }

    if (Notification.permission !== "granted") {
      // We'll ask for permission when user interacts with the page
      return;
    }

    const currentTime = new Date();

    // Find assignments that are due within 24 hours and not submitted
    const upcomingDeadlines = filteredAssignments.filter((assignment) => {
      if (assignment.submitted) return false;

      try {
        const dueDate = parseISO(assignment.due_date);

        // Skip if already past due
        if (isPast(dueDate)) return false;

        // Check if due within 24 hours
        const hoursRemaining = differenceInHours(dueDate, currentTime);
        return hoursRemaining <= 24 && hoursRemaining > 0;
      } catch (error) {
        console.error("Error parsing due date", error);
        return false;
      }
    });

    // Show notification for upcoming deadlines
    upcomingDeadlines.forEach((assignment) => {
      try {
        const dueDate = parseISO(assignment.due_date);
        const formattedDueDate = format(dueDate, "MMM d 'at' h:mm a");

        const notification = new Notification("Assignment Due Soon", {
          body: `${assignment.title} for ${assignment.course_name} is due on ${formattedDueDate}`,
          icon: "/favicon.ico", // Update with your app's icon
        });

        // Close notification after 10 seconds
        setTimeout(() => notification.close(), 10000);

        // When clicking the notification, navigate to the assignments page
        notification.onclick = () => {
          window.focus();
          setActiveTab("pending");
        };
      } catch (error) {
        console.error("Error showing notification", error);
      }
    });
  };

  // Add this effect to check deadlines periodically
  useEffect(() => {
    // Request notification permission when user interacts with page
    const requestNotificationPermission = () => {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      // Remove event listeners after first interaction
      document.removeEventListener("click", requestNotificationPermission);
      document.removeEventListener("keydown", requestNotificationPermission);
    };

    document.addEventListener("click", requestNotificationPermission);
    document.addEventListener("keydown", requestNotificationPermission);

    // Check deadlines on initial load and when assignments change
    if (filteredAssignments.length > 0) {
      checkUpcomingDeadlines();
    }

    // Schedule checks every hour
    const deadlineCheckInterval = setInterval(
      checkUpcomingDeadlines,
      60 * 60 * 1000
    );

    return () => {
      clearInterval(deadlineCheckInterval);
      document.removeEventListener("click", requestNotificationPermission);
      document.removeEventListener("keydown", requestNotificationPermission);
    };
  }, [filteredAssignments]);

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
        setSelectedCourse={(courseId: string | null) =>
          setSelectedCourse(courseId)
        }
        userCourses={userCourses}
      />

      <AssignmentArea
        assignments={paginatedAssignments}
        userCourses={userCourses}
        adminCourses={adminCourses}
        activeTab={activeTab}
        onAssignmentUpdated={loadAssignments}
        selectedCourse={selectedCourse}
      />

      {filteredAssignments.length > ITEMS_PER_PAGE && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

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
