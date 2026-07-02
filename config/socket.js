const jwt = require("jsonwebtoken");
const User = require("../models/User");
const notificationService = require("../services/notificationService");

// Map to track online users — { userId: socketId }
const onlineUsers = new Map();

const initSocket = (io) => {

    // Authenticate socket connection via JWT
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            // || socket.handshake.headers.authorization?.split(" ")[1];
            if (!token) return next(new Error("Authentication error"));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("DECODED:", decoded);

            const user = await User.findById(decoded.id).select("-password");
            console.log("USER:", user);

            if (!user) {
                console.log("❌ User not found");
                return next(new Error("User not found"));
            }

            socket.user = user;
            next();
        } catch (error) {
            console.log("❌ AUTH ERROR:", error.message);
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.user._id.toString();
        console.log(`User connected: ${userId}`);

        // Register user as online
        onlineUsers.set(userId, socket.id);

        // Send list of currently online users to this client (excluding self)
        const currentlyOnline = Array.from(onlineUsers.keys()).filter(id => id !== userId);
        socket.emit("users:online", { users: currentlyOnline });

        // Broadcast online status to all connected clients
        io.emit("user:online", { userId });

        // Send message
        socket.on("message:send", async ({ recipientId, content }) => {
            try {
                const Message = require("../models/Message");

                const message = await Message.create({
                    sender: userId,
                    recipient: recipientId,
                    content,
                });

                const populated = await message.populate("sender", "firstName lastName profilePicture");

                // Send to recipient if online
                const recipientSocketId = onlineUsers.get(recipientId);
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit("message:receive", populated);
                }

                // Notify recipient — non-blocking
                // Skip if recipient is online (they already got the message live)
                if (!recipientSocketId) {
                    notificationService.create("message", {
                        recipient: recipientId,
                        sender: userId,
                        entityType: "Message",
                        entityId: message._id,
                    }).catch(err => console.error("Notification error:", err));
                }

                // Confirm delivery back to sender
                socket.emit("message:sent", populated);
            } catch (error) {
                socket.emit("message:error", { message: "Failed to send message" });
            }
        });

        // Typing indicators
        socket.on("typing:start", ({ recipientId }) => {
            const recipientSocketId = onlineUsers.get(recipientId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("typing:start", { userId });
            }
        });

        socket.on("typing:stop", ({ recipientId }) => {
            const recipientSocketId = onlineUsers.get(recipientId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("typing:stop", { userId });
            }
        });

        // Mark messages as read
        socket.on("message:read", async ({ senderId }) => {
            try {
                const Message = require("../models/Message");
                await Message.updateMany(
                    { sender: senderId, recipient: userId, read: false },
                    { read: true }
                );

                // Notify sender their messages were read
                const senderSocketId = onlineUsers.get(senderId);
                if (senderSocketId) {
                    io.to(senderSocketId).emit("message:read", { by: userId });
                }
            } catch (error) {
                console.error("Read receipt error:", error.message);
            }
        });

        // Delete message - notify recipient
        socket.on("message:delete", async ({ messageId, recipientId }) => {
            try {
                // Notify recipient that message was deleted
                const recipientSocketId = onlineUsers.get(recipientId);
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit("message:deleted", { messageId });
                }
            } catch (error) {
                console.error("Message delete notification error:", error.message);
            }
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${userId}`);
            onlineUsers.delete(userId);
            io.emit("user:offline", { userId });
        });
    });
};

module.exports = { initSocket, onlineUsers };