import { z } from "zod";
import { NotificationType, NotificationEntityType } from "../generated/prisma/client";

// ─── Query ────────────────────────────────────────────────────

export const NotificationFilterSchema = z.object({
  type: z.enum(NotificationType).optional(),
  isRead: z.coerce.boolean().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// ─── Settings ─────────────────────────────────────────────────

export const UpdateSettingSchema = z.object({
  type: z.enum(NotificationType),
  inApp: z.boolean().optional(),
  push: z.boolean().optional(),
  email: z.boolean().optional(),
});

export const BulkUpdateSettingsSchema = z.object({
  settings: z.array(UpdateSettingSchema).min(1),
});

export const NotificationIdParam = z.object({
  notificationId: z.string().pipe(z.uuid()),
});

// ─── Create (internal use only) ───────────────────────────────

export interface CreateNotificationDto {
  recipientId: string;
  actorId?: string;
  type: NotificationType;
  entityId?: string;
  entityType?: NotificationEntityType;
  metadata?: Record<string, unknown>;
}

// ─── Types ────────────────────────────────────────────────────

export type NotificationFilterDto   = z.infer<typeof NotificationFilterSchema>;
export type UpdateSettingDto        = z.infer<typeof UpdateSettingSchema>;
export type BulkUpdateSettingsDto   = z.infer<typeof BulkUpdateSettingsSchema>;
export type NotificationIdParamDto  = z.infer<typeof NotificationIdParam>;