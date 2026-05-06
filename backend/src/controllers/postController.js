import Post from "../models/PostModel.js";

export const createPost = async (req, res) => {
  try {
    const {
      text,
      visibility = "public",
      media = [],
      type = "post",
    } = req.body || {};

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Basic validation of media items
    const sanitizedMedia = (media || []).map((m) => ({
      url: m.secure_url || m.url || "",
      type: m.resource_type === "video" ? "video" : "image",
      public_id: m.public_id || m.publicId || "",
      duration: m.duration || undefined,
      width: m.width || undefined,
      height: m.height || undefined,
    }));

    const post = new Post({
      author: req.user.id,
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
