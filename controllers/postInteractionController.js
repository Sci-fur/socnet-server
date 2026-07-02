const mongoose = require("mongoose");
const Like = require("../models/Like");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const notificationService = require("../services/notificationService");

// POST /api/posts/:id/like — toggle like
const toggleLike = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  console.log(req.params.id);
  try {
    const post = await Post.findById(req.params.id).session(session);

    if (!post) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Post not found" });
    }

    const existingLike = await Like.findOne({
      post: req.params.id,
      user: req.user.id,
    }).session(session);

    if (existingLike) {
      // Unlike — remove like document + decrement count
      await Like.deleteOne({ _id: existingLike._id }).session(session);
      await Post.findByIdAndUpdate(
        req.params.id,
        { $inc: { likesCount: -1 } },
        { session }
      );

      await session.commitTransaction();
      return res.status(200).json({ message: "Post unliked", liked: false });
    }

    // Like — insert like document + increment count
    await Like.create([{ post: req.params.id, user: req.user.id }], {
      session,
    });
    await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { likesCount: 1 } },
      { session }
    );

    await session.commitTransaction();

    // Notify post author — non-blocking, after transaction is safe
    if (post.author.toString() !== req.user.id) {
      notificationService.create("post_liked", {
        recipient: post.author,
        sender: req.user.id,
        entityType: "Post",
        entityId: post._id,
      }).catch(err => console.error("Notification error:", err));
    }

    res.status(201).json({ message: "Post liked", liked: true });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// GET /api/posts/:id/likes — get users who liked a post
const getLikes = async (req, res, next) => {
  try {
    const likes = await Like.find({ post: req.params.id })
      .populate("user", "firstName lastName profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({ likes });
  } catch (error) {
    next(error);
  }
};

// POST /api/posts/:id/comments — add comment
const addComment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const post = await Post.findById(req.params.id).session(session);
    if (!post) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Post not found" });
    }

    const [comment] = await Comment.create(
      [
        {
          post: req.params.id,
          author: req.user.id,
          content: req.body.content,
        },
      ],
      { session }
    );

    await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { commentsCount: 1 } },
      { session }
    );

    await session.commitTransaction();

    // Notify post author — non-blocking
    if (post.author.toString() !== req.user.id) {
      notificationService.create("comment", {
        recipient: post.author,
        sender: req.user.id,
        entityType: "Comment",
        entityId: comment._id,
      }).catch(err => console.error("Notification error:", err));
    }

    // Populate author details before sending response
    await comment.populate("author", "firstName lastName profilePicture");

    res.status(201).json({ comment });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// GET /api/posts/:id/comments — get comments on a post
const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate("author", "firstName lastName profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({ comments });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/posts/:id/comments/:commentId — delete own comment
const deleteComment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const comment = await Comment.findById(req.params.commentId).session(session);

    if (!comment) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Comment not found" });
    }

    // Only comment author can delete
    if (comment.author.toString() !== req.user.id) {
      await session.abortTransaction();
      return res.status(403).json({ message: "Not authorized" });
    }

    await Comment.deleteOne({ _id: comment._id }).session(session);
    await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { commentsCount: -1 } },
      { session }
    );

    await session.commitTransaction();
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

module.exports = {
  toggleLike,
  getLikes,
  addComment,
  getComments,
  deleteComment,
};