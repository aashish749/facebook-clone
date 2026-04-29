//  - `Notification.js`: recipient ref, actor ref, type, payload(object), read boolean, createdAt

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  type: {
    type: String,
    enum: ["friend_request", "message", "post_like", "comment"],
    required: true,
  },
  payload: {
    type: Object, // Can store additional info like postId, commentId, etc.
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
