const express = require("express")
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getUserProfile, updateUserProfile, searchUsers } = require("../controllers/userController");
const { upload } = require("../config/cloudinary");

router.get("/search", protect, searchUsers);
router.get("/:id", protect, getUserProfile);
router.patch("/:id", protect, upload.fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "coverPhoto", maxCount: 1 }
]), updateUserProfile);

module.exports = router;