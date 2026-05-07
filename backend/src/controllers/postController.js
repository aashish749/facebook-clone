import Post from "../models/PostModel.js";
import User from "../models/UserModel.js";
import mongoose from "mongoose";

const getCurrentUserId = (req) =>
  req.user?.id || req.user?.userId || req.user?._id;

const normalizeMedia = (media = []) =>
  (Array.isArray(media) ? media : []).map((m) => ({
    url: m.secure_url || m.url || "",
    type: m.resource_type === "video" ? "video" : "image",
    public_id: m.public_id || m.publicId || "",
    duration: m.duration || undefined,
    width: m.width || undefined,
    height: m.height || undefined,
  }));

const normalizePost = (post, userId) => ({
  ...post,
  liked: Array.isArray(post.likes)
    ? post.likes.some((id) => id.toString() === userId.toString())
    : false,
});

// Create post (client uploads to Cloudinary, then calls this to persist metadata)
export const createPost = async (req, res) => {
  try {
    const {
      text,
      visibility = "public",
      media = [],
      type = "post",
    } = req.body || {};

    const authorId = getCurrentUserId(req);

    if (!authorId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Basic validation of media items
    const sanitizedMedia = normalizeMedia(media);

    if (type === "reel") {
      if (sanitizedMedia.length !== 1) {
        return res
          .status(400)
          .json({ message: "Reels must have exactly one video" });
      }

      const reelMedia = sanitizedMedia[0];
      if (reelMedia.type !== "video") {
        return res.status(400).json({ message: "Reels must be videos" });
      }

      if (reelMedia.duration && reelMedia.duration > 60) {
        return res
          .status(400)
          .json({ message: "Reels must be 60 seconds or less" });
      }
    }

    const post = new Post({
      author: authorId,
      text,
      media: sanitizedMedia,
      visibility,
      type,
    });

    await post.save();

    return res.status(201).json(post);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to create post" });
  }
};

export default { createPost };

// DELETE /api/posts/:id
export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own post" });
    }

    await post.deleteOne();

    return res.json({ message: "Post deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete post" });
  }
};

//-----------------------------------
// Get feed -------------------------

// GET /api/posts/feed?limit=20&cursor=<ISO date>
export const getFeed = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    //Get friends
    const me = await User.findById(userId).select("friends");
    const friends = (me && me.friends) || [];

    // Build query: posts by me or my friends, and respecting visibility
    // visibility: public OR author==me OR (visibility=='friends' AND author in friends)
    // We also filter by visibility: public OR my posts OR friends posts with visibility friends
    const finalQuery = {
      $and: [
        cursor ? { createdAt: { $lt: cursor } } : {},
        {
          $or: [
            { visibility: "public" },
            { author: userId },
            {
              $and: [{ visibility: "friends" }, { author: { $in: friends } }],
            },
          ],
        },
      ],
    };

    const docs = await Post.find(finalQuery)
      .sort({ createdAt: -1 })
      .limit(limit + 1) // fetch one extra to compute nextCursor
      .populate("author", "username avatarUrl")
      .lean();

    const hasMore = docs.length > limit;
    const posts = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore
      ? posts[posts.length - 1].createdAt.toISOString()
      : null;

    // mark whether current user liked each post
    const enriched = posts.map((p) => {
      return normalizePost(p, userId);
    });

    return res.json({ posts: enriched, nextCursor });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch feed" });
  }
};

// GET /api/posts/reels/feed?limit=20&cursor=<ISO date>
export const getReelsFeed = async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const query = {
      type: "reel",
      ...(cursor ? { createdAt: { $lt: cursor } } : {}),
      "media.0.type": "video",
    };

    const docs = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("author", "username avatarUrl")
      .lean();

    const hasMore = docs.length > limit;
    const posts = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore
      ? posts[posts.length - 1].createdAt.toISOString()
      : null;

    return res.json({
      posts: posts.map((post) => normalizePost(post, userId)),
      nextCursor,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch reels feed" });
  }
};

//============================================
//============================================
// POST /api/posts/:id/like
export const toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // check whether user already liked
    const already = await Post.findOne({ _id: postId, likes: userId }).lean();

    let post;
    if (already) {
      // unlike
      post = await Post.findByIdAndUpdate(
        postId,
        { $pull: { likes: userId }, $inc: { likesCount: -1 } },
        { new: true },
      ).lean();
    } else {
      // like
      post = await Post.findByIdAndUpdate(
        postId,
        { $addToSet: { likes: userId }, $inc: { likesCount: 1 } },
        { new: true },
      ).lean();
    }

    if (!post) return res.status(404).json({ message: "Post not found" });

    const liked =
      Array.isArray(post.likes) &&
      post.likes.some((id) => id.toString() === userId.toString());

    return res.json({ postId: post._id, likesCount: post.likesCount, liked });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to toggle like" });
  }
};
