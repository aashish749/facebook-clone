import {
  generateToken,
  verifyToken,
  generateShortToken,
} from "../services/jwt";
import User from "../models/UserModel";
import Otp from "../models/OtpModel";
import bcrypt from "bcrypt";
import { sendEmail } from "../services/emailService";
import crypto from "crypto";

const REFRESH_TOKEN_COOKIE = "refreshToken";
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: REFRESH_TOKEN_TTL,
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Require email verification
    if (!user.emailVerified) {
      return res
        .status(403)
        .json({ message: "Email not verified. Please verify your account." });
    }

    // Issue short-lived access token and a refresh token (httpOnly cookie)
    const accessToken = generateShortToken(
      { userId: user._id, type: "access" },
      "15m",
    );

    // Create refresh token (long-lived) and store hashed version in DB
    const refreshToken = generateToken({ userId: user._id, type: "refresh" });
    const refreshHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    user.refreshToken.push({
      token: refreshHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });
    await user.save();

    // Set httpOnly cookie with raw refresh token
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions);

    res.json({ accessToken });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message });
  }
};

//signup controller
export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      email,
      passwordHash,
    });

    // Save the user
    await newUser.save();

    // Generate OTP and store as separate Otp document
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const otpDoc = new Otp({
      user: newUser._id,
      otpHash,
      expiresAt: otpExpires,
      attempts: 0,
      lastSentAt: new Date(),
    });
    await otpDoc.save();

    // Send OTP email
    const subject = "Your verification code";
    const text = `Your verification code is: ${otp}. It will expire in 10 minutes.`;
    await sendEmail(email, subject, text);

    // Generate short verification token the client will use to verify (references otp doc)
    const verificationToken = generateShortToken(
      { otpId: otpDoc._id, type: "verify" },
      "15m",
    );

    res
      .status(201)
      .json({ message: "User created. OTP sent to email.", verificationToken });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { verificationToken, otp } = req.body;
    if (!verificationToken || !otp)
      return res.status(400).json({ message: "Missing token or otp" });

    const payload = verifyToken(verificationToken);
    if (!payload || payload.type !== "verify")
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });

    const otpDoc = await Otp.findById(payload.otpId);
    if (!otpDoc)
      return res.status(404).json({ message: "OTP entry not found" });

    // Check expiry
    if (!otpDoc.expiresAt || otpDoc.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "OTP expired. Request a new one." });
    }

    // Check attempts
    if (otpDoc.attempts >= 5) {
      return res
        .status(429)
        .json({ message: "Too many attempts. Request a new OTP." });
    }

    const isMatch = await bcrypt.compare(otp, otpDoc.otpHash || "");
    if (!isMatch) {
      otpDoc.attempts = (otpDoc.attempts || 0) + 1;
      await otpDoc.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Success: mark user verified, remove otpDoc, issue auth token
    const user = await User.findById(otpDoc.user);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.emailVerified = true;

    // Create access + refresh, store hashed refresh, set cookie
    const accessToken = generateShortToken(
      { userId: user._id, type: "access" },
      "15m",
    );
    const refreshToken = generateToken({ userId: user._id, type: "refresh" });
    const refreshHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    user.refreshToken.push({
      token: refreshHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    await user.save();
    await otpDoc.deleteOne();

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions);

    res.json({ message: "Email verified", accessToken });
  } catch (err) {
    console.error("verifyOtp error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Refresh access token using httpOnly refresh cookie (rotates refresh token)
export const refresh = async (req, res) => {
  try {
    const rawRefresh = req.cookies && req.cookies[REFRESH_TOKEN_COOKIE];
    if (!rawRefresh)
      return res.status(401).json({ message: "No refresh token" });

    const payload = verifyToken(rawRefresh);
    if (!payload || payload.type !== "refresh")
      return res.status(401).json({ message: "Invalid refresh token" });

    const user = await User.findById(payload.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const refreshHash = crypto
      .createHash("sha256")
      .update(rawRefresh)
      .digest("hex");
    const stored = user.refreshToken.find(
      (r) => r.token === refreshHash && r.expiresAt > new Date(),
    );
    if (!stored) {
      // possible reuse or revoked
      return res.status(401).json({ message: "Refresh token revoked" });
    }

    // Rotate refresh token: replace stored with a new hash
    const newRefresh = generateToken({ userId: user._id, type: "refresh" });
    const newHash = crypto
      .createHash("sha256")
      .update(newRefresh)
      .digest("hex");
    stored.token = newHash;
    stored.expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL);
    await user.save();

    // Set cookie with new raw refresh token
    res.cookie(REFRESH_TOKEN_COOKIE, newRefresh, cookieOptions);

    // Issue new access token
    const accessToken = generateShortToken(
      { userId: user._id, type: "access" },
      "15m",
    );
    res.json({ accessToken });
  } catch (err) {
    console.error("refresh error:", err);
    res.status(500).json({ message: err.message });
  }
};
//------------------------------------------
//resend OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.emailVerified)
      return res.status(400).json({ message: "Email already verified" });

    // Rate limit: check lastSentAt
    const existingOtp = await Otp.findOne({ user: user._id }).sort({
      createdAt: -1,
    });
    if (
      existingOtp &&
      existingOtp.lastSentAt &&
      new Date() - new Date(existingOtp.lastSentAt) < 60 * 1000
    ) {
      return res.status(429).json({
        message: "OTP recently sent. Please wait before requesting again.",
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (existingOtp) {
      existingOtp.otpHash = otpHash;
      existingOtp.expiresAt = otpExpires;
      existingOtp.attempts = 0;
      existingOtp.lastSentAt = new Date();
      await existingOtp.save();
    } else {
      const otpDoc = new Otp({
        user: user._id,
        otpHash,
        expiresAt: otpExpires,
        attempts: 0,
        lastSentAt: new Date(),
      });
      await otpDoc.save();
    }

    // Send OTP email
    const subject = "Your verification code";
    const text = `Your verification code is: ${otp}. It will expire in 10 minutes.`;
    await sendEmail(email, subject, text);

    res.json({ message: "OTP resent to email." });
  } catch (err) {
    console.error("resendOtp error:", err);
    res.status(500).json({ message: err.message });
  }
};

//-----------------------------------
// Forgot password: send OTP to email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate OTP and store as separate Otp document
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const otpDoc = new Otp({
      user: user._id,
      otpHash,
      expiresAt: otpExpires,
      attempts: 0,
      lastSentAt: new Date(),
    });
    await otpDoc.save();

    // Send OTP email
    const subject = "Your password reset code";
    const text = `Your password reset code is: ${otp}. It will expire in 10 minutes.`;
    await sendEmail(email, subject, text);

    // Generate short token for client to verify OTP (references otp doc)
    const resetToken = generateShortToken(
      { otpId: otpDoc._id, type: "reset" },
      "15m",
    );

    res.json({ message: "Password reset OTP sent to email.", resetToken });
  } catch (err) {
    console.error("forgotPassword error:", err);
    res.status(500).json({ message: err.message });
  }
};

//------------------------------------------------------
// Logout: clear cookie and remove refresh token from DB
export const logout = async (req, res) => {
  try {
    const rawRefresh = req.cookies && req.cookies[REFRESH_TOKEN_COOKIE];
    if (rawRefresh) {
      const payload = verifyToken(rawRefresh);
      if (payload && payload.userId) {
        const user = await User.findById(payload.userId);
        if (user) {
          const refreshHash = crypto
            .createHash("sha256")
            .update(rawRefresh)
            .digest("hex");
          user.refreshToken = user.refreshToken.filter(
            (r) => r.token !== refreshHash,
          );
          await user.save();
        }
      }
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions);
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error("logout error:", err);
    res.status(500).json({ message: err.message });
  }
};
