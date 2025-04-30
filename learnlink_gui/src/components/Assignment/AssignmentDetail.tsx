import React, { useState, useEffect, useContext } from "react";
import { format, isPast } from "date-fns";
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaUpload,
  FaFileAlt,
  FaQuestionCircle,
  FaBook,
  FaCommentAlt,
  FaStar,
  FaCheck,
} from "react-icons/fa";
import DeadlineCountdown from "./DeadlineCountdown";
import SubmitAssignmentModal from "./SubmitAssignmentModal";
import CreateAssignmentModal from "./CreateAssignmentModal";
import ConfirmModal from "../ConfirmModal";
import "./AssignmentDetail.css";
import { NotificationContext } from "../../contexts/NotificationContext";
import { courseService } from "../../services/courseService";

// Import the Assignment type from the assignmentService
import {
  assignmentService,
  Assignment,
  Submission,
} from "../../services/assignmentService";

interface AssignmentDetailProps {
  assignment: Assignment;
  isAdmin: boolean;
  onBack: () => void;
  onUpdate: () => void;
  selectedCourse?: string | null;
}

const AssignmentDetail: React.FC<AssignmentDetailProps> = ({
  assignment,
  isAdmin,
  onBack,
  onUpdate,
  selectedCourse,
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userSubmission, setUserSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserSubmission, setSelectedUserSubmission] =
    useState<Submission | null>(null);
  const [gradingData, setGradingData] = useState<{
    [key: string]: { grade: string; feedback: string };
  }>({});
  const [submittingGrades, setSubmittingGrades] = useState(false);
  const [courseName, setCourseName] = useState<string>(
    assignment.course_name || ""
  );

  const { showNotification } = useContext(NotificationContext);

  useEffect(() => {
    if (assignment) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment.assignment_id]); // Only re-run when assignment ID changes, not on every render

  // Fetch course name if not available
  useEffect(() => {
    const fetchCourseName = async () => {
      if (!assignment.course_name && assignment.course_id) {
        try {
          const course = await courseService.getCourse(assignment.course_id);
          setCourseName(course.title);
        } catch (error) {
          console.error("Error fetching course:", error);
          setCourseName(`Course ID: ${assignment.course_id}`);
        }
      }
    };

    fetchCourseName();
  }, [assignment.course_id, assignment.course_name]);

  const loadData = async () => {
    setIsLoading(true);

    try {
      if (isAdmin) {
        // Load all submissions for this assignment
        const result = await assignmentService.getSubmissions(
          assignment.assignment_id
        );
        setSubmissions(result);

        // Check if the admin has also submitted this assignment
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userData = JSON.parse(userStr);
          const userId = userData.user_id || userData.id;

          const adminSubmission = result.find(
            (s) => s.user_id.toString() === userId.toString()
          );

          if (adminSubmission) {
            setUserSubmission(adminSubmission);
          }
        }
      } else {
        // Load only the current user's submission
        const result = await assignmentService.getUserSubmission(
          assignment.assignment_id
        );
        if (result) {
          setUserSubmission(result);
        } else {
          setUserSubmission(null);
        }
      }
    } catch (error) {
      console.error("Error loading submissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (submissionData: any) => {
    try {
      await assignmentService.submitAssignment(
        assignment.assignment_id,
        submissionData
      );
      setShowSubmitModal(false);
      loadData();
      onUpdate();
    } catch (error) {
      console.error("Error submitting assignment:", error);
    }
  };

  const handleEdit = async (updatedData: Partial<Assignment>) => {
    try {
      await assignmentService.updateAssignment(
        assignment.assignment_id,
        updatedData
      );
      setShowEditModal(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating assignment:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await assignmentService.deleteAssignment(assignment.assignment_id);
      setShowDeleteConfirm(false);
      onBack();
    } catch (error) {
      console.error("Error deleting assignment:", error);
    }
  };

  const handleGrade = (
    submissionId: string,
    grade: string | number,
    feedback: string
  ) => {
    // Only allow valid grades
    if (typeof grade === "string") {
      // Remove non-numeric characters
      const numericGrade = grade.replace(/[^0-9.]/g, "");

      // Convert to number and validate
      let validatedGrade = numericGrade;
      if (numericGrade !== "") {
        const gradeNum = parseFloat(numericGrade);
        // Cannot be negative
        if (gradeNum < 0) validatedGrade = "0";
        // Cannot exceed assignment max points
        if (gradeNum > parseFloat(assignment.points?.toString() || "100"))
          validatedGrade = assignment.points?.toString() || "100";
      }

      grade = validatedGrade;
    }

    setGradingData((prev) => ({
      ...prev,
      [submissionId]: { grade: grade.toString(), feedback },
    }));

    setSubmissions((prevSubmissions) =>
      prevSubmissions.map((sub) =>
        sub.submission_id === submissionId ? { ...sub, grade, feedback } : sub
      )
    );
  };

  const submitGrades = async (submissionId: string) => {
    if (!gradingData[submissionId]) return;

    try {
      setSubmittingGrades(true);
      const { grade, feedback } = gradingData[submissionId];

      // Additional validation before submission
      let validGrade = grade;
      if (typeof grade === "string") {
        // Remove any non-numeric characters
        const numericGrade = grade.replace(/[^0-9.]/g, "");

        if (numericGrade === "") {
          showNotification("Please enter a valid numeric grade", "error");
          setSubmittingGrades(false);
          return;
        }

        // Convert to number and validate
        const gradeNum = parseFloat(numericGrade);
        // Cannot be negative
        if (gradeNum < 0) validGrade = "0";
        // Cannot exceed assignment max points
        if (gradeNum > parseFloat(assignment.points?.toString() || "100"))
          validGrade = assignment.points?.toString() || "100";
      }

      await assignmentService.gradeSubmission(
        assignment.assignment_id,
        submissionId,
        { grade: validGrade, feedback }
      );

      showNotification("Submission graded successfully", "success");

      // Update the submission in the UI to show it's been graded
      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((sub) =>
          sub.submission_id === submissionId
            ? {
                ...sub,
                grade: validGrade,
                feedback,
                graded_at: new Date().toISOString(),
              }
            : sub
        )
      );

      const newGradingData = { ...gradingData };
      delete newGradingData[submissionId];
      setGradingData(newGradingData);
    } catch (error) {
      console.error("Error grading submission:", error);
      showNotification("Failed to grade submission", "error");
    } finally {
      setSubmittingGrades(false);
    }
  };

  const getAssignmentTypeIcon = () => {
    switch (assignment.type) {
      case "quiz":
        return <FaQuestionCircle className="detail-type-icon" />;
      case "file":
        return <FaFileAlt className="detail-type-icon" />;
      default:
        return <FaBook className="detail-type-icon" />;
    }
  };

  const getStatusText = () => {
    // First check user submission directly
    if (userSubmission) {
      return userSubmission.grade ? "Graded" : "Submitted";
    }

    // Then check assignment metadata
    if (assignment.submitted === true) {
      return assignment.graded === true ? "Graded" : "Submitted";
    } else if (isPast(new Date(assignment.due_date))) {
      return "Missed";
    } else {
      return "Pending";
    }
  };

  const getStatusClass = () => {
    // First check user submission directly
    if (userSubmission) {
      return userSubmission.grade ? "status-graded" : "status-submitted";
    }

    // Then check assignment metadata
    if (assignment.submitted === true) {
      return assignment.graded === true ? "status-graded" : "status-submitted";
    } else if (isPast(new Date(assignment.due_date))) {
      return "status-late";
    } else {
      return "status-pending";
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
            <button
              className="edit-button"
              onClick={() => setShowEditModal(true)}
            >
              <FaEdit /> Edit
            </button>
            <button
              className="delete-button"
              onClick={() => setShowDeleteConfirm(true)}
            >
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
            Course: <span>{courseName}</span>
          </div>

          <div className="detail-due-date">
            Due:{" "}
            {format(new Date(assignment.due_date), "MMMM d, yyyy 'at' HH:mm")}
            {!isPast(new Date(assignment.due_date)) && !userSubmission && (
              <DeadlineCountdown dueDate={new Date(assignment.due_date)} />
            )}
          </div>

          <div className="detail-description">
            <h3>Instructions</h3>
            <div className="description-content">{assignment.description}</div>
          </div>

          {assignment.grading_criteria && (
            <div className="detail-grading-criteria">
              <h3>Grading Criteria</h3>
              <div className="grading-criteria-content">{assignment.grading_criteria}</div>
            </div>
          )}

          {!isAdmin &&
            !isPast(new Date(assignment.due_date)) &&
            !userSubmission && (
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
                <p>
                  Submitted on:{" "}
                  {userSubmission.submitted_at
                    ? format(
                        new Date(userSubmission.submitted_at),
                        "MMMM d, yyyy 'at' HH:mm"
                      )
                    : "Unknown date"}
                </p>
                {userSubmission.file_url && (
                  <a
                    href={userSubmission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="submission-file"
                  >
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
                    <h4>
                      <FaStar className="icon-grade" /> Grade:
                    </h4>
                    <p className="grade-value">{userSubmission.grade}</p>
                    {userSubmission.feedback && (
                      <div className="submission-feedback">
                        <h4>
                          <FaCommentAlt className="icon-feedback" /> Instructor
                          Feedback:
                        </h4>
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
            <div className="submissions-header">
              <h3>Student Submissions ({submissions.length})</h3>
            </div>

            {isLoading ? (
              <p>Loading submissions...</p>
            ) : submissions.length > 0 ? (
              <div className="submissions-list">
                {submissions.map((submission) => (
                  <div
                    key={submission.submission_id}
                    className="submission-item"
                  >
                    <div className="submission-header">
                      <div className="submission-user">
                        {submission.user_name}
                      </div>
                      <div className="submission-date">
                        Submitted:{" "}
                        {submission.submitted_at
                          ? format(
                              new Date(submission.submitted_at),
                              "MMM d, yyyy 'at' HH:mm"
                            )
                          : "Unknown date"}
                      </div>
                    </div>

                    <div className="submission-body">
                      {submission.file_url && (
                        <a
                          href={submission.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="submission-file"
                        >
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
                      <div className="grading-container">
                        <div className="grading-fields">
                          <label htmlFor={`grade-${submission.submission_id}`}>
                            <FaStar className="icon-grade" /> Grade:{" "}
                            <span className="max-points">
                              (Max: {assignment.points || 100} points)
                            </span>
                          </label>
                          <input
                            id={`grade-${submission.submission_id}`}
                            type="text"
                            placeholder={`Enter grade (0-${
                              assignment.points || 100
                            })`}
                            value={submission.grade || ""}
                            onChange={(e) =>
                              handleGrade(
                                submission.submission_id,
                                e.target.value,
                                submission.feedback || ""
                              )
                            }
                            className="grade-input"
                            disabled={Boolean(
                              submission.graded_at &&
                                !gradingData[submission.submission_id]
                            )}
                          />
                        </div>
                      </div>

                      <div className="grading-container">
                        <div className="grading-fields">
                          <label
                            htmlFor={`feedback-${submission.submission_id}`}
                          >
                            <FaCommentAlt className="icon-feedback" /> Feedback:
                          </label>
                          <textarea
                            id={`feedback-${submission.submission_id}`}
                            placeholder="Provide detailed feedback for the student"
                            value={submission.feedback || ""}
                            onChange={(e) =>
                              handleGrade(
                                submission.submission_id,
                                submission.grade || "",
                                e.target.value
                              )
                            }
                            className="feedback-input"
                            disabled={Boolean(
                              submission.graded_at &&
                                !gradingData[submission.submission_id]
                            )}
                          />
                        </div>

                        <div className="grade-actions">
                          <button
                            className={`submit-grade-button ${
                              submission.graded_at &&
                              !gradingData[submission.submission_id]
                                ? "graded-button"
                                : ""
                            }`}
                            onClick={() =>
                              submitGrades(submission.submission_id)
                            }
                            disabled={
                              submittingGrades ||
                              (!gradingData[submission.submission_id] &&
                                submission.graded_at) ||
                              gradingData[submission.submission_id]?.grade ===
                                "" ||
                              gradingData[submission.submission_id]?.grade ===
                                undefined
                            }
                          >
                            {submittingGrades ? (
                              "Submitting..."
                            ) : submission.graded_at &&
                              !gradingData[submission.submission_id] ? (
                              <>
                                <FaCheck /> Graded
                              </>
                            ) : (
                              <>
                                <FaEdit /> Submit Grade
                              </>
                            )}
                          </button>
                        </div>
                      </div>
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
