import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  otpHash: { type: String, required: true },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index to auto-delete expired OTPs
  },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
