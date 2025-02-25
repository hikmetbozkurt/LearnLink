import React from 'react';
import { useOutletContext } from 'react-router-dom';
import CourseArea from './CourseArea';
import { Course } from '../../types/course';

type CourseContextType = {
  courses: Course[];
  activeTab: "dashboard" | "myCourses";
  onJoinCourse: (courseId: string) => void;
  onCourseJoined: () => void;
  filteredCourses: Course[];
};

const CourseAreaWrapper = () => {
  const { 
    courses, 
    activeTab, 
    onJoinCourse, 
    onCourseJoined,
    filteredCourses 
  } = useOutletContext<CourseContextType>();

  return (
    <CourseArea
      courses={filteredCourses}
      activeTab={activeTab}
      onJoinCourse={onJoinCourse}
      onCourseJoined={onCourseJoined}
    />
  );
};

export default CourseAreaWrapper; 