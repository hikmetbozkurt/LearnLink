/**
 * Shared types for assignments in the LearnLink application
 */

/**
 * Assignment Interface
 * Represents an assignment within the system
 */
export interface Assignment {
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
 * Submission Interface
 * Represents a user's submission for an assignment
 */
export interface Submission {
  submission_id: string;
  assignment_id: string;
  user_id: string;
  content?: string;
  file_url?: string;
  submitted_at: string;
  grade?: string | number;
  feedback?: string;
  graded_at?: string; 
}

/**
 * Assignment Status Types
 * Represents possible status values for an assignment
 */
export type AssignmentStatus = 
  | "pending"
  | "submitted"
  | "late"
  | "graded"
  | "past";

/**
 * Assignment Type Types
 * Represents possible types of assignments
 */
export type AssignmentType = 
  | "assignment"
  | "quiz"
  | "file"; 