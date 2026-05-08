import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as FriendsController from "../controllers/friend.controller";

const router = Router();

// ─── Suggestions & Lists (self) ───────────────────────────────
router.get("/suggestions", authenticate, FriendsController.getSuggestions);

// Danh sách bạn bè của mình
router.get("/list", authenticate, FriendsController.getFriends);

router.get("/requests/received", authenticate, FriendsController.getReceivedRequests);
router.get("/requests/sent", authenticate, FriendsController.getSentRequests);
router.get("/blocked", authenticate, FriendsController.getBlockedUsers);

// ─── Per-request actions ──────────────────────────────────────
router.patch("/requests/accept/:friendshipId", authenticate, FriendsController.acceptRequest);
router.patch("/requests/decline/:friendshipId", authenticate, FriendsController.declineRequest);

// Huỷ lời mời đã gửi
router.delete("/requests/:friendshipId", authenticate, FriendsController.cancelRequest);

// ─── Per-user actions ─────────────────────────────────────────
router.post("/:userId", authenticate, FriendsController.sendRequest);

// DELETE /api/friends/:userId                🔒 Huỷ kết bạn
router.delete("/:userId", authenticate, FriendsController.unfriend);

//Chặn
router.post("/block/:userId", authenticate, FriendsController.blockUser);

//Bỏ chặn
router.delete("/block/:userId", authenticate, FriendsController.unblockUser);

// Trạng thái quan hệ với 1 user
router.get("/status/:userId", authenticate, FriendsController.getFriendshipStatus);

// Bạn chung với 1 user
router.get("/mutual/:userId", authenticate, FriendsController.getMutualFriends);

// Xem danh sách bạn bè của user khác
router.get("/list/:userId", authenticate, FriendsController.getFriends);

export default router;