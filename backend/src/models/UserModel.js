import mongoose from "mongoose";

const friendRequestsSchema = new mongoose.Schema(
  {
    Sent: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    Received: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { _id: false },
);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  avatarUrl: {
    type: String,
  },
  bio: {
    type: String,
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  friendRequests: {
    type: friendRequestsSchema,
    default: () => ({ Sent: [], Received: [] }),
  },
  googleId: {
    type: String,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  refreshToken: [
    {
      token: { type: String, required: true },
      expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000),
      }, // The "deadline" for this token
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
