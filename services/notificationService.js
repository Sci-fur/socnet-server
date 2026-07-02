const Notification = require("../models/Notification");

let io;

const init = (socketIo) => {
  io = socketIo;
};

const create = async (type, { recipient, sender, entityType, entityId }) => {
  // Don't notify yourself
  if (recipient.toString() === sender.toString()) return;

  const notification = await Notification.create({
    recipient,
    sender,
    type,
    entityType,
    entityId,
  });

  const populated = await notification.populate("sender", "firstName lastName profilePicture");

  // Emit real-time if recipient is online
  if (io) {
    io.to(recipient.toString()).emit("notification", populated);
  }

  return populated;
};

module.exports = { init, create };