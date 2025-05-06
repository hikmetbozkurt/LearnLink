import React from "react";
import { Post } from "../../types/post";
import {
  FaRegComment,
  FaFile,
  FaRegClock,
  FaTrash,
  FaDownload,
} from "react-icons/fa";
import ConfirmationModal from "../shared/ConfirmationModal";
import "./PostList.css";
import api from "../../api/axiosConfig";

interface PostListProps {
  posts: {
    data: Post[]; // Backend'den gelen data array'i
    success: boolean;
    message: string;
  };
  onComment: (postId: string, content: string) => void;
  onDeletePost: (postId: string) => void;
  currentUserId?: string | number; // string | number olarak güncellendi
  userName?: string; // Yeni prop ekledik
  isAdmin: boolean;
  onDeleteComment: (commentId: string) => void;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  onComment,
  onDeletePost,
  currentUserId,
  userName, // Yeni prop'u ekleyelim
  isAdmin,
  onDeleteComment,
}) => {
  const postList = posts?.data || [];
  const [commentText, setCommentText] = React.useState<{
    [key: string]: string;
  }>({});
  const [expandedPost, setExpandedPost] = React.useState<string | null>(null);
  const [postToDelete, setPostToDelete] = React.useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = React.useState<{
    postId: string;
    commentId: string;
  } | null>(null);


  // Fix canDelete function to properly check author and currentUser IDs
  const canDelete = (authorId: number | string) => {
    // If no current user ID, can't delete
    if (!currentUserId) {
      return false;
    }

    // Convert both to strings for comparison
    const authorIdStr = String(authorId);
    const currentUserIdStr = String(currentUserId);
    
    // User can delete if they're the author or an admin
    return authorIdStr === currentUserIdStr || isAdmin;
  };

  const handleAddComment = (postId: string) => {
    if (commentText[postId]?.trim()) {
      onComment(postId, commentText[postId]);
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // 3 saat ileri al
    date.setHours(date.getHours() + 3);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false // 24 saat formatı için
    });
  };

  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId);
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    setCommentToDelete({ postId, commentId });
  };

  const handleConfirmDelete = () => {
    if (postToDelete) {
      onDeletePost(postToDelete);
      setPostToDelete(null);
    }
  };

  const handleConfirmDeleteComment = () => {
    if (commentToDelete) {
      // Log the comment being deleted
      // Call the onDeleteComment with just the comment ID as expected
      onDeleteComment(commentToDelete.commentId);
      setCommentToDelete(null);
    }
  };

  // Dosya adını ve uzantısını almak için yardımcı fonksiyon
  const getFileInfo = (fileUrl: string | undefined | null) => {
    if (!fileUrl) return { name: "", extension: "" };

    const parts = fileUrl.split("/");
    const fullName = decodeURIComponent(parts[parts.length - 1]);
    const nameWithoutTimestamp = fullName.substring(fullName.indexOf("-") + 1);
    const extension =
      nameWithoutTimestamp.split(".").pop()?.toLowerCase() || "";
    return { name: nameWithoutTimestamp, extension };
  };

  // Video URL'ini embed URL'ine çevir
  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("youtube.com")
        ? url.split("v=")[1]?.split("&")[0]
        : url.split("youtu.be/")[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  // Update the handleDownloadFile function to use the correct base URL
  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      // For S3 URLs, open in a new window/tab to let the browser handle the Content-Disposition
      if (fileUrl.includes('amazonaws.com')) {
        window.open(fileUrl, '_blank');
        return;
      }

      // For local URLs, use the fetch approach
      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${api.defaults.baseURL}${fileUrl}`;

      // Fetch the file from the URL
      const response = await fetch(fullUrl);

      // Error handling
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the file as a blob
      const blob = await response.blob();

      // Create a URL for the blob
      const blobUrl = URL.createObjectURL(blob);

      // Create a download link
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = fileName;

      // Add the link to the DOM and click it
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Clean up
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Dosya indirilirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  // Dosya tipini kontrol et
  const isDownloadableFile = (
    fileUrl: string | null | undefined,
    type: string
  ): boolean => {
    if (!fileUrl) return false;

    // Desteklenen uzantıları tanımla - Microsoft Office dosyalarını da ekleyelim
    const downloadableExtensions = [
      // Temel indirilebilir dosyalar
      ".txt",
      ".rar",
      ".zip",

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

    // Microsoft dosya tiplerini tanımla
    const microsoftTypes = ["word", "excel", "powerpoint", "doc", "xls", "ppt"];

    // Uzantı kontrolü
    const fileExtension = fileUrl.toLowerCase().split(".").pop();
    const hasDownloadableExtension = fileExtension
      ? downloadableExtensions.some((ext) =>
          fileUrl.toLowerCase().endsWith(ext)
        )
      : false;

    // Tip kontrolü
    const isDownloadableType =
      type === "txt" ||
      type === "rar" ||
      type === "zip" ||
      microsoftTypes.includes(type.toLowerCase());

    return hasDownloadableExtension || isDownloadableType;
  };

  return (
    <div className="post-list">
      {postList.map((post) => (
        <div key={post.post_id} className="post-card">
          <div className="post-header">
            <div className="post-info">
              <span className="author">{post.author_name}</span>
              <span className="date">
                <FaRegClock className="icon" />
                {formatDate(post.created_at)}
              </span>
            </div>
            {canDelete(post.author_id) && (
              <button
                className="delete-button"
                onClick={() => handleDeleteClick(post.post_id)}
              >
                <FaTrash className="icon" />
              </button>
            )}
          </div>

          <div className="post-content">{post.content}</div>

          {/* PDF ve diğer dosyaları göster */}
          {post.file_url && (
            <div className="pdf-content">
              {isDownloadableFile(post.file_url, post.type) ? (
                // İndirilebilir dosyalar için download butonu
                <button
                  onClick={() => {
                    if (!post.file_url) return; // TypeScript safety check

                    // Determine if it's an S3 URL or local URL
                    const isS3Url = post.file_url.includes('amazonaws.com') || post.file_url.includes('s3://');
                    
                    // Use the URL directly for S3, or use the API base URL for local files
                    const fileUrl = isS3Url ? post.file_url : `${api.defaults.baseURL}${post.file_url}`;

                    // Get the filename safely
                    let fileName = "file";
                    try {
                      // For S3 URLs, extract the filename after the last / and possibly after any query parameters
                      if (isS3Url) {
                        const pathParts = post.file_url.split('/');
                        let lastPart = pathParts[pathParts.length - 1];
                        // Remove any query parameters
                        if (lastPart.includes('?')) {
                          lastPart = lastPart.split('?')[0];
                        }
                        fileName = decodeURIComponent(lastPart);
                      } else {
                        // For local files, use the existing logic
                        const pathParts = post.file_url.split('/');
                        const lastPart = pathParts[pathParts.length - 1];
                        if (lastPart && lastPart.includes("-")) {
                          fileName = lastPart.substring(lastPart.indexOf("-") + 1);
                        }
                      }
                    } catch (error) {
                      console.error("Failed to get filename:", error);
                    }

                    // Use the updated download function
                    handleDownloadFile(fileUrl, fileName);
                  }}
                  className="download-button"
                >
                  <FaDownload />{" "}
                  {(() => {
                    if (!post.file_url) return "Dosya";

                    try {
                      const parts = post.file_url.split("/");
                      const lastPart = parts[parts.length - 1];
                      if (lastPart && lastPart.includes("-")) {
                        return lastPart.substring(lastPart.indexOf("-") + 1);
                      }
                    } catch (error) {
                      console.error("Dosya adı gösterimi alınamadı:", error);
                    }

                    return post.type === "txt"
                      ? "TXT Dosyası"
                      : post.type === "rar"
                      ? "RAR Dosyası"
                      : post.type === "zip"
                      ? "ZIP Dosyası"
                      : "Dosya";
                  })()}
                </button>
              ) : (
                // PDF ve diğer dosyalar için normal bağlantı
                <a
                  href={
                    post.file_url.includes('amazonaws.com') || post.file_url.includes('s3://') 
                      ? post.file_url 
                      : `${api.defaults.baseURL}${post.file_url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pdf-link"
                >
                  <FaFile
                    className={
                      post.file_url.toLowerCase().endsWith(".pdf") ||
                      post.type === "pdf"
                        ? "pdf-file-icon"
                        : ""
                    }
                  />{" "}
                  {(() => {
                    if (!post.file_url)
                      return post.type === "pdf" ? "PDF Dosyası" : "Dosya";

                    try {
                      // For S3 URLs, use a different filename extraction method
                      if (post.file_url.includes('amazonaws.com') || post.file_url.includes('s3://')) {
                        const parts = post.file_url.split('/');
                        let lastPart = parts[parts.length - 1];
                        // Remove query parameters if any
                        if (lastPart.includes('?')) {
                          lastPart = lastPart.split('?')[0];
                        }
                        return decodeURIComponent(lastPart);
                      } else {
                        // For local files, use existing logic
                        const parts = post.file_url.split("/");
                        const lastPart = parts[parts.length - 1];
                        if (lastPart && lastPart.includes("-")) {
                          return lastPart.substring(lastPart.indexOf("-") + 1);
                        }
                      }
                    } catch (error) {
                      console.error("Failed to get filename:", error);
                    }

                    return post.type === "pdf" ? "PDF Dosyası" : "Dosya";
                  })()}
                </a>
              )}
            </div>
          )}

          {/* Dosya türünde olup file_url'i olmayan postlar için bilgi mesajı */}
          {(post.type === "pdf" || post.type === "file") && !post.file_url && (
            <div className="pdf-content missing-file">
              <span className="file-missing">
                <FaFile className="missing-icon" /> Dosya bulunamadı
              </span>
            </div>
          )}

          {post.video_url && (
            <div className="video-container">
              <iframe
                src={getEmbedUrl(post.video_url)}
                title="Video Content"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <div className="post-actions">
            <button
              className="comment-button"
              onClick={() =>
                setExpandedPost(
                  expandedPost === post.post_id ? null : post.post_id
                )
              }
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
                    <div className="comment-info">
                      <span className="comment-author">
                        {comment.author_name}
                      </span>
                      <span className="comment-date">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    {/* Always show delete button for now to debug */}
                    <button
                      className="delete-button small"
                      onClick={() =>
                        handleDeleteComment(post.post_id, comment.comment_id)
                      }
                    >
                      <FaTrash className="icon" />
                    </button>
                  </div>
                  <p className="comment-content">{comment.content}</p>
                </div>
              ))}

              <div className="add-comment">
                <textarea
                  value={commentText[post.post_id] || ""}
                  onChange={(e) =>
                    setCommentText((prev) => ({
                      ...prev,
                      [post.post_id]: e.target.value,
                    }))
                  }
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

      <ConfirmationModal
        isOpen={!!postToDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setPostToDelete(null)}
      />

      <ConfirmationModal
        isOpen={!!commentToDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment?"
        onConfirm={handleConfirmDeleteComment}
        onCancel={() => setCommentToDelete(null)}
      />
    </div>
  );
};

export default PostList;
