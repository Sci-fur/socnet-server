const express = require("express");
const router = express.Router();
const { getConversation, getConversations, createConversation, deleteMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/conversations", createConversation);
router.get("/conversations", getConversations);
router.get("/:userId", getConversation);
router.delete("/:messageId", deleteMessage);

module.exports = router;