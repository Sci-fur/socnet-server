const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  toggleLike,
  getLikes,
  addComment,
  getComments,
  deleteComment,
} = require("../controllers/postInteractionController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/like", toggleLike);
router.get("/likes", getLikes);

router.post("/comments", addComment);
router.get("/comments", getComments);
router.delete("/comments/:commentId", deleteComment);

module.exports = router;