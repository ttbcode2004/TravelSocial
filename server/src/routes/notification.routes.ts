import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as NotificationsController from "../controllers/notification.controller";

const router = Router();

router.use(authenticate);

// ─── List & Count ─────────────────────────────────────────────
// Danh sách (cursor, filter type/isRead)
router.get("/", NotificationsController.getNotifications);

// Số chưa đọc + breakdown theo type
router.get("/unread", NotificationsController.getUnreadCount);

// ─── Mark read ────────────────────────────────────────────────
// Đánh dấu tất cả đã đọc (filter ?type=)
router.patch("/read-all", NotificationsController.markAllAsRead);

// Đánh dấu 1 thông báo đã đọc
router.patch("/:notificationId/read", NotificationsController.markAsRead);

// ─── Delete ───────────────────────────────────────────────────
// Xoá tất cả
router.delete("/", NotificationsController.clearAll);

// Xoá 1 thông báo
router.delete("/:notificationId", NotificationsController.deleteNotification);

// ─── Settings ─────────────────────────────────────────────────
// Lấy toàn bộ settings (all types)
router.get("/settings", NotificationsController.getSettings);

// Cập nhật nhiều type cùng lúc
router.patch("/settings", NotificationsController.updateSettings);

// Cập nhật 1 type
router.patch("/settings/:type", NotificationsController.updateOneSetting);

export default router;