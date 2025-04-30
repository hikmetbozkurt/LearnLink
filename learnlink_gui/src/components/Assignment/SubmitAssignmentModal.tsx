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
    <div className="sa-modal-overlay">
      <div className="sa-assignment-modal sa-submit-modal">
        <div className="sa-modal-header">
          <h2>Submit Assignment</h2>
          <button className="sa-close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="sa-form-group">
            <label htmlFor="content">Submission Text (Optional)</label>
            <textarea
              id="content"
              value={content}
              onChange={handleContentChange}
              rows={6}
              placeholder="Enter your submission text here..."
              className="sa-textarea"
            />
          </div>
          
          <div className="sa-form-group sa-file-upload-group">
            <label>Upload File (Optional)</label>
            
            {!file ? (
              <div className="sa-file-upload-container">
                <label htmlFor="file-upload" className="sa-file-upload-label">
                  <FaUpload />
                  <span>Choose a file to upload</span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  className="sa-file-input"
                />
              </div>
            ) : (
              <div className="sa-file-preview">
                <div className="sa-file-info">
                  <FaFile className="sa-file-icon" />
                  <span className="sa-file-name">{file.name}</span>
                  <span className="sa-file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                </div>
                <button 
                  type="button" 
                  className="sa-remove-file-button"
                  onClick={handleRemoveFile}
                >
                  <FaTimes />
                </button>
              </div>
            )}
          </div>
          
          {!content.trim() && !file && (
            <p className="sa-validation-message">
              Please enter text or upload a file to submit.
            </p>
          )}
          
          <div className="sa-form-actions">
            <button type="button" className="sa-cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="sa-submit-button"
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