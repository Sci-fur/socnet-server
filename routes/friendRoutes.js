const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { sendRequest, acceptRequest, declineRequest, unfriend, getFriends, getPendingRequests, getFriendshipStatus } = require("../controllers/friendController");
const router = express.Router();

router.use(protect);    // all friend routes are protected
router.post("/request/:recipientId", sendRequest);
router.patch("/accept/:requesterId", acceptRequest);
router.patch("/decline/:requesterId", declineRequest);
router.delete("/unfriend/:friendId", unfriend);
router.get("/", getFriends);
router.get("/requests", getPendingRequests);
router.get("/status/:userId", getFriendshipStatus)

module.exports = router;