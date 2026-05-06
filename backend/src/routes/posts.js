import express from "express";
import { createPost } from "../controllers/postController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Create post (client uploads to Cloudinary, then calls this to persist metadata)
router.post("/create", auth, createPost);

export default router;
