import React, { useState, useEffect } from "react";
import { FaTimes, FaPaperclip, FaTrash } from "react-icons/fa";
import "./CreatePostModal.css";
import { courseService } from "../../services/courseService";

interface CreatePostModalProps {
  courseId: string;
  onClose: () => void;
  onPostCreated: (post: any) => void;
  isLoading?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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
      setError("File size should be less than 10MB");
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
    <div className="modal-overlay">
      <div className="modal-content create-post-modal">
        <div className="modal-header">
          <h2>Share your knowledge with the class</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="content-area">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, questions, or resources..."
              rows={8}
              required
            />

            {videoPreview && (
              <div className="video-preview">
                <iframe
                  src={videoPreview.replace("watch?v=", "embed/")}
                  title="Video Preview"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <div className="attachment-section">
              <label htmlFor="file-upload" className="file-upload-label">
                <FaPaperclip /> Attach File
              </label>
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                accept={ALLOWED_FILE_TYPES.join(",")}
                style={{ display: "none" }}
              />
              {file && (
                <div className="selected-file">
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="remove-file"
                  >
                    <FaTrash />
                  </button>
                </div>
              )}
            </div>
          </div>

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
              {isLoading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
