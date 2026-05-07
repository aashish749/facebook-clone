import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import mediaRoutes from "./routes/media.js";
import postsRoutes from "./routes/posts.js";
import usersRoutes from "./routes/users.js";
import friendsRoutes from "./routes/friends.js";
import reelsRoutes from "./routes/reels.js";

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(express.json());

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Auth routes
app.use("/api/auth", authRoutes);

// Media and posts
app.use("/api/media", mediaRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/reels", reelsRoutes);

// API Routes Placeholder
app.use("/api", (req, res) => {
  res.send("API route placeholder");
});

export default app;
