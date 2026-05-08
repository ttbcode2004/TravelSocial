import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as ConversationsController from "../controllers/conversation.controller";

const router = Router();

// Tất cả route đều cần đăng nhập
router.use(authenticate);

// ─── Inbox ────────────────────────────────────────────────────
// Danh sách hội thoại
router.get("/", ConversationsController.listConversations);

// GET Tổng số tin chưa đọc
router.get("/unread", ConversationsController.getUnreadCount);

// ─── Create ───────────────────────────────────────────────────
// Tạo / mở hội thoại 1-1
router.post("/private", ConversationsController.createPrivate);

// Tạo nhóm chat
router.post("/group", ConversationsController.createGroup);

// ─── Conversation detail ──────────────────────────────────────
// Chi tiết hội thoại + members
router.get("/:conversationId", ConversationsController.getConversation);

// Đổi tên / ảnh nhóm (admin only)
router.patch("/:conversationId", ConversationsController.updateGroup);

// Đánh dấu đã đọc
router.post("/:conversationId/read", ConversationsController.markAsRead);

// Rời nhóm
router.post("/:conversationId/leave", ConversationsController.leaveGroup);

// ─── Members ──────────────────────────────────────────────────
// Thêm thành viên (admin)
router.post("/:conversationId/members", ConversationsController.addMembers);

// Xoá thành viên (admin)
router.delete("/:conversationId/members/:userId", ConversationsController.removeMember);

// Cấp admin
router.patch("/:conversationId/members/:userId/promote", ConversationsController.promoteToAdmin);

// ─── Messages ─────────────────────────────────────────────────
// Lịch sử tin nhắn (cursor)
router.get("/:conversationId/messages", ConversationsController.getMessages);

// Gửi tin nhắn
router.post("/:conversationId/messages", ConversationsController.sendMessage);

// Xoá tin nhắn (soft)
router.delete("/:conversationId/messages/:messageId", ConversationsController.deleteMessage);

// ─── Presence ─────────────────────────────────────────────────
// Online status
router.get("/presence", ConversationsController.getPresence);

export default router;