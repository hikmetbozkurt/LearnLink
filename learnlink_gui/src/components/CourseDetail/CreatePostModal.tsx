import React, { useState } from 'react';
import { FaFile, FaVideo, FaTimes } from 'react-icons/fa';
import { Post } from '../../types/post';
import { courseService } from '../../services/courseService';
import './CreatePostModal.css';

interface CreatePostModalProps {
  courseId: string;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
  isLoading?: boolean;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  courseId,
  onClose,
  onPostCreated,
  isLoading = false
}) => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<'text' | 'pdf' | 'video'>('text');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      const result = await courseService.createPost(courseId, {
        content,
        type,
        file: file || undefined
      });

      onPostCreated(result);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to create post');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content create-post-modal">
        <div className="modal-header">
          <h2>Create New Post</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Post Type</label>
            <div className="post-type-selector">
              <button
                type="button"
                className={`type-button ${type === 'text' ? 'active' : ''}`}
                onClick={() => setType('text')}
              >
                Text
              </button>
              <button
                type="button"
                className={`type-button ${type === 'pdf' ? 'active' : ''}`}
                onClick={() => setType('pdf')}
              >
                <FaFile /> PDF
              </button>
              <button
                type="button"
                className={`type-button ${type === 'video' ? 'active' : ''}`}
                onClick={() => setType('video')}
              >
                <FaVideo /> Video
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content..."
              rows={5}
            />
          </div>

          {type !== 'text' && (
            <div className="form-group">
              <label>{type === 'pdf' ? 'PDF File' : 'Video File'}</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept={type === 'pdf' ? '.pdf' : 'video/*'}
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading || !content.trim()}
            >
              {isLoading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal; 