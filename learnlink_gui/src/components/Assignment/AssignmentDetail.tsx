import React, { useState, useEffect } from 'react';
import { format, isPast } from 'date-fns';
import { FaArrowLeft, FaEdit, FaTrash, FaUpload, FaFileAlt, FaQuestionCircle, FaBook } from 'react-icons/fa';
import DeadlineCountdown from './DeadlineCountdown';
import SubmitAssignmentModal from './SubmitAssignmentModal';
import CreateAssignmentModal from './CreateAssignmentModal';
import ConfirmModal from '../ConfirmModal';
import './AssignmentDetail.css';

// Import the Assignment type from the assignmentService
import { assignmentService, Assignment, Submission } from '../../services/assignmentService';

interface AssignmentDetailProps {
  assignment: Assignment;
  isAdmin: boolean;
  onBack: () => void;
  onUpdate: () => void;
}

const AssignmentDetail: React.FC<AssignmentDetailProps> = ({
  assignment,
  isAdmin,
  onBack,
  onUpdate
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userSubmission, setUserSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (assignment) {
      loadData();
    }
  }, [assignment]);
  
  const loadData = async () => {
    setIsLoading(true);
    
    try {
      if (isAdmin) {
        // Load all submissions for this assignment
        const result = await assignmentService.getSubmissions(assignment.assignment_id);
        setSubmissions(result);
      } else {
        // Load only the current user's submission
        const result = await assignmentService.getUserSubmission(assignment.assignment_id);
        if (result) {
          setUserSubmission(result);
        }
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (submissionData: any) => {
    try {
      await assignmentService.submitAssignment(assignment.assignment_id, submissionData);
      setShowSubmitModal(false);
      loadData();
      onUpdate();
    } catch (error) {
      console.error('Error submitting assignment:', error);
    }
  };
  
  const handleEdit = async (updatedData: Partial<Assignment>) => {
    try {
      await assignmentService.updateAssignment(assignment.assignment_id, updatedData);
      setShowEditModal(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };
  
  const handleDelete = async () => {
    try {
      await assignmentService.deleteAssignment(assignment.assignment_id);
      setShowDeleteConfirm(false);
      onBack();
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };
  
  const handleGrade = async (submissionId: string, grade: string | number, feedback: string) => {
    try {
      await assignmentService.gradeSubmission(
        assignment.assignment_id,
        submissionId,
        { grade, feedback }
      );
      loadData();
    } catch (error) {
      console.error('Error grading submission:', error);
    }
  };
  
  const getAssignmentTypeIcon = () => {
    switch(assignment.type) {
      case 'quiz': return <FaQuestionCircle className="detail-type-icon" />;
      case 'file': return <FaFileAlt className="detail-type-icon" />;
      default: return <FaBook className="detail-type-icon" />;
    }
  };
  
  const getStatusText = () => {
    if (userSubmission) {
      return userSubmission.grade ? 'Graded' : 'Submitted';
    } else if (isPast(new Date(assignment.due_date))) {
      return 'Missed';
    } else {
      return 'Pending';
    }
  };
  
  const getStatusClass = () => {
    if (userSubmission) {
      return userSubmission.grade ? 'status-graded' : 'status-submitted';
    } else if (isPast(new Date(assignment.due_date))) {
      return 'status-late';
    } else {
      return 'status-pending';
    }
  };
  
  return (
    <div className="assignment-detail">
      <div className="detail-header">
        <button className="back-button" onClick={onBack}>
          <FaArrowLeft /> Back
        </button>
        
        {isAdmin && (
          <div className="admin-actions">
            <button className="edit-button" onClick={() => setShowEditModal(true)}>
              <FaEdit /> Edit
            </button>
            <button className="delete-button" onClick={() => setShowDeleteConfirm(true)}>
              <FaTrash /> Delete
            </button>
          </div>
        )}
      </div>
      
      <div className="detail-content">
        <div className="detail-main">
          <div className="detail-title-section">
            {getAssignmentTypeIcon()}
            <h2 className="detail-title">{assignment.title}</h2>
            {!isAdmin && (
              <span className={`detail-status ${getStatusClass()}`}>
                {getStatusText()}
              </span>
            )}
          </div>
          
          <div className="detail-course">
            Course: <span>{assignment.course_name}</span>
          </div>
          
          <div className="detail-due-date">
            Due: {format(new Date(assignment.due_date), "MMMM d, yyyy 'at' h:mm a")}
            {!isPast(new Date(assignment.due_date)) && !userSubmission && (
              <DeadlineCountdown dueDate={new Date(assignment.due_date)} />
            )}
          </div>
          
          <div className="detail-description">
            <h3>Instructions</h3>
            <div className="description-content">
              {assignment.description}
            </div>
          </div>
          
          {!isAdmin && !isPast(new Date(assignment.due_date)) && !userSubmission && (
            <div className="detail-actions">
              <button 
                className="submit-button" 
                onClick={() => setShowSubmitModal(true)}
              >
                <FaUpload /> Submit Assignment
              </button>
            </div>
          )}
          
          {userSubmission && !isAdmin && (
            <div className="user-submission">
              <h3>Your Submission</h3>
              <div className="submission-info">
                <p>Submitted on: {format(new Date(userSubmission.timestamp), "MMMM d, yyyy 'at' h:mm a")}</p>
                {userSubmission.file_url && (
                  <a href={userSubmission.file_url} target="_blank" rel="noopener noreferrer" className="submission-file">
                    <FaFileAlt /> View Submitted File
                  </a>
                )}
                {userSubmission.content && (
                  <div className="submission-content">
                    <h4>Content:</h4>
                    <p>{userSubmission.content}</p>
                  </div>
                )}
                {userSubmission.grade && (
                  <div className="submission-grade">
                    <h4>Grade:</h4>
                    <p>{userSubmission.grade}</p>
                    {userSubmission.feedback && (
                      <div className="submission-feedback">
                        <h4>Feedback:</h4>
                        <p>{userSubmission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {isAdmin && (
          <div className="submissions-section">
            <h3>Submissions {submissions.length > 0 ? `(${submissions.length})` : ''}</h3>
            {isLoading ? (
              <p>Loading submissions...</p>
            ) : submissions.length > 0 ? (
              <div className="submissions-list">
                {submissions.map(submission => (
                  <div key={submission.submission_id} className="submission-item">
                    <div className="submission-header">
                      <div className="submission-user">{submission.user_name}</div>
                      <div className="submission-date">
                        {format(new Date(submission.timestamp), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                    
                    <div className="submission-body">
                      {submission.file_url && (
                        <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="submission-file">
                          <FaFileAlt /> View File
                        </a>
                      )}
                      {submission.content && (
                        <div className="submission-text">
                          <p>{submission.content}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="submission-grading">
                      <input 
                        type="text" 
                        placeholder="Grade" 
                        value={submission.grade || ''}
                        onChange={(e) => handleGrade(
                          submission.submission_id, 
                          e.target.value,
                          submission.feedback || ''
                        )}
                        className="grade-input"
                      />
                      <textarea 
                        placeholder="Feedback"
                        value={submission.feedback || ''}
                        onChange={(e) => handleGrade(
                          submission.submission_id,
                          submission.grade || '',
                          e.target.value
                        )}
                        className="feedback-input"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-submissions">No submissions yet</p>
            )}
          </div>
        )}
      </div>
      
      {showSubmitModal && (
        <SubmitAssignmentModal
          assignmentId={assignment.assignment_id}
          onClose={() => setShowSubmitModal(false)}
          onSubmit={handleSubmit}
        />
      )}
      
      {showEditModal && (
        <CreateAssignmentModal
          isEdit={true}
          initialData={assignment as any}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEdit}
        />
      )}
      
      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Assignment"
          message="Are you sure you want to delete this assignment? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};

export default AssignmentDetail; 