import express from "express";
import { signUpload } from "../controllers/mediaController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Return signature for direct client upload to Cloudinary
router.post("/sign", auth, signUpload);

export default router;
