import express from "express";
import {
  signup,
  login,
  verifyOtp,
  refresh,
  logout,
} from "../controllers/authController";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
