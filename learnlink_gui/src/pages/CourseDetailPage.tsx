import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NotificationContext } from "../contexts/NotificationContext";
import CourseHeader from "../components/CourseDetail/CourseHeader";
import PostList from "../components/CourseDetail/PostList";
import CreatePostModal from "../components/CourseDetail/CreatePostModal";
import { courseService } from "../services/courseService";
import { Course } from "../types/course";
import { Post } from "../types/post";
import "../styles/pages/CourseDetail.css";
import { AuthContext } from "../contexts/AuthContext";

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { showNotification } = useContext(NotificationContext);
  const { user } = useContext(AuthContext);
  
  // Create the ref to track component mount state
  const isMounted = useRef(true);
  
  // Fallback to localStorage if context user is undefined
  const getCurrentUser = () => {
    if (user) return user;
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      return null;
    }
  };
  
  const currentUser = getCurrentUser();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [posts, setPosts] = useState<{
    data: Post[];
    success: boolean;
    message: string;
  }>({
    data: [],
    success: true,
    message: "",
  });
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);

  // Dedicated function to fetch posts that can be reused
  const fetchPosts = async () => {
    if (!courseId) return;
    
    try {

      const postsData = await courseService.getCoursePosts(courseId);

      setPosts(postsData);
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };

  // Main effect for initial data loading and post refresh
  useEffect(() => {

    
    // Load course data only once at mount
    const fetchCourseData = async () => {
      if (!courseId) return;
      
      try {
        const courseData = await courseService.getCourse(courseId);
        setCourse(courseData);
        setIsInstructor(Boolean(courseData.is_admin));
      } catch (error) {
        console.error("Error fetching course details:", error);
        showNotification("Failed to load course details", "error");
      }
    };
    
    // Execute initial data load
    fetchCourseData();
    fetchPosts(); // Fetch posts immediately

    // Set up interval for regular post updates
    const interval = setInterval(() => {

      fetchPosts();
    }, 5000);
    
    // Cleanup on unmount
    return () => {

      clearInterval(interval);
      isMounted.current = false;
    };
  }, [courseId, showNotification]);

  const handleComment = async (postId: string, content: string) => {
    try {
      await courseService.addComment(postId, content);
      await fetchPosts();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handlePostCreated = async (post: Post) => {
    try {
      await fetchPosts();
      setShowCreatePost(false);
      showNotification("Post created successfully", "success");
    } catch (error) {
      console.error("Error refreshing posts:", error);
      showNotification("Failed to refresh posts", "error");
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await courseService.deletePost(postId);
      await fetchPosts();
      showNotification("Post deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting post:", error);
      showNotification("Failed to delete post", "error");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {

      await courseService.deleteComment(commentId);
      await fetchPosts();
      showNotification("Comment deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting comment:", error);
      showNotification("Failed to delete comment", "error");
    }
  };

  const handleLeaveCourse = async () => {
    try {
      if (!course?.course_id) return;
      await courseService.leaveCourse(course.course_id);
      navigate("/courses", { replace: true });
    } catch (error) {
      console.error("Error leaving course:", error);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      if (!course?.course_id) return;
      await courseService.deleteCourse(course.course_id);
      navigate("/courses", { replace: true });
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  return (
    <div className="course-detail-container">
      <CourseHeader
        course={course}
        onCreatePost={() => setShowCreatePost(true)}
        onLeaveCourse={handleLeaveCourse}
        onDeleteCourse={handleDeleteCourse}
        isInstructor={isInstructor}
      />

      <div className="course-detail-content">
        <PostList
          posts={posts}
          onComment={handleComment}
          onDeletePost={handleDeletePost}
          onDeleteComment={handleDeleteComment}
          currentUserId={currentUser?.user_id || currentUser?.id}
          userName={currentUser?.name}
          isAdmin={Boolean(isInstructor || currentUser?.role === "admin")}
        />
      </div>

      {showCreatePost && (
        <CreatePostModal
          courseId={courseId!}
          onClose={() => setShowCreatePost(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
};

export default CourseDetailPage;
