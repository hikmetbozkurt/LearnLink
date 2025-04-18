import React, { useState } from 'react';
import { FaTimes, FaUpload, FaFile } from 'react-icons/fa';
import './SubmitAssignmentModal.css';

interface SubmitAssignmentModalProps {
  assignmentId: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const SubmitAssignmentModal: React.FC<SubmitAssignmentModalProps> = ({
  assignmentId,
  onClose,
  onSubmit
}) => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleRemoveFile = () => {
    setFile(null);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Create submission data
    const formData = new FormData();
    formData.append('assignment_id', assignmentId);
    
    if (content.trim()) {
      formData.append('content', content);
    }
    
    if (file) {
      formData.append('file', file);
    }
    
    onSubmit(formData);
  };
  
  return (
    <div className="modal-overlay">
      <div className="assignment-modal submit-modal">
        <div className="modal-header">
          <h2>Submit Assignment</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="content">Submission Text (Optional)</label>
            <textarea
              id="content"
              value={content}
              onChange={handleContentChange}
              rows={6}
              placeholder="Enter your submission text here..."
            />
          </div>
          
          <div className="form-group file-upload-group">
            <label>Upload File (Optional)</label>
            
            {!file ? (
              <div className="file-upload-container">
                <label htmlFor="file-upload" className="file-upload-label">
                  <FaUpload />
                  <span>Choose a file to upload</span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  className="file-input"
                />
              </div>
            ) : (
              <div className="file-preview">
                <div className="file-info">
                  <FaFile className="file-icon" />
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                </div>
                <button 
                  type="button" 
                  className="remove-file-button"
                  onClick={handleRemoveFile}
                >
                  <FaTimes />
                </button>
              </div>
            )}
          </div>
          
          {!content.trim() && !file && (
            <p className="validation-message">
              Please enter text or upload a file to submit.
            </p>
          )}
          
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading || (!content.trim() && !file)}
            >
              {isLoading ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitAssignmentModal; 