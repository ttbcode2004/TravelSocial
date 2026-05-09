import { NotificationType, Prisma } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { notFound } from "../utils/errors";
import { emitToUser } from "../config/socket";
import type {
  CreateNotificationDto,
  NotificationFilterDto,
  BulkUpdateSettingsDto,
} from "../types/notification.type";

// ─── Selector ─────────────────────────────────────────────────

const actorSelect = {
  id: true,
  username: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

const notificationSelect = {
  id: true,
  type: true,
  entityId: true,
  entityType: true,
  metadata: true,
  isRead: true,
  readAt: true,
  createdAt: true,
  actor: { select: actorSelect },
} satisfies Prisma.NotificationSelect;

// ─── Create & Deliver ─────────────────────────────────────────

/**
 * Tạo notification và push realtime đến client qua socket.
 * Tự động check NotificationSetting trước khi tạo.
 */
export async function createNotification(dto: CreateNotificationDto) {
  // Không tạo notification cho chính mình
  if (dto.actorId && dto.actorId === dto.recipientId) return null;

  // Kiểm tra setting của người nhận
  const setting = await prisma.notificationSetting.findUnique({
    where: { userId_type: { userId: dto.recipientId, type: dto.type } },
  });

  // Mặc định inApp = true nếu chưa có setting
  const inApp = setting?.inApp ?? true;
  if (!inApp) return null;

  const notification = await prisma.notification.create({
    data: {
      recipientId: dto.recipientId,
      actorId: dto.actorId ?? null,
      type: dto.type,
      entityId: dto.entityId ?? null,
      entityType: dto.entityType ?? null,
      etadata: dto.metadata
      ? (dto.metadata as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    },
    select: notificationSelect,
  });

  // Push realtime qua socket
  emitToUser(dto.recipientId, "notification:new" as any, notification);

  return notification;
}

/**
 * Tạo hàng loạt cho nhiều recipients (vd: mời plan, group added)
 */
export async function createBulkNotifications(
  dtos: CreateNotificationDto[]
): Promise<void> {
  await Promise.allSettled(dtos.map((dto) => createNotification(dto)));
}

// ─── List ─────────────────────────────────────────────────────

export async function getNotifications(userId: string, dto: NotificationFilterDto) {
  const { type, isRead, cursor, limit } = dto;

  const notifications = await prisma.notification.findMany({
    where: {
      recipientId: userId,
      ...(type && { type }),
      ...(isRead !== undefined && { isRead }),
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: notificationSelect,
  });

  const hasNextPage = notifications.length > limit;
  const items = hasNextPage ? notifications.slice(0, limit) : notifications;

  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  };
}

// ─── Unread count ─────────────────────────────────────────────

export async function getUnreadCount(userId: string) {
  const [total, byType] = await Promise.all([
    prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    }),
    prisma.notification.groupBy({
      by: ["type"],
      where: { recipientId: userId, isRead: false },
      _count: { type: true },
    }),
  ]);

  const breakdown = byType.reduce(
    (acc, b) => ({ ...acc, [b.type]: b._count.type }),
    {} as Record<string, number>
  );

  return { total, breakdown };
}

// ─── Mark as read ─────────────────────────────────────────────

export async function markAsRead(notificationId: string, userId: string) {
  const notif = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notif || notif.recipientId !== userId) {
    throw notFound("Thông báo không tồn tại");
  }
  if (notif.isRead) return notif;

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
    select: notificationSelect,
  });
}

export async function markAllAsRead(userId: string, type?: NotificationType) {
  const result = await prisma.notification.updateMany({
    where: {
      recipientId: userId,
      isRead: false,
      ...(type && { type }),
    },
    data: { isRead: true, readAt: new Date() },
  });

  // Emit unread count reset
  emitToUser(userId, "notification:read_all" as any, {
    type: type ?? null,
    count: result.count,
  });

  return { updated: result.count, message: `Đã đánh dấu đọc ${result.count} thông báo` };
}

// ─── Delete ───────────────────────────────────────────────────

export async function deleteNotification(notificationId: string, userId: string) {
  const notif = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notif || notif.recipientId !== userId) {
    throw notFound("Thông báo không tồn tại");
  }

  await prisma.notification.delete({ where: { id: notificationId } });
  return { message: "Đã xoá thông báo" };
}

export async function clearAll(userId: string) {
  const result = await prisma.notification.deleteMany({
    where: { recipientId: userId },
  });
  return { deleted: result.count, message: `Đã xoá ${result.count} thông báo` };
}

// ─── Settings ─────────────────────────────────────────────────

export async function getSettings(userId: string) {
  const settings = await prisma.notificationSetting.findMany({
    where: { userId },
    select: { type: true, inApp: true, push: true, email: true },
    orderBy: { type: "asc" },
  });

  // Merge với defaults cho các type chưa có setting
  const allTypes = Object.values(NotificationType);
  const settingMap = new Map(settings.map((s) => [s.type, s]));

  return allTypes.map((type) => ({
    type,
    inApp: settingMap.get(type)?.inApp ?? true,
    push: settingMap.get(type)?.push ?? true,
    email: settingMap.get(type)?.email ?? false,
  }));
}

export async function updateSettings(userId: string, dto: BulkUpdateSettingsDto) {
  const results = await Promise.all(
    dto.settings.map((s) =>
      prisma.notificationSetting.upsert({
        where: { userId_type: { userId, type: s.type } },
        update: {
          ...(s.inApp !== undefined && { inApp: s.inApp }),
          ...(s.push !== undefined && { push: s.push }),
          ...(s.email !== undefined && { email: s.email }),
        },
        create: {
          userId,
          type: s.type,
          inApp: s.inApp ?? true,
          push: s.push ?? true,
          email: s.email ?? false,
        },
        select: { type: true, inApp: true, push: true, email: true },
      })
    )
  );

  return results;
}