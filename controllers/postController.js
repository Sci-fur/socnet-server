const Post = require("../models/Post");
const Friendship = require("../models/Friendship");

// POST /api/posts
const createPost = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: "Post must have content or media" });
    }

    const media = req.files
      ? req.files.map((file) => ({
          url: file.path,
          publicId: file.filename,
          type: file.mimetype.startsWith("video") ? "video" : "image",
        }))
      : [];

    const post = await Post.create({
      author: req.user.id,
      content,
      media,
    });

    await post.populate("author", "firstName lastName profilePicture");

    res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
};

// GET /api/posts/feed?cursor=<postId>&limit=10
const getFeed = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor || null;

    // Step 1 — find all friends of logged in user
    const friendships = await Friendship.find({
      $or: [{ requester: req.user.id }, { recipient: req.user.id }],
      status: "friends",
    });

    const friendIds = friendships.map((f) =>
      f.requester.toString() === req.user.id.toString()
        ? f.recipient
        : f.requester
    );

    // Include own posts in feed
    friendIds.push(req.user.id);

    // Step 2 — build cursor query
    const query = { author: { $in: friendIds } };
    if (cursor) {
      query._id = { $lt: cursor }; // posts older than cursor
    }

    // Step 3 — fetch posts
    const posts = await Post.find(query)
      .sort({ _id: -1 }) // newest first
      .limit(limit + 1)  // fetch one extra to check if more exist
      .populate("author", "firstName lastName profilePicture");

    // Step 4 — determine if there's a next page
    const hasMore = posts.length > limit;
    if (hasMore) posts.pop(); // remove the extra post

    const nextCursor = hasMore ? posts[posts.length - 1]._id : null;

    res.status(200).json({ posts, nextCursor, hasMore });
  } catch (error) {
    next(error);
  }
};

// GET /api/posts/user/:userId
const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ author: userId })
      .sort({ _id: -1 })
      .populate("author", "firstName lastName profilePicture");

    res.status(200).json({ posts });
  } catch (error) {
    next(error);
  }
};

// GET /api/posts/:id
const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "firstName lastName profilePicture"
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ post });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/posts/:id
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Authorization — only author can delete
    if (post.author.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    await post.deleteOne();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPost, getFeed, getUserPosts, getPost, deletePost };