import React, { useState } from "react";
import { Post } from "../../types/post";
import {
  FaRegComment,
  FaFile,
  FaVideo,
  FaRegClock,
  FaTrash,
  FaDownload,
} from "react-icons/fa";
import ConfirmationModal from "../shared/ConfirmationModal";
import "./PostList.css";

interface PostListProps {
  posts: {
    data: Post[]; // Backend'den gelen data array'i
    success: boolean;
    message: string;
  };
  onComment: (postId: string, content: string) => void;
  onDeletePost: (postId: string) => void;
  currentUserId?: string; // undefined olabilir
  isAdmin: boolean;
  onDeleteComment: (commentId: string) => void;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  onComment,
  onDeletePost,
  currentUserId,
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

  // Debug için
  console.log("PostList Props:", {
    currentUserId,
    isAdmin,
    firstPost: posts.data[0],
  });

  // Debug logları ekleyelim
  React.useEffect(() => {
    console.log("Debug PostList:", {
      posts: postList,
      currentUserId,
      isAdmin,
      firstPostAuthorId: postList[0]?.author_id,
      firstPostAuthorType: typeof postList[0]?.author_id,
      currentUserIdType: typeof currentUserId,
    });
  }, [postList, currentUserId, isAdmin]);

  // Silme butonu kontrolünü güncelleyelim
  const canDelete = (authorId: number | string) => {
    console.log("Can Delete Check:", {
      authorId,
      currentUserId,
      isAdmin,
      authorIdType: typeof authorId,
      currentUserIdType: typeof currentUserId,
      isEqual: String(authorId) === String(currentUserId),
    });
    return String(authorId) === String(currentUserId) || isAdmin;
  };

  const handleAddComment = (postId: string) => {
    if (commentText[postId]?.trim()) {
      onComment(postId, commentText[postId]);
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

          {post.file_url && (
            <div className="file-content">
              <a
                href={`http://localhost:5001${post.file_url}`}
                target={post.type === "pdf" ? "_blank" : "_self"}
                rel={post.type === "pdf" ? "noopener noreferrer" : undefined}
                className="file-link"
                download={post.type !== "pdf"}
              >
                <FaFile />{" "}
                {post.file_url.split("/").pop()?.split("-").slice(1).join("-")}
              </a>
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
              {post.comments.map((comment) => {
                console.log("Comment Debug:", {
                  comment,
                  authorId: comment.author_id,
                  currentUserId,
                  isAdmin,
                  canDelete: canDelete(comment.author_id),
                });

                return (
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
                      {canDelete(comment.author_id) && (
                        <button
                          className="delete-button small"
                          onClick={() =>
                            handleDeleteComment(
                              post.post_id,
                              comment.comment_id
                            )
                          }
                        >
                          <FaTrash className="icon" />
                        </button>
                      )}
                    </div>
                    <p className="comment-content">{comment.content}</p>
                  </div>
                );
              })}

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
