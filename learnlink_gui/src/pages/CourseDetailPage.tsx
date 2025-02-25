import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { NotificationContext } from '../contexts/NotificationContext';
import CourseHeader from '../components/CourseDetail/CourseHeader';
import PostList from '../components/CourseDetail/PostList';
import CreatePostModal from '../components/CourseDetail/CreatePostModal';
import { courseService } from '../services/courseService';
import { Course } from '../types/course';
import { Post } from '../types/post';
import '../styles/pages/CourseDetail.css';
import { AuthContext } from '../contexts/AuthContext';

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { showNotification } = useContext(NotificationContext);
  const { user } = useContext(AuthContext);
  const [course, setCourse] = useState<Course | null>(null);
  const [posts, setPosts] = useState<{ data: Post[], success: boolean, message: string }>({
    data: [],
    success: true,
    message: ''
  });
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Postları yükle
  const loadPosts = async () => {
    try {
      const postsData = await courseService.getCoursePosts(courseId!);
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
      showNotification('Failed to load posts', 'error');
    }
  };

  useEffect(() => {
    const fetchCourseAndPosts = async () => {
      try {
        const courseData = await courseService.getCourse(courseId!);
        setCourse(courseData);
        await loadPosts();

        // Debug logları
        console.log('Course Data:', {
          courseId: courseData.course_id,
          instructorId: courseData.instructor_id,
          instructorName: courseData.instructor_name
        });
        console.log('Current User:', {
          userId: user?.user_id,
          name: user?.name
        });
        console.log('Is Instructor:', courseData.instructor_id?.toString() === user?.user_id?.toString());
      } catch (error) {
        console.error('Error fetching course details:', error);
        showNotification('Failed to load course details', 'error');
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
  }, [courseId, user]);

  const handleComment = async (postId: string, content: string) => {
    try {
      await courseService.addComment(postId, content);
      const newPosts = await courseService.getCoursePosts(courseId!);
      setPosts(newPosts);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handlePostCreated = async (post: Post) => {
    try {
      await loadPosts(); // Yeni post eklenince tüm postları yeniden yükle
      setShowCreatePost(false);
      showNotification('Post created successfully', 'success');
    } catch (error) {
      console.error('Error refreshing posts:', error);
      showNotification('Failed to refresh posts', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await courseService.deletePost(postId);
      await loadPosts(); // Postları yeniden yükle
      showNotification('Post deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting post:', error);
      showNotification('Failed to delete post', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await courseService.deleteComment(commentId);
      await loadPosts(); // Postları yeniden yükle
      showNotification('Comment deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting comment:', error);
      showNotification('Failed to delete comment', 'error');
    }
  };

  return (
    <div className="course-detail-container">
      <CourseHeader 
        course={course}
        onCreatePost={() => setShowCreatePost(true)}
      />
      
      <div className="course-detail-content">
        <PostList 
          posts={posts}
          onComment={handleComment}
          onDeletePost={handleDeletePost}
          onDeleteComment={handleDeleteComment}
          currentUserId={user?.user_id}
          isAdmin={course?.instructor_id?.toString() === user?.user_id?.toString()}
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