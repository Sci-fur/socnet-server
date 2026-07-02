const Message = require("../models/Message");
const User = require("../models/User");

// POST /api/messages/conversations — create or get conversation
const createConversation = async (req, res, next) => {
  try {
    const currentUser = req.user._id;
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: "recipientId is required" });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if there's any existing message between them
    const existingMessage = await Message.findOne({
      $or: [
        { sender: currentUser, recipient: recipientId },
        { sender: recipientId, recipient: currentUser },
      ],
    }).sort({ createdAt: -1 });

    if (existingMessage) {
      return res.status(200).json({ 
        conversation: existingMessage,
        message: "Conversation already exists" 
      });
    }

    // Return empty conversation (no messages yet)
    res.status(200).json({ 
      conversation: null,
      message: "No conversation yet" 
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/messages/:userId — fetch conversation history
const getConversation = async (req, res, next) => {
  try {
    const currentUser = req.user._id;
    const otherUser = req.params.userId;
    const limit = parseInt(req.query.limit) || 30;
    const before = req.query.before; // cursor — message _id

    const query = {
      $or: [
        { sender: currentUser, recipient: otherUser },
        { sender: otherUser, recipient: currentUser },
      ],
    };

    if (before) {
      query._id = { $lt: before };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("sender", "firstName lastName profilePicture");

    res.status(200).json({ messages: messages.reverse() });
  } catch (error) {
    next(error);
  }
};

// GET /api/messages/conversations — get all conversations (latest message per user)
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userId] },
              "$recipient",
              "$sender",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$recipient", userId] }, { $eq: ["$read", false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          "user.password": 0,
        },
      },
    ]);

    res.status(200).json({ conversations });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/messages/:messageId — delete a message
const deleteMessage = async (req, res, next) => {
  try {
    const currentUser = req.user._id;
    const messageId = req.params.messageId;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only sender can delete their own message
    if (message.sender.toString() !== currentUser.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getConversation, getConversations, createConversation, deleteMessage };