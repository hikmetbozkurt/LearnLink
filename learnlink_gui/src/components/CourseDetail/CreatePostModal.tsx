import React, { useState, useEffect } from "react";
import { FaTimes, FaPaperclip, FaTrash, FaExclamationCircle } from "react-icons/fa";
import "./CreatePostModal.css";
import { courseService } from "../../services/courseService";

interface CreatePostModalProps {
  courseId: string;
  onClose: () => void;
  onPostCreated: (post: any) => void;
  isLoading?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  // Temel dosya tipleri
  ".pdf",
  ".txt",
  ".zip",
  ".rar",

  // Microsoft Word
  ".doc",
  ".docx",
  ".docm",
  ".dot",
  ".dotx",
  ".dotm",

  // Microsoft Excel
  ".xls",
  ".xlsx",
  ".xlsm",
  ".xlt",
  ".xltx",
  ".xltm",
  ".xlsb",
  ".csv",

  // Microsoft PowerPoint
  ".ppt",
  ".pptx",
  ".pptm",
  ".pot",
  ".potx",
  ".potm",
  ".pps",
  ".ppsx",
  ".ppsm",
];

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  courseId,
  onClose,
  onPostCreated,
  isLoading = false,
}) => {
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  // Video URL'ini kontrol et
  useEffect(() => {
    const videoUrlMatch = content.match(
      /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)([^\s&]+)/
    );
    if (videoUrlMatch) {
      setVideoPreview(videoUrlMatch[0]);
    } else {
      setVideoPreview(null);
    }
  }, [content]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Dosya uzantısını kontrol et
    const fileExtension =
      "." + selectedFile.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      setError(`Only ${ALLOWED_FILE_TYPES.join(", ")} files are allowed`);
      return;
    }

    // Dosya boyutunu kontrol et
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size should be less than 5MB");
      return;
    }

    setFile(selectedFile);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("content", content);

      // Video URL varsa
      if (videoPreview) {
        formData.append("type", "video");
        formData.append("videoUrl", videoPreview);
      }
      // Dosya varsa
      else if (file) {
        formData.append("type", "file");
        formData.append("file", file);
        // Add S3 specific metadata
        formData.append("storage_type", "s3");
      }
      // Sadece text
      else {
        formData.append("type", "text");
      }

      const result = await courseService.createPost(courseId, formData);
      onPostCreated(result);
      onClose();
    } catch (error: any) {
      setError(error.message || "Failed to create post");
    }
  };

  return (
    <div className="post-modal-overlay">
      <div className="post-modal-container">
        <div className="post-modal-header">
          <h2>Share your knowledge with the class</h2>
          <button className="post-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="post-modal-body">
        <form onSubmit={handleSubmit}>
            <div className="post-content-area">
            <textarea
                className="post-content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, questions, or resources..."
              rows={8}
              required
            />

            {videoPreview && (
                <div className="post-video-preview">
                <iframe
                  src={videoPreview.replace("watch?v=", "embed/")}
                  title="Video Preview"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

              <div className="post-attachment-section">
                <label htmlFor="file-upload" className="post-file-upload-label">
                <FaPaperclip /> Attach File (max 5MB)
              </label>
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                accept={ALLOWED_FILE_TYPES.join(",")}
                style={{ display: "none" }}
              />
              {file && (
                  <div className="post-selected-file">
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                      className="post-remove-file"
                  >
                    <FaTrash />
                  </button>
                </div>
              )}
            </div>
          </div>

            {error && (
              <div className="post-error-message">
                <FaExclamationCircle />
                {error}
              </div>
            )}

            <div className="post-modal-actions">
              <button type="button" className="post-cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
                className="post-submit-button"
              disabled={isLoading || !content.trim() || !!error}
            >
              {isLoading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
