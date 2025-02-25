import React, { useState } from 'react';
import { Post } from '../../types/post';
import { FaRegComment, FaFile, FaVideo, FaRegClock } from 'react-icons/fa';
import './PostList.css';

interface PostListProps {
  posts: Post[];
  onComment: (postId: string, content: string) => void;
}

const PostList: React.FC<PostListProps> = ({ posts, onComment }) => {
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  const handleAddComment = (postId: string) => {
    if (commentText[postId]?.trim()) {
      onComment(postId, commentText[postId]);
      setCommentText(prev => ({ ...prev, [postId]: '' }));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="post-list">
      {posts.map((post) => (
        <div key={post.post_id} className="post-card">
          <div className="post-header">
            <div className="post-info">
              <span className="author">{post.author_name}</span>
              <span className="date">
                <FaRegClock className="icon" />
                {formatDate(post.created_at)}
              </span>
            </div>
            <div className="post-type">
              {post.type === 'pdf' && <FaFile className="icon" />}
              {post.type === 'video' && <FaVideo className="icon" />}
            </div>
          </div>
          
          <div className="post-content">
            {post.type === 'text' ? (
              <p>{post.content}</p>
            ) : (
              <div className="file-content">
                {post.type === 'pdf' ? (
                  <a href={post.file_url} target="_blank" rel="noopener noreferrer" className="file-link">
                    <FaFile className="icon" />
                    View PDF Document
                  </a>
                ) : (
                  <div className="video-container">
                    <video src={post.file_url} controls />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="post-actions">
            <button 
              className="comment-button"
              onClick={() => setExpandedPost(expandedPost === post.post_id ? null : post.post_id)}
            >
              <FaRegComment className="icon" />
              {post.comments.length} Comments
            </button>
          </div>

          {(expandedPost === post.post_id || post.comments.length > 0) && (
            <div className="comments-section">
              {post.comments.map((comment) => (
                <div key={comment.comment_id} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">{comment.author_name}</span>
                    <span className="comment-date">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="comment-content">{comment.content}</p>
                </div>
              ))}

              <div className="add-comment">
                <textarea
                  value={commentText[post.post_id] || ''}
                  onChange={(e) => setCommentText(prev => ({ 
                    ...prev, 
                    [post.post_id]: e.target.value 
                  }))}
                  placeholder="Write a comment..."
                  rows={2}
                />
                <button 
                  onClick={() => handleAddComment(post.post_id)}
                  disabled={!commentText[post.post_id]?.trim()}
                >
                  Comment
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PostList; 