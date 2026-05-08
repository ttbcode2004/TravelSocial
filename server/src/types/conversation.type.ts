import { z } from "zod";
import { ConversationType, MessageType } from "../generated/prisma/client";

// ─── Conversation ─────────────────────────────────────────────

export const CreatePrivateConversationSchema = z.object({
  targetUserId: z.string().pipe(z.uuid("userId không hợp lệ")),
});

export const CreateGroupConversationSchema = z.object({
  name: z.string().min(1).max(100),
  memberIds: z
    .array(z.string().pipe(z.uuid()))
    .min(2, "Nhóm cần ít nhất 2 thành viên khác")
    .max(99),
  avatarUrl: z.string().pipe(z.url()).optional(),
});

export const UpdateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().pipe(z.url()).optional(),
});

// ─── Message ──────────────────────────────────────────────────

export const SendMessageSchema = z.object({
  content: z.string().max(5000).optional(),
  mediaUrl: z.string().pipe(z.url()).optional(),
  type: z.enum(MessageType).default("TEXT"),
}).refine(
  (d) => d.content || d.mediaUrl,
  { message: "Tin nhắn phải có nội dung hoặc media" }
);

// ─── Pagination ───────────────────────────────────────────────

export const CursorPageSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(30),
});

export const ConversationIdParam = z.object({
  conversationId: z.string().pipe(z.uuid()),
});

export const UserIdParam = z.object({
  userId: z.string().pipe(z.uuid()),
});
export const MessageIdParam = z.object({
  messageId: z.string().pipe(z.uuid()),
});

// ─── Types ────────────────────────────────────────────────────

export type CreatePrivateConversationDto = z.infer<typeof CreatePrivateConversationSchema>;
export type CreateGroupConversationDto   = z.infer<typeof CreateGroupConversationSchema>;
export type UpdateGroupDto               = z.infer<typeof UpdateGroupSchema>;
export type SendMessageDto               = z.infer<typeof SendMessageSchema>;
export type CursorPageDto                = z.infer<typeof CursorPageSchema>;
export type ConversationIdParamDto       = z.infer<typeof ConversationIdParam>;
export type UserIdParamDto               = z.infer<typeof UserIdParam>;
export type MessageIdParamDto            = z.infer<typeof MessageIdParam>;