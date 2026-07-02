const mongoose = require("mongoose");

const friendshipSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "friends", "blocked"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Compound indexes we designed — prevents duplicate requests
// and makes both directions fast lookups
friendshipSchema.index({ requester: 1, status: 1 });
friendshipSchema.index({ recipient: 1, status: 1 });
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model("Friendship", friendshipSchema);