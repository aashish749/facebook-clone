//    - `Message.js`: conversation ref, sender ref, text, media[], deliveredAt, readAt, createdAt

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
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
  deliveredAt: {
    type: Date,
  },
  readAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
