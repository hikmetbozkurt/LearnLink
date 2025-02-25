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

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { showNotification } = useContext(NotificationContext);
  const [course, setCourse] = useState<Course | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourse();
      loadPosts();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const courseData = await courseService.getCourse(courseId!);
      setCourse(courseData);
    } catch (error) {
      showNotification('Failed to load course', 'error');
    }
  };

  const loadPosts = async () => {
    try {
      const postsData = await courseService.getCoursePosts(courseId!);
      setPosts(postsData);
    } catch (error) {
      showNotification('Failed to load posts', 'error');
    }
  };

  const handleComment = async (postId: string, content: string) => {
    try {
      await courseService.addComment(postId, content);
      loadPosts(); // Reload posts to get the new comment
      showNotification('Comment added successfully', 'success');
    } catch (error) {
      showNotification('Failed to add comment', 'error');
    }
  };

  const handlePostCreated = async (post: Post) => {
    setPosts([post, ...posts]);
    setShowCreatePost(false);
    showNotification('Post created successfully', 'success');
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
        />
      </div>

      {showCreatePost && (
        <CreatePostModal
          courseId={courseId!}
          onClose={() => setShowCreatePost(false)}
          onPostCreated={(newPost) => {
            setPosts([newPost, ...posts]);
            setShowCreatePost(false);
            showNotification('Post created successfully!', 'success');
          }}
        />
      )}
    </div>
  );
};

export default CourseDetailPage; 