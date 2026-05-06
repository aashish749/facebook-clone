import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth";
import mediaRoutes from "./routes/media";
import postsRoutes from "./routes/posts";

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

// API Routes Placeholder
app.use("/api", (req, res) => {
  res.send("API route placeholder");
});

export default app;
