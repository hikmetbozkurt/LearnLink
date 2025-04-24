import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import pool from "../config/database.js";
import {
  createPost,
  getCoursePosts,
  getUserPostStats,
  getPostActivityOverTime
} from '../controllers/postController.js';

const router = express.Router();

// Dosya yükleme konfigürasyonu - Genişletilmiş versiyon
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Dosya tipine göre klasör seç
    let uploadDir = "uploads/files";

    if (file.mimetype === "application/pdf") {
      uploadDir = "uploads/pdf";
    } else if (file.mimetype.startsWith("image/")) {
      uploadDir = "uploads/images";
    } else if (
      file.mimetype === "text/plain" ||
      file.mimetype === "application/x-rar-compressed" ||
      file.mimetype === "application/zip" ||
      file.originalname.endsWith(".txt") ||
      file.originalname.endsWith(".rar") ||
      file.originalname.endsWith(".zip")
    ) {
      uploadDir = "uploads/files";
    }

    // Klasörü oluştur (yoksa)
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const originalName = encodeURIComponent(file.originalname);
    cb(null, `${timestamp}-${originalName}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Kabul edilebilir dosya tipleri
    const allowedTypes = [
      // PDF ve resimler
      "application/pdf",
      "image/jpeg",
      "image/png",

      // Temel indirilebilir dosyalar
      "text/plain", // .txt dosyaları
      "application/x-rar-compressed", // .rar dosyaları
      "application/zip", // .zip dosyaları
      "application/x-zip-compressed", // .zip alternatifi

      // Microsoft Word
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.ms-word.document.macroEnabled.12", // .docm
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template", // .dotx

      // Microsoft Excel
      "application/vnd.ms-excel", // .xls
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel.sheet.macroEnabled.12", // .xlsm
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template", // .xltx
      "text/csv", // .csv

      // Microsoft PowerPoint
      "application/vnd.ms-powerpoint", // .ppt
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
      "application/vnd.ms-powerpoint.presentation.macroEnabled.12", // .pptm
      "application/vnd.openxmlformats-officedocument.presentationml.template", // .potx
    ];

    // Dosya uzantısı kontrolü (bazı tarayıcılar/sistemler mimetype'ı doğru göndermiyor)
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = [
      // PDF ve resimler
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",

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

    if (
      allowedTypes.includes(file.mimetype) ||
      allowedExtensions.includes(fileExtension)
    ) {
      cb(null, true);
    } else {
      cb(null, false); // Kabul edilmeyen dosyaları sessizce reddet
    }
  },
});

// Özel indirilebilir dosya tiplerini ayarla
const DOWNLOADABLE_EXTENSIONS = [".txt", ".rar", ".zip"];

// Dosyaların indirme yönlendirmesi için middleware
router.use("/uploads/files/:filename", (req, res, next) => {
  const fileExtension = path.extname(req.params.filename).toLowerCase();

  // Eğer dosya tipi indirilebilir listesindeyse, Content-Disposition header'ı ekle
  if (DOWNLOADABLE_EXTENSIONS.includes(fileExtension)) {
    const filePath = path.join(
      process.cwd(),
      "uploads",
      "files",
      req.params.filename
    );

    // Dosyanın varlığını kontrol et
    if (fs.existsSync(filePath)) {
      const originalName = req.params.filename.substring(
        req.params.filename.indexOf("-") + 1
      );

      // Content-Disposition header'ı ile indirme işlemini zorla
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${originalName}"`
      );
      res.setHeader("Content-Type", "application/octet-stream");

      // Dosyayı gönder
      return res.sendFile(filePath);
    }
  }

  // Başka dosya tipleri için normal akışa devam et
  next();
});

router.use(authenticateToken);

// Course içindeki postları getir - Değişiklik yok
router.get("/courses/:courseId/posts", async (req, res) => {
  try {
    const { courseId } = req.params;
    const posts = await pool.query(
      `
      SELECT 
        p.*,
        u.name as author_name,
        u.username as author_username,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'comment_id', c.comment_id,
              'content', c.content,
              'author_name', cu.name,
              'created_at', c.created_at
            )
          )
          FROM comments c
          JOIN users cu ON c.author_id = cu.user_id
          WHERE c.post_id = p.post_id),
          '[]'
        ) as comments
      FROM posts p
      JOIN users u ON p.author_id = u.user_id
      WHERE p.course_id = $1 
      ORDER BY p.created_at DESC
    `,
      [courseId]
    );

    // Her zaman bir array dön
    res.json({
      success: true,
      data: posts.rows || [], // Boş array varsayılan
      message: posts.rows.length
        ? "Posts fetched successfully"
        : "No posts found",
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      data: [], // Frontend için boş array
      message: "Failed to fetch posts",
      error: error.message,
    });
  }
});

// Yeni post oluştur - GÜNCELLENEN KOD
router.post(
  "/courses/:courseId/posts",
  upload.single("file"),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      let { content, type } = req.body;
      const userId = req.user.user_id;

      console.log("Post create request:", {
        courseId,
        userId,
        content,
        type,
        file: req.file,
      });

      // SQL sorgusunu başlat
      let query;
      let params;
      let fileUrl = null;

      // Eğer dosya yüklendiyse
      if (req.file) {
        console.log("File uploaded:", req.file);

        // Dosya uzantısını al
        const fileExtension = path.extname(req.file.originalname).toLowerCase();

        // Dosya tipine göre post tipini otomatik belirle
        if (!type || type === "file") {
          if (
            fileExtension === ".pdf" ||
            req.file.mimetype === "application/pdf"
          ) {
            type = "pdf";
          } else if (
            fileExtension === ".txt" ||
            req.file.mimetype === "text/plain"
          ) {
            type = "txt";
          } else if (
            fileExtension === ".rar" ||
            req.file.mimetype === "application/x-rar-compressed"
          ) {
            type = "rar";
          } else if (
            fileExtension === ".zip" ||
            req.file.mimetype === "application/zip" ||
            req.file.mimetype === "application/x-zip-compressed"
          ) {
            type = "zip";
          } else if (req.file.mimetype.startsWith("image/")) {
            type = "image";
          } else if (
            // Microsoft Word
            fileExtension === ".doc" ||
            fileExtension === ".docx" ||
            fileExtension === ".docm" ||
            fileExtension === ".dot" ||
            fileExtension === ".dotx" ||
            fileExtension === ".dotm" ||
            req.file.mimetype === "application/msword" ||
            req.file.mimetype ===
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ) {
            type = "word";
          } else if (
            // Microsoft Excel
            fileExtension === ".xls" ||
            fileExtension === ".xlsx" ||
            fileExtension === ".xlsm" ||
            fileExtension === ".xlt" ||
            fileExtension === ".xltx" ||
            fileExtension === ".xltm" ||
            fileExtension === ".xlsb" ||
            fileExtension === ".csv" ||
            req.file.mimetype === "application/vnd.ms-excel" ||
            req.file.mimetype ===
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            req.file.mimetype === "text/csv"
          ) {
            type = "excel";
          } else if (
            // Microsoft PowerPoint
            fileExtension === ".ppt" ||
            fileExtension === ".pptx" ||
            fileExtension === ".pptm" ||
            fileExtension === ".pot" ||
            fileExtension === ".potx" ||
            fileExtension === ".potm" ||
            fileExtension === ".pps" ||
            fileExtension === ".ppsx" ||
            fileExtension === ".ppsm" ||
            req.file.mimetype === "application/vnd.ms-powerpoint" ||
            req.file.mimetype ===
              "application/vnd.openxmlformats-officedocument.presentationml.presentation"
          ) {
            type = "powerpoint";
          } else {
            type = "file"; // Diğer dosya türleri
          }
        }

        // Dosya yolu oluştur - req.file.path'i / ile bölüp sadece uploads kısmını al
        const pathParts = req.file.path.split("\\");
        const uploadIndex = pathParts.findIndex((part) => part === "uploads");

        if (uploadIndex !== -1) {
          fileUrl = "/" + pathParts.slice(uploadIndex).join("/");
          console.log("File URL generated:", fileUrl);
        } else {
          // Alternatif yol oluşturma (Windows ve Linux arasındaki farklılıklar için)
          fileUrl = "/" + req.file.path.replace(/\\/g, "/");
          console.log("Alternative file URL:", fileUrl);
        }
      }

      // Video URL'i varsa ekle
      let videoUrl = null;
      if (type === "video" && req.body.videoUrl) {
        videoUrl = req.body.videoUrl;
      }

      // Tüm post tipleri için tek bir SQL sorgusu kullan
      query = `
        INSERT INTO posts (course_id, author_id, content, type, file_url, video_url) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *
      `;
      params = [courseId, userId, content, type || "text", fileUrl, videoUrl];

      console.log("Executing query with params:", params);

      // Post'u oluştur
      const result = await pool.query(query, params);

      // Author bilgilerini al
      const userResult = await pool.query(
        "SELECT name as author_name, username as author_username FROM users WHERE user_id = $1",
        [userId]
      );

      // Post ve author bilgilerini birleştir
      const post = {
        ...result.rows[0],
        ...userResult.rows[0],
        comments: [],
      };

      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({
        message: "Failed to create post",
        error: error.message,
      });
    }
  }
);

// Post silme endpoint'i - Değişiklik yok
router.delete("/posts/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.user_id;

    // Önce post'un sahibini ve course instructor'ını kontrol et
    const checkResult = await pool.query(
      `
      SELECT 
        p.author_id,
        c.instructor_id
      FROM posts p
      JOIN courses c ON p.course_id = c.course_id
      WHERE p.post_id = $1
    `,
      [postId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const { author_id, instructor_id } = checkResult.rows[0];

    // Kullanıcı post'un sahibi veya course instructor'ı değilse izin verme
    if (userId !== author_id && userId !== instructor_id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this post",
      });
    }

    // Post'u sil
    await pool.query("DELETE FROM posts WHERE post_id = $1", [postId]);

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete post",
      error: error.message,
    });
  }
});

// Stats routes
router.get('/stats/posts', getUserPostStats);
router.get('/stats/posts/activity', getPostActivityOverTime);

export default router;
