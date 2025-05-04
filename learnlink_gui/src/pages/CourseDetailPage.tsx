import React, { useState, useEffect, useContext } from "react";
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
import { User } from "../types/user";

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { showNotification } = useContext(NotificationContext);
  const { user } = useContext(AuthContext);
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

  // user'ı User tipine cast edelim
  const currentUser = user as User;

  // İlgili kullanıcının kurs yöneticisi olup olmadığını kontrol eden useEffect
  useEffect(() => {
    if (course) {
      // API'den dönen is_admin değerini doğrudan kullan
      setIsInstructor(Boolean(course.is_admin));
    } else {
      setIsInstructor(false);
    }
  }, [course]);

  // Postları yükle
  const loadPosts = async () => {
    try {
      const postsData = await courseService.getCoursePosts(courseId!);
      setPosts(postsData);
    } catch (error) {
      console.error("Error loading posts:", error);
      showNotification("Failed to load posts", "error");
    }
  };

  useEffect(() => {
    const fetchCourseAndPosts = async () => {
      try {
        const courseData = await courseService.getCourse(courseId!);
        setCourse(courseData);
        await loadPosts();
      } catch (error) {
        console.error("Error fetching course details:", error);
        showNotification("Failed to load course details", "error");
      }
    };

    if (courseId) {
      fetchCourseAndPosts();
    }

    // Her 5 saniyede bir postları yenile
    const interval = setInterval(() => {
      if (courseId) {
        loadPosts();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [courseId]);  // user dependency'yi kaldırdım böylece sadece courseId değiştiğinde çalışacak

  // Kullanıcı değiştiğinde kurs bilgilerini yeniden yükle
  useEffect(() => {
    const refreshCourseData = async () => {
      if (courseId) {
        try {
          // Önce endpoint'i temizle (cache'i önlemek için)
          await courseService.getMyCourses();
          // Sonra kurs detaylarını yenile
          const freshCourseData = await courseService.getCourse(courseId);
          setCourse(freshCourseData);
        } catch (error) {
          console.error("Error refreshing course data:", error);
        }
      }
    };

    refreshCourseData();
  }, [courseId, user]); // user değiştiğinde çalışacak

  const handleComment = async (postId: string, content: string) => {
    try {
      await courseService.addComment(postId, content);
      const newPosts = await courseService.getCoursePosts(courseId!);
      setPosts(newPosts);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handlePostCreated = async (post: Post) => {
    try {
      await loadPosts(); // Yeni post eklenince tüm postları yeniden yükle
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
      await loadPosts(); // Postları yeniden yükle
      showNotification("Post deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting post:", error);
      showNotification("Failed to delete post", "error");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await courseService.deleteComment(commentId);
      await loadPosts(); // Postları yeniden yükle
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
      // Başarılı olduğunda doğrudan yönlendir
      navigate("/courses", { replace: true });
    } catch (error) {
      console.error("Error leaving course:", error);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      if (!course?.course_id) return;
      await courseService.deleteCourse(course.course_id);
      // Başarılı olduğunda doğrudan yönlendir
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
          currentUserId={user?.user_id || user?.id}
          userName={user?.name}
          isAdmin={Boolean(
            isInstructor || user?.role === "admin"
          )}
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
