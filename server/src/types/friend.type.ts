import { z } from "zod";

// Trạng thái quan hệ bạn bè từ góc nhìn của viewer
export type FriendshipStatusView =
  | "NONE"          // chưa có quan hệ
  | "PENDING_SENT"  // viewer đã gửi request, đang chờ
  | "PENDING_RECEIVED" // người kia gửi cho viewer, chờ viewer duyệt
  | "ACCEPTED"      // bạn bè
  | "BLOCKED"       // viewer đã chặn
  | "BLOCKED_BY";   // bị người kia chặn (ẩn thông tin này với viewer)

export const CursorPageSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const SearchSchema = z.object({
  q: z.string().min(1).max(100).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const UserIdParam = z.object({
  userId: z.string().pipe(z.uuid()),
});

export const FriendshipIdParam = z.object({
  friendshipId: z.string().pipe(z.uuid()),
});

export type CursorPageDto = z.infer<typeof CursorPageSchema>;
export type SearchDto     = z.infer<typeof SearchSchema>;
export type UserIdDto     = z.infer<typeof UserIdParam>;
export type FriendshipIdDto = z.infer<typeof FriendshipIdParam>;