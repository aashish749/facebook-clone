import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

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
