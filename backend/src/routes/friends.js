import express from "express";
import auth from "../middleware/auth.js";
import {
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from "../controllers/friendController.js";

const router = express.Router();

router.get("/requests", auth, getFriendRequests);
router.post("/request/:id", auth, sendFriendRequest);
router.post("/accept/:id", auth, acceptFriendRequest);
router.post("/reject/:id", auth, rejectFriendRequest);
router.post("/remove/:id", auth, removeFriend);

export default router;
