import { z } from "zod";
import {
  PlanStatus,
  PlanMemberRole,
  TaskStatus,
  TaskPriority,
  ExpenseCategory,
} from "../generated/prisma/client";

// ─── Base Plan Schema ────────────────────────────────────────

const BasePlanSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startDate: z.iso.date("Định dạng ngày: YYYY-MM-DD").optional(),
  endDate: z.iso.date().optional(),
  totalBudget: z.coerce.number().positive().optional(),
  currency: z.string().length(3).default("VND"),
  coverImage: z.string().pipe(z.url()).optional(),
});

// ─── Plan ────────────────────────────────────────────────────

export const CreatePlanSchema = BasePlanSchema.refine(
  (d) => !d.startDate || !d.endDate || d.startDate <= d.endDate,
  {
    message: "Ngày kết thúc phải sau ngày bắt đầu",
    path: ["endDate"],
  }
);

export const UpdatePlanSchema = BasePlanSchema.partial().extend({
  status: z.enum(PlanStatus).optional(),
});

// ─── Members ─────────────────────────────────────────────────

export const InviteMembersSchema = z.object({
  userIds: z.array(z.string().pipe(z.uuid())).min(1).max(50),
  role: z.enum(PlanMemberRole).default("VIEWER"),
});

export const UpdateMemberRoleSchema = z.object({
  role: z.enum(PlanMemberRole),
});

// ─── Tasks ───────────────────────────────────────────────────

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().pipe(z.uuid()).optional(),
  dueDate: z.iso.date().optional(),
  priority: z.enum(TaskPriority).default("MEDIUM"),
});

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  status: z.enum(TaskStatus).optional(),
});

// ─── Expenses ────────────────────────────────────────────────

export const CreateExpenseSchema = z.object({
  title: z.string().min(1).max(300),
  amount: z.coerce.number().positive("Số tiền phải > 0"),
  currency: z.string().length(3).default("VND"),
  category: z.enum(ExpenseCategory).default("OTHER"),
  expenseDate: z.iso.date().optional(),
  receiptUrl: z.string().pipe(z.url()).optional(),
  notes: z.string().max(500).optional(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial();

// ─── Plan Messages ───────────────────────────────────────────

export const SendPlanMessageSchema = z.object({
  content: z.string().max(3000).optional(),
  mediaUrl: z.string().pipe(z.url()).optional(),
}).refine((d) => d.content || d.mediaUrl, {
  message: "Tin nhắn phải có nội dung hoặc media",
});

// ─── Pagination ──────────────────────────────────────────────

export const CursorPageSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const PlanFilterSchema = z.object({
  status: z.enum(PlanStatus).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const TaskFilterSchema = z.object({
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(TaskPriority).optional(),
  assigneeId: z.string().pipe(z.uuid()).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const PlanIdParam = z.object({
  planId: z.string().pipe(z.uuid()),
});

export const UserIdParam = z.object({
  userId: z.string().pipe(z.uuid()),
});

export const TaskIdParam = z.object({
  taskId: z.string().pipe(z.uuid()),
});

export const ExpenseIdParam = z.object({
  expenseId: z.string().pipe(z.uuid()),
});

// ─── Inferred types ──────────────────────────────────────────

export type CreatePlanDto       = z.infer<typeof CreatePlanSchema>;
export type UpdatePlanDto       = z.infer<typeof UpdatePlanSchema>;
export type InviteMembersDto    = z.infer<typeof InviteMembersSchema>;
export type UpdateMemberRoleDto = z.infer<typeof UpdateMemberRoleSchema>;
export type CreateTaskDto       = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskDto       = z.infer<typeof UpdateTaskSchema>;
export type CreateExpenseDto    = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseDto    = z.infer<typeof UpdateExpenseSchema>;
export type SendPlanMessageDto  = z.infer<typeof SendPlanMessageSchema>;
export type CursorPageDto       = z.infer<typeof CursorPageSchema>;
export type PlanFilterDto       = z.infer<typeof PlanFilterSchema>;
export type TaskFilterDto       = z.infer<typeof TaskFilterSchema>;
export type PlanIdParamDto      = z.infer<typeof PlanIdParam>;
export type UserIdParamDto      = z.infer<typeof UserIdParam>;
export type TaskIdParamDto      = z.infer<typeof TaskIdParam>;
export type ExpenseIdParamDto   = z.infer<typeof ExpenseIdParam>;