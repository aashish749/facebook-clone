import User from "../models/UserModel.js";
import Post from "../models/PostModel.js";

const getCurrentUserId = (req) =>
  req.user?.id || req.user?.userId || req.user?._id;

const toIdString = (value) => value?.toString?.() || String(value);

const normalizeFeedPost = (post, userId) => ({
  ...post,
  liked: Array.isArray(post.likes)
    ? post.likes.some((id) => toIdString(id) === toIdString(userId))
    : false,
});

export const getUserFeed = async (req, res) => {
  try {
    const viewerId = getCurrentUserId(req);
    const targetUserId = req.params.id;

    if (!viewerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const targetUser = await User.findById(targetUserId)
      .select("friends")
      .lean();
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const viewer = await User.findById(viewerId).select("friends").lean();
    const viewerFriends = viewer?.friends || [];
    const isSelf = toIdString(viewerId) === toIdString(targetUserId);
    const isFriend = viewerFriends.some(
      (friendId) => toIdString(friendId) === toIdString(targetUserId),
    );

    const visibilityFilter = isSelf
      ? {}
      : isFriend
        ? { $or: [{ visibility: "public" }, { visibility: "friends" }] }
        : { visibility: "public" };

    const posts = await Post.find({
      author: targetUserId,
      ...visibilityFilter,
    })
      .sort({ createdAt: -1 })
      .populate("author", "username avatarUrl")
      .lean();

    return res.json({
      userId: targetUserId,
      posts: posts.map((post) => normalizeFeedPost(post, viewerId)),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch user feed" });
  }
};
