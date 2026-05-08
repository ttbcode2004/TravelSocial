import { ConversationMemberRole, Prisma } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { badRequest, forbidden, notFound } from "../utils/errors";
import { emitToConversation, emitToUser } from "../config/socket";
import type {
  CreatePrivateConversationDto,
  CreateGroupConversationDto,
  UpdateGroupDto,
  SendMessageDto,
  CursorPageDto,
} from "../types/conversation.type";

// ─── Selectors ────────────────────────────────────────────────

const userPreview = {
  id: true,
  username: true,
  avatarUrl: true,
  isVerified: true,
} satisfies Prisma.UserSelect;

const memberSelect = {
  id: true,
  role: true,
  joinedAt: true,
  lastReadAt: true,
  user: { select: userPreview },
} satisfies Prisma.ConversationMemberSelect;

export const messageSelect = {
  id: true,
  content: true,
  mediaUrl: true,
  type: true,
  isDeleted: true,
  createdAt: true,
  sender: { select: userPreview },
} satisfies Prisma.MessageSelect;

function buildConversationSelect(_userId: string) {
  return {
    id: true,
    type: true,
    name: true,
    avatarUrl: true,
    createdAt: true,
    members: { select: memberSelect },
    messages: {
      orderBy: { createdAt: "desc" as const },
      take: 1,
      select: messageSelect,
    },
  } satisfies Prisma.ConversationSelect;
}

function formatConversation(conv: any, userId: string) {
  const { messages, members, ...rest } = conv;
  const lastMessage = messages?.[0] ?? null;
  const myMember = members.find((m: any) => m.user.id === userId);
  return { ...rest, members, lastMessage, lastReadAt: myMember?.lastReadAt ?? null };
}

// ─── Guards ───────────────────────────────────────────────────

async function requireMember(conversationId: string, userId: string) {
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!member) throw forbidden("Bạn không phải thành viên cuộc trò chuyện này");
  return member;
}

async function requireAdmin(conversationId: string, userId: string) {
  const member = await requireMember(conversationId, userId);
  if (member.role !== "ADMIN") throw forbidden("Chỉ admin mới có quyền thực hiện thao tác này");
  return member;
}

// ─── Create ───────────────────────────────────────────────────

export async function createPrivateConversation(
  userId: string,
  dto: CreatePrivateConversationDto
) {
  if (userId === dto.targetUserId) {
    throw badRequest("Không thể tạo cuộc trò chuyện với chính mình");
  }

  const target = await prisma.user.findUnique({ where: { id: dto.targetUserId } });
  if (!target) throw notFound("Người dùng không tồn tại");

  const existing = await prisma.conversation.findFirst({
    where: {
      type: "PRIVATE",
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: dto.targetUserId } } },
      ],
    },
    select: buildConversationSelect(userId),
  });

  if (existing) {
    return { conversation: formatConversation(existing, userId), isNew: false };
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: "PRIVATE",
      members: {
        create: [
          { userId, role: "MEMBER" },
          { userId: dto.targetUserId, role: "MEMBER" },
        ],
      },
    },
    select: buildConversationSelect(userId),
  });

  return { conversation: formatConversation(conversation, userId), isNew: true };
}

export async function createGroupConversation(
  userId: string,
  dto: CreateGroupConversationDto
) {
  const memberIds = [...new Set([...dto.memberIds, userId])];

  const users = await prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: { id: true },
  });
  if (users.length !== memberIds.length) {
    throw badRequest("Một số người dùng không tồn tại");
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: "GROUP",
      name: dto.name,
      avatarUrl: dto.avatarUrl ?? null,
      members: {
        create: memberIds.map((id) => ({
          userId: id,
          role: id === userId ? "ADMIN" : "MEMBER",
        })),
      },
    },
    select: buildConversationSelect(userId),
  });

  return formatConversation(conversation, userId);
}

// ─── Read ─────────────────────────────────────────────────────

export async function getConversation(conversationId: string, userId: string) {
  await requireMember(conversationId, userId);

  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: buildConversationSelect(userId),
  });
  if (!conv) throw notFound("Cuộc trò chuyện không tồn tại");

  return formatConversation(conv, userId);
}

export async function listConversations(userId: string, dto: CursorPageDto) {
  const { cursor, limit } = dto;

  const memberships = await prisma.conversationMember.findMany({
    where: { userId },
    select: { conversationId: true },
  });
  const conversationIds = memberships.map((m) => m.conversationId);

  const conversations = await prisma.conversation.findMany({
    where: { id: { in: conversationIds } },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: buildConversationSelect(userId),
  });

  // Sort by lastMessage time
  conversations.sort((a, b) => {
    const aTime = (a.messages[0]?.createdAt ?? a.createdAt).getTime();
    const bTime = (b.messages[0]?.createdAt ?? b.createdAt).getTime();
    return bTime - aTime;
  });

  const hasNextPage = conversations.length > limit;
  const items = hasNextPage ? conversations.slice(0, limit) : conversations;

  return {
    items: items.map((c) => formatConversation(c, userId)),
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  };
}

// ─── Update group ─────────────────────────────────────────────

export async function updateGroup(
  conversationId: string,
  userId: string,
  dto: UpdateGroupDto
) {
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) throw notFound("Cuộc trò chuyện không tồn tại");
  if (conv.type !== "GROUP") throw badRequest("Chỉ áp dụng cho nhóm");

  await requireAdmin(conversationId, userId);

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      ...(dto.name && { name: dto.name }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
    },
    select: buildConversationSelect(userId),
  });

  // Emit socket: thông báo nhóm vừa đổi tên/ảnh
  emitToConversation(conversationId, "group:updated", {
    conversationId,
    name: dto.name,
    avatarUrl: dto.avatarUrl,
  });

  return formatConversation(updated, userId);
}

// ─── Members ──────────────────────────────────────────────────

export async function addMembers(
  conversationId: string,
  adminId: string,
  userIds: string[]
) {
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) throw notFound("Cuộc trò chuyện không tồn tại");
  if (conv.type !== "GROUP") throw badRequest("Chỉ thêm thành viên vào nhóm");

  await requireAdmin(conversationId, adminId);

  const existing = await prisma.conversationMember.findMany({
    where: { conversationId, userId: { in: userIds } },
    select: { userId: true },
  });
  const existingIds = new Set(existing.map((m) => m.userId));
  const newIds = userIds.filter((id) => !existingIds.has(id));

  if (newIds.length === 0) throw badRequest("Tất cả người dùng đã ở trong nhóm");

  await prisma.conversationMember.createMany({
    data: newIds.map((userId) => ({ conversationId, userId, role: "MEMBER" })),
  });

  // Lấy thông tin user mới để emit
  const newUsers = await prisma.user.findMany({
    where: { id: { in: newIds } },
    select: userPreview,
  });

  // Emit đến conversation: có thành viên mới
  emitToConversation(conversationId, "group:member_added", {
    conversationId,
    users: newUsers,
  });

  // Emit đến từng user mới: yêu cầu join room
  for (const uid of newIds) {
    emitToUser(uid, "group:member_added" as any, { conversationId, users: newUsers });
  }

  return { added: newIds.length, message: `Đã thêm ${newIds.length} thành viên` };
}

export async function removeMember(
  conversationId: string,
  adminId: string,
  targetUserId: string
) {
  if (adminId === targetUserId) throw badRequest("Dùng /leave để tự rời nhóm");

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv || conv.type !== "GROUP") throw notFound("Nhóm không tồn tại");

  await requireAdmin(conversationId, adminId);

  const target = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: targetUserId } },
  });
  if (!target) throw notFound("Thành viên không tồn tại trong nhóm");
  if (target.role === "ADMIN") throw forbidden("Không thể xoá admin khác");

  await prisma.conversationMember.delete({
    where: { conversationId_userId: { conversationId, userId: targetUserId } },
  });

  emitToConversation(conversationId, "group:member_removed", {
    conversationId,
    userId: targetUserId,
  });

  return { message: "Đã xoá thành viên" };
}

export async function leaveGroup(conversationId: string, userId: string) {
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv || conv.type !== "GROUP") throw notFound("Nhóm không tồn tại");

  const member = await requireMember(conversationId, userId);

  if (member.role === "ADMIN") {
    const otherAdmin = await prisma.conversationMember.findFirst({
      where: { conversationId, userId: { not: userId }, role: "ADMIN" },
    });

    if (!otherAdmin) {
      const oldestMember = await prisma.conversationMember.findFirst({
        where: { conversationId, userId: { not: userId } },
        orderBy: { joinedAt: "asc" },
      });

      if (!oldestMember) {
        await prisma.conversation.delete({ where: { id: conversationId } });
        return { message: "Bạn đã rời nhóm và nhóm đã bị xoá vì không còn thành viên" };
      }

      await prisma.conversationMember.update({
        where: { id: oldestMember.id },
        data: { role: "ADMIN" },
      });

      emitToConversation(conversationId, "group:promoted", {
        conversationId,
        userId: oldestMember.userId,
      });
    }
  }

  await prisma.conversationMember.delete({
    where: { conversationId_userId: { conversationId, userId } },
  });

  emitToConversation(conversationId, "group:member_left", { conversationId, userId });

  return { message: "Đã rời nhóm" };
}

export async function promoteToAdmin(
  conversationId: string,
  adminId: string,
  targetUserId: string
) {
  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv || conv.type !== "GROUP") throw notFound("Nhóm không tồn tại");

  await requireAdmin(conversationId, adminId);

  const target = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: targetUserId } },
  });
  if (!target) throw notFound("Thành viên không tồn tại trong nhóm");

  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId: targetUserId } },
    data: { role: "ADMIN" },
  });

  emitToConversation(conversationId, "group:promoted", {
    conversationId,
    userId: targetUserId,
  });

  return { message: "Đã cấp quyền admin" };
}

// ─── Messages ─────────────────────────────────────────────────

export async function sendMessage(
  conversationId: string,
  senderId: string,
  dto: SendMessageDto
) {
  await requireMember(conversationId, senderId);

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content: dto.content ?? null,
      mediaUrl: dto.mediaUrl ?? null,
      type: dto.type,
    },
    select: messageSelect,
  });

  // Cập nhật lastReadAt của sender
  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId: senderId } },
    data: { lastReadAt: message.createdAt },
  });

  return message;
}

export async function getMessages(
  conversationId: string,
  userId: string,
  dto: CursorPageDto
) {
  await requireMember(conversationId, userId);
  const { cursor, limit } = dto;

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: messageSelect,
  });

  const hasNextPage = messages.length > limit;
  const items = hasNextPage ? messages.slice(0, limit) : messages;

  return {
    items: items.reverse(),
    nextCursor: hasNextPage ? messages[limit].id : null,
    hasNextPage,
  };
}

export async function deleteMessage(
  conversationId: string,
  messageId: string,
  userId: string
) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.conversationId !== conversationId) {
    throw notFound("Tin nhắn không tồn tại");
  }
  if (message.senderId !== userId) throw forbidden("Bạn không có quyền xoá tin nhắn này");

  return prisma.message.update({
    where: { id: messageId },
    data: { isDeleted: true, content: null, mediaUrl: null },
    select: messageSelect,
  });
}

// ─── Mark as read ─────────────────────────────────────────────

export async function markAsRead(conversationId: string, userId: string) {
  await requireMember(conversationId, userId);

  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });

  return { message: "Đã đánh dấu đã đọc" };
}

// ─── Unread count ─────────────────────────────────────────────

export async function getUnreadCount(userId: string) {
  const members = await prisma.conversationMember.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });

  const counts = await Promise.all(
    members.map(async (m) => ({
      conversationId: m.conversationId,
      unread: await prisma.message.count({
        where: {
          conversationId: m.conversationId,
          senderId: { not: userId },
          ...(m.lastReadAt && { createdAt: { gt: m.lastReadAt } }),
        },
      }),
    }))
  );

  const total = counts.reduce((sum, c) => sum + c.unread, 0);
  return { total, byConversation: counts };
}