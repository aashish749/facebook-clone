import express from "express";
import auth from "../middleware/auth.js";
import { getUserFeed } from "../controllers/userController.js";

const router = express.Router();

router.get("/:id/feed", auth, getUserFeed);

export default router;
