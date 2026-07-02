const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      maxlength: 1000,
      trim: true,
    },
  },
  { timestamps: true }
);

// Fast lookup of all comments on a post
commentSchema.index({ post: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", commentSchema);