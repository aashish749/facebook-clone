import express from "express";
import auth from "../middleware/auth.js";
import { getReelsFeed } from "../controllers/postController.js";

const router = express.Router();

router.get("/feed", auth, getReelsFeed);

export default router;