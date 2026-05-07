import { z } from "zod";
import { Visibility, ReactionType } from "../generated/prisma/client";

// ─── Post ─────────────────────────────────────────────────────

export const CreatePostSchema = z.object({
  content: z.string().min(1, "Nội dung không được trống").max(5000),
  mediaUrls: z.array(z.string().pipe(z.url())).max(10).default([]),
  visibility: z.enum(Visibility).default("PUBLIC"),
});

export const UpdatePostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  keepMediaUrls: z.array(z.string().pipe(z.url())).max(10).optional(),
  visibility: z.enum(Visibility).optional(),
});

// ─── Comment ──────────────────────────────────────────────────

export const CreateCommentSchema = z.object({
  content: z.string().min(1, "Bình luận không được trống").max(2000),
  parentId: z.string().pipe(z.uuid()).optional(), // reply to a comment
});

export const UpdateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

// ─── Reaction ─────────────────────────────────────────────────

export const UpsertReactionSchema = z.object({
  type: z.enum(ReactionType),
});

// ─── Pagination ───────────────────────────────────────────────

export const CursorPageSchema = z.object({
  cursor: z.string().optional(),  // last post id (cursor-based)
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const OffsetPageSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const PostIdParam = z.object({
  postId: z.string().pipe(z.uuid()),
});

export const CommentIdParam = z.object({
  commentId: z.string().pipe(z.uuid()),
});

export const UserIdParam = z.object({
  userId: z.string().pipe(z.uuid()),
});

// ─── Inferred types ───────────────────────────────────────────

export type CreatePostDto   = z.infer<typeof CreatePostSchema>;
export type UpdatePostDto   = z.infer<typeof UpdatePostSchema>;
export type CreateCommentDto = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentDto = z.infer<typeof UpdateCommentSchema>;
export type UpsertReactionDto = z.infer<typeof UpsertReactionSchema>;
export type CursorPageDto   = z.infer<typeof CursorPageSchema>;
export type OffsetPageDto   = z.infer<typeof OffsetPageSchema>;
export type PostIdDto      = z.infer<typeof PostIdParam>;
export type CommentIdDto   = z.infer<typeof CommentIdParam>;
export type UserIdDto      = z.infer<typeof UserIdParam>;