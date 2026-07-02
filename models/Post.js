const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      maxlength: 5000,
      default: "",
    },
    media: [
      {
        url: { type: String },
        publicId: { type: String }, // for Cloudinary deletion
        type: { type: String, enum: ["image", "video"] },
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes we designed — author for profile posts, createdAt for feed cursor
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);