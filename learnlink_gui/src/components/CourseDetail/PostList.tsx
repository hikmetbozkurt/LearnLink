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

  // canDelete fonksiyonunu güncelleyelim
  const canDelete = (authorId: number | string) => {
    // Debug için detaylı log
    console.log("Delete Permission Check:", {
      authorId,
      currentUserId,
      isAdmin,
      authorIdType: typeof authorId,
      currentUserIdType: typeof currentUserId,
      storedUser: JSON.parse(localStorage.getItem("user") || "null"),
    });

    // authorId ve currentUserId string'e çevrilmeli
    const authorIdStr = String(authorId);
    const currentUserIdStr = String(currentUserId);

    const isAuthor = authorIdStr === currentUserIdStr;

    console.log("Permission Result:", {
      isAuthor,
      isAdmin,
      canDelete: isAuthor || isAdmin,
      comparison: {
        authorIdStr,
        currentUserIdStr,
        equal: authorIdStr === currentUserIdStr,
      },
    });

    return isAuthor || isAdmin;
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

  // Dosya indirme fonksiyonu - yeniden yazıldı, fetch API kullanarak
  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    console.log("Downloading file:", fileName, "from URL:", fileUrl);

    try {
      // Dosyayı fetch ile al
      const response = await fetch(fileUrl);

      // Hata kontrolü
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Blob olarak al (ikili dosya içeriği)
      const blob = await response.blob();

      // Blob için URL oluştur
      const blobUrl = URL.createObjectURL(blob);

      // İndirme bağlantısı oluştur
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = fileName; // İndirilecek dosyanın adı

      // Bağlantıyı DOM'a ekle ve tıkla
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Temizlik
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl); // Bellek sızıntısını önlemek için

      console.log("Download initiated successfully");
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

  // Post verilerini konsolda gösterelim (Debug için)
  React.useEffect(() => {
    postList.forEach((post) => {
      console.log("Post Details:", {
        postId: post.post_id,
        type: post.type,
        fileUrl: post.file_url,
        hasFile: !!post.file_url,
        fileName: post.file_url ? post.file_url.split("/").pop() : null,
        isPdf: post.file_url
          ? post.file_url.toLowerCase().endsWith(".pdf")
          : false,
      });
    });
  }, [postList]);

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
                    if (!post.file_url) return; // TypeScript için güvenlik kontrolü

                    const fileUrl = `http://localhost:5001${post.file_url}`;

                    // Dosya adını güvenli bir şekilde alalım
                    let fileName = "file";
                    try {
                      const pathParts = post.file_url.split("/");
                      const lastPart = pathParts[pathParts.length - 1];
                      if (lastPart && lastPart.includes("-")) {
                        fileName = lastPart.substring(
                          lastPart.indexOf("-") + 1
                        );
                      }
                    } catch (error) {
                      console.error("Dosya adı alınamadı:", error);
                    }

                    // Yeni indirme fonksiyonunu kullan
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
                  href={`http://localhost:5001${post.file_url}`}
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
                      const parts = post.file_url.split("/");
                      const lastPart = parts[parts.length - 1];
                      if (lastPart && lastPart.includes("-")) {
                        return lastPart.substring(lastPart.indexOf("-") + 1);
                      }
                    } catch (error) {
                      console.error("Dosya adı gösterimi alınamadı:", error);
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
                    {(comment.author_name === userName || isAdmin) && (
                      <button
                        className="delete-button small"
                        onClick={() =>
                          handleDeleteComment(post.post_id, comment.comment_id)
                        }
                      >
                        <FaTrash className="icon" />
                      </button>
                    )}
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
