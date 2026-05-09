import { asyncHandler } from "../utils/errors";
import {
  NotificationFilterSchema,
  BulkUpdateSettingsSchema,
  UpdateSettingSchema,
  NotificationIdParam,
} from "../types/notification.type";
import { NotificationType } from "../generated/prisma/client";
import * as NotificationsService from "../services/notification.service";

// ─── List & Count ─────────────────────────────────────────────

export const getNotifications = asyncHandler(async (req, res) => {
  const dto = NotificationFilterSchema.parse(req.query);
  const result = await NotificationsService.getNotifications(req.user!.sub, dto);
  res.json({ success: true, ...result });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await NotificationsService.getUnreadCount(req.user!.sub);
  res.json({ success: true, data: result });
});

// ─── Mark read ────────────────────────────────────────────────

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await NotificationsService.markAsRead(
    NotificationIdParam.parse(req.params).notificationId,
    req.user!.sub
  );
  res.json({ success: true, data: notification });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const type = req.query.type as NotificationType | undefined;
  const result = await NotificationsService.markAllAsRead(req.user!.sub, type);
  res.json({ success: true, ...result });
});

// ─── Delete ───────────────────────────────────────────────────

export const deleteNotification = asyncHandler(async (req, res) => {
  const result = await NotificationsService.deleteNotification(
    NotificationIdParam.parse(req.params).notificationId,
    req.user!.sub
  );
  res.json({ success: true, ...result });
});

export const clearAll = asyncHandler(async (req, res) => {
  const result = await NotificationsService.clearAll(req.user!.sub);
  res.json({ success: true, ...result });
});

// ─── Settings ─────────────────────────────────────────────────

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await NotificationsService.getSettings(req.user!.sub);
  res.json({ success: true, data: settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const dto = BulkUpdateSettingsSchema.parse(req.body);
  const result = await NotificationsService.updateSettings(req.user!.sub, dto);
  res.json({ success: true, data: result });
});

export const updateOneSetting = asyncHandler(async (req, res) => {
  const dto = UpdateSettingSchema.parse({ ...req.body, type: req.params.type });
  const result = await NotificationsService.updateSettings(req.user!.sub, {
    settings: [dto],
  });
  res.json({ success: true, data: result[0] });
});