import express from "express";
import {
  createPost,
  toggleLike,
  getFeed,
  deletePost,
} from "../controllers/postController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Create post (client uploads to Cloudinary, then calls this to persist metadata)
router.post("/create", auth, createPost);
router.get("/feed", auth, getFeed);
router.post("/:id/like", auth, toggleLike);
router.delete("/:id", auth, deletePost);
export default router;
