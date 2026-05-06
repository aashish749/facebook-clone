import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// Generate a short-lived token (e.g., verification tokens)
export const generateShortToken = (payload, expiresIn = "15m") => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};
