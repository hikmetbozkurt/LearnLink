import React from 'react';
import { useOutletContext } from 'react-router-dom';
import AssignmentArea from './AssignmentArea';
import { Course } from '../../types/course';

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
}

type AssignmentContextType = {
  assignments: Assignment[];
  userCourses: Course[];
  adminCourses: Course[];
  activeTab: string;
  onAssignmentUpdated: () => void;
};

const AssignmentAreaWrapper = () => {
  const { 
    assignments, 
    userCourses,
    adminCourses,
    activeTab,
    onAssignmentUpdated
  } = useOutletContext<AssignmentContextType>();

  return (
    <AssignmentArea
      assignments={assignments}
      userCourses={userCourses}
      adminCourses={adminCourses}
      activeTab={activeTab}
      onAssignmentUpdated={onAssignmentUpdated}
    />
  );
};

export default AssignmentAreaWrapper; 