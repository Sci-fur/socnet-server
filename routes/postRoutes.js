const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  createPost,
  getFeed,
  getUserPosts,
  getPost,
  deletePost,
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");
const { postUpload } = require("../config/cloudinary");

router.use(protect); // all post routes require auth

// Multer error wrapper
const uploadMedia = (req, res, next) => {
  postUpload.array("media", 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "File too large. Maximum size is 100 MB." });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ message: "Too many files. Maximum is 5." });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err) return res.status(500).json({ message: err.message });
    next();
  });
};

router.post("/", uploadMedia, createPost);
router.get("/feed", getFeed);
router.get("/user/:userId", getUserPosts);
router.get("/:id", getPost);
router.delete("/:id", deletePost);

module.exports = router;