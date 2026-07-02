const Friendship = require("../models/Friendship");
const User = require("../models/User");
const notificationService = require("../services/notificationService");

const sendRequest = async (req, res, next) => {
    try {
        const requesterId = req.user.id;
        const { recipientId } = req.params;

        // Edge case 1: self request
        if (requesterId === recipientId) {
            return res.status(400).json({ message: "Cannot send request to yourself" });
        }

        // Edge case 2: recipients exists
        const recipient = await User.findById(recipientId);
        console.log(recipientId)
        if (!recipient) {
            return res.status(404).json({ message: "User not found" });
        }

        // Edge case 3, 4, 5 - checking existing relationship in both directions
        const existing = await Friendship.findOne({
            $or: [
                { requester: requesterId, recipient: recipientId },
                { requester: recipientId, recipient: requesterId },

            ]
        })

        if (existing) {
            if (existing.status === "friends") {
                return res.status(400).json({ message: "Already friends" });
            }
            if (existing.status === "pending") {
                return res.status(400).json({ message: "Request already pending" });
            }
            if (existing.status === "blocked") {
                return res.status(403).json({ message: "Action not allowed" });
            }
        }

        // Create friendship document
        const friendship = await Friendship.create({
            requester: requesterId,
            recipient: recipientId,
            status: "pending",
        })

        // Notify recipient — non-blocking
        notificationService.create("friend_request", {
            recipient: recipientId,
            sender: requesterId,
            entityType: "User",
            entityId: requesterId,
        }).catch(err => console.error("Notification error:", err));


        res.status(201).json({ message: "Friend request sent", friendship });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

// PATCH /api/friends/accept/:requesterId
const acceptRequest = async (req, res, next) => {
    try {
        const recipientId = req.user.id;
        const { requesterId } = req.params;
        const friendship = await Friendship.findOne({
            requester: requesterId,
            recipient: recipientId,
            status: "pending"
        });

        if (!friendship) {
            return res.status(404).json({ message: "Friend request not found" })
        }

        friendship.status = "friends";
        await friendship.save();

        res.status(200).json({ message: "Friend request accepted", friendship });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

// PATCH /api/friends/decline/:requesterId
const declineRequest = async (req, res, next) => {
    try {
        const recipientId = req.user.id;
        const { requesterId } = req.params;

        const friendship = await Friendship.findOneAndDelete({
            requester: requesterId,
            recipient: recipientId,
            status: "pending",
        });

        if (!friendship) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        res.status(200).json({ message: "Friend request declined" });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/friends/unfriend/:friendId
const unfriend = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.params;

        const friendship = await Friendship.findOneAndDelete({
            $or: [
                { requester: userId, recipient: friendId },
                { requester: friendId, recipient: userId },
            ],
            status: "friends",
        });

        if (!friendship) {
            return res.status(404).json({ message: "Friendship not found" });
        }

        res.status(200).json({ message: "Unfriended successfully" });
    } catch (error) {
        next(error);
    }
};

// GET /api/friends/
const getFriends = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const friendships = await Friendship.find({
            $or: [
                { requester: userId },
                { recipient: userId },
            ],
            status: "friends",
        })
            .populate("requester", "firstName lastName profilePicture")
            .populate("recipient", "firstName lastName profilePicture");

        // Return the other person in each friendship
        const friends = friendships.map((f) => {
            return f.requester._id.toString() === userId
                ? f.recipient
                : f.requester;
        });

        res.status(200).json({ friends });
    } catch (error) {
        next(error);
    }
};

// GET /api/friends/requests
const getPendingRequests = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const requests = await Friendship.find({
            recipient: userId,
            status: "pending",
        }).populate("requester", "firstName lastName profilePicture");

        res.status(200).json({ requests });
    } catch (error) {
        next(error);
    }
};

// GET /api/friends/status/:userId
const getFriendshipStatus = async (req, res, next) => {
    try {
        const currentUserId = req.user.id;
        const { userId } = req.params;

        const friendship = await Friendship.findOne({
            $or: [
                { requester: currentUserId, recipient: userId },
                { requester: userId, recipient: currentUserId },
            ],
        });

        if (!friendship) {
            return res.status(200).json({ status: "none" });
        }

        res.status(200).json({
            status: friendship.status,
            // tells the frontend who initiated — useful for showing correct buttons
            isRequester: friendship.requester.toString() === currentUserId,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    sendRequest,
    acceptRequest,
    declineRequest,
    unfriend,
    getFriends,
    getPendingRequests,
    getFriendshipStatus
}