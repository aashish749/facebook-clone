//   - `Post.js`: author ref, text, media [{ url, type, public_id, duration?, width, height }], likesCount, commentsCount, type: enum('post','reel'), visibility, createdAt

import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
  },
  media: [
    {
      url: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["image", "video"],
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
      duration: {
        type: Number, // in seconds, only for videos
      },
      width: {
        type: Number, // only for images/videos
      },
      height: {
        type: Number, // only for images/videos
      },
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
  type: {
    type: String,
    enum: ["post", "reel"],
    default: "post",
  },
  visibility: {
    type: String,
    enum: ["public", "friends", "private"],
    default: "public",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model("Post", postSchema);

export default Post;
