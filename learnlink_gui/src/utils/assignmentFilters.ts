import { isPast, parseISO } from "date-fns";
import { Course } from "../types/course";

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

/**
 * Checks if user is an admin for a specific course
 */
export const isAdminForCourse = (courseId: string, adminCourses: Course[]): boolean => {
  return adminCourses.some(
    (course) => course.course_id.toString() === courseId.toString()
  );
};

/**
 * Checks if a user has access to an assignment (either as admin or regular user)
 */
export const hasAccessToAssignment = (
  assignment: Assignment,
  userCourses: Course[],
  adminCourses: Course[]
): boolean => {
  const isAdmin = isAdminForCourse(assignment.course_id, adminCourses);
  
  if (isAdmin) {
    return true;
  }
  
  return userCourses.some(
    (course) => course.course_id.toString() === assignment.course_id.toString()
  );
};

/**
 * Filters pending assignments (not submitted, not past due)
 */
export const filterPendingAssignments = (
  assignments: Assignment[],
  userCourses: Course[],
  adminCourses: Course[]
): Assignment[] => {
  return assignments.filter((a) => {
    const dueDate = a.due_date ? parseISO(a.due_date) : new Date();
    const isPastDue = isPast(dueDate);
    
    // For admin users, show unsubmitted assignments from courses they manage
    if (isAdminForCourse(a.course_id, adminCourses)) {
      return !a.submitted && !a.graded && !isPastDue;
    }

    // For regular users, show their unsubmitted assignments from enrolled courses
    return (
      !a.submitted &&
      !a.graded &&
      !isPastDue &&
      userCourses.some(
        (course) => course.course_id.toString() === a.course_id.toString()
      )
    );
  });
};

/**
 * Filters late assignments (not submitted, past due)
 */
export const filterLateAssignments = (
  assignments: Assignment[],
  userCourses: Course[],
  adminCourses: Course[]
): Assignment[] => {
  return assignments.filter((a) => {
    const dueDate = a.due_date ? parseISO(a.due_date) : new Date();
    const isPastDue = isPast(dueDate);
    
    // For admins, show assignments that are past due with missing submissions
    if (isAdminForCourse(a.course_id, adminCourses)) {
      return !a.submitted && isPastDue;
    }

    // For regular users, only show their own assignments that are not submitted and past due
    return !a.submitted && isPastDue && userCourses.some(
      (course) => course.course_id.toString() === a.course_id.toString()
    );
  });
};

/**
 * Filters submitted assignments (submitted but not graded)
 */
export const filterSubmittedAssignments = (
  assignments: Assignment[],
  userCourses: Course[],
  adminCourses: Course[]
): Assignment[] => {
  return assignments.filter((a) => {
    // For admin, show all assignments that have at least one non-graded submission
    if (isAdminForCourse(a.course_id, adminCourses)) {
      // Has submissions but not all are graded
      return a.submission_count && a.submission_count > 0 && !a.graded;
    }
    
    // For regular users, only show their own submitted but not graded assignments
    return a.submitted && !a.graded && userCourses.some(
      (course) => course.course_id.toString() === a.course_id.toString()
    );
  });
};

/**
 * Filters graded assignments
 */
export const filterGradedAssignments = (
  assignments: Assignment[],
  userCourses: Course[],
  adminCourses: Course[]
): Assignment[] => {
  return assignments.filter((a) => {
    // For admins, show all graded assignments from courses they manage
    if (isAdminForCourse(a.course_id, adminCourses)) {
      return a.graded;
    }

    // For regular users, show only their graded assignments
    return a.submitted && a.graded && userCourses.some(
      (course) => course.course_id.toString() === a.course_id.toString()
    );
  });
};

/**
 * Filters past assignments (due date has passed or assignment is graded)
 */
export const filterPastAssignments = (
  assignments: Assignment[],
  userCourses: Course[],
  adminCourses: Course[]
): Assignment[] => {
  return assignments.filter((a) => {
    const dueDate = a.due_date ? parseISO(a.due_date) : new Date();
    const isPastDue = isPast(dueDate);
    const isGraded = ensureBoolean(a.graded);
    
    // Now consider both past due date assignments AND graded assignments as "past"
    
    // For admins, show all past due or graded assignments from courses they manage
    if (isAdminForCourse(a.course_id, adminCourses)) {
      return isPastDue || isGraded;
    }

    // For regular users, show assignments that are past due or graded for courses they're enrolled in
    return (isPastDue || isGraded) && userCourses.some(
      (course) => course.course_id.toString() === a.course_id.toString()
    );
  });
};

/**
 * Returns assignments sorted by due date (most recent first)
 */
export const sortAssignmentsByDueDate = (assignments: Assignment[]): Assignment[] => {
  return [...assignments].sort((a, b) => {
    const dateA = a.due_date ? parseISO(a.due_date) : new Date();
    const dateB = b.due_date ? parseISO(b.due_date) : new Date();
    return dateB.getTime() - dateA.getTime();
  });
};

/**
 * Utility function to properly convert any value to a boolean
 * Handles different formats that may come from the API
 */
export const ensureBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  
  if (typeof value === 'number') {
    return value === 1;
  }
  
  // Handle null, undefined, and other types
  return Boolean(value);
}; 