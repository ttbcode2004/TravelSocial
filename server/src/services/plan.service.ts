import { Prisma, PlanMemberRole, PlanStatus } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { badRequest, forbidden, notFound } from "../utils/errors";
import { emitToUser, getIO } from "../config/socket";
import type {
  CreatePlanDto,
  UpdatePlanDto,
  InviteMembersDto,
  UpdateMemberRoleDto,
  CreateTaskDto,
  UpdateTaskDto,
  CreateExpenseDto,
  UpdateExpenseDto,
  SendPlanMessageDto,
  CursorPageDto,
  PlanFilterDto,
  TaskFilterDto,
} from "../types/plan.type";

// ─── Selectors ────────────────────────────────────────────────

const userPreview = {
  id: true,
  username: true,
  avatarUrl: true,
  isVerified: true,
} satisfies Prisma.UserSelect;

const planMemberSelect = {
  id: true,
  role: true,
  joinedAt: true,
  user: { select: userPreview },
} satisfies Prisma.PlanMemberSelect;

const taskSelect = {
  id: true,
  title: true,
  description: true,
  dueDate: true,
  status: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
  assignee: { select: userPreview },
} satisfies Prisma.TaskSelect;

const expenseSelect = {
  id: true,
  title: true,
  amount: true,
  currency: true,
  category: true,
  expenseDate: true,
  receiptUrl: true,
  notes: true,
  createdAt: true,
  paidBy: { select: userPreview },
} satisfies Prisma.ExpenseSelect;

const planMessageSelect = {
  id: true,
  content: true,
  mediaUrl: true,
  createdAt: true,
  sender: { select: userPreview },
} satisfies Prisma.PlanMessageSelect;

const planSummarySelect = {
  id: true,
  title: true,
  description: true,
  startDate: true,
  endDate: true,
  totalBudget: true,
  currency: true,
  status: true,
  coverImage: true,
  createdAt: true,
  updatedAt: true,
  creator: { select: userPreview },
  _count: {
    select: { members: true, tasks: true, expenses: true },
  },
} satisfies Prisma.PlanSelect;

// ─── Guards ───────────────────────────────────────────────────

async function requirePlanMember(planId: string, userId: string) {
  const member = await prisma.planMember.findUnique({
    where: { planId_userId: { planId, userId } },
  });

  // Creator cũng có thể truy cập dù không có PlanMember record
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw notFound("Kế hoạch không tồn tại");

  if (!member && plan.creatorId !== userId) {
    throw forbidden("Bạn không phải thành viên kế hoạch này");
  }

  return { member, plan };
}

async function requireEditPermission(planId: string, userId: string) {
  const { member, plan } = await requirePlanMember(planId, userId);

  const isOwnerOrCreator =
    plan.creatorId === userId || member?.role === "OWNER" || member?.role === "EDITOR";

  if (!isOwnerOrCreator) {
    throw forbidden("Bạn chỉ có quyền xem kế hoạch này");
  }

  return { member, plan };
}

async function requireOwner(planId: string, userId: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw notFound("Kế hoạch không tồn tại");

  if (plan.creatorId !== userId) {
    const member = await prisma.planMember.findUnique({
      where: { planId_userId: { planId, userId } },
    });
    if (member?.role !== "OWNER") {
      throw forbidden("Chỉ chủ kế hoạch mới có quyền thao tác này");
    }
  }

  return plan;
}

// ─── PLANS CRUD ───────────────────────────────────────────────

export async function createPlan(userId: string, dto: CreatePlanDto) {
  const plan = await prisma.plan.create({
    data: {
      creatorId: userId,
      title: dto.title,
      description: dto.description ?? null,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      totalBudget: dto.totalBudget ?? null,
      currency: dto.currency,
      coverImage: dto.coverImage ?? null,
      status: "DRAFT",
      // Tự động thêm creator vào member với role OWNER
      members: {
        create: { userId, role: "OWNER" },
      },
    },
    select: {
      ...planSummarySelect,
      members: { select: planMemberSelect },
    },
  });

  return plan;
}

export async function getPlan(planId: string, userId: string) {
  await requirePlanMember(planId, userId);

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: {
      ...planSummarySelect,
      members: { select: planMemberSelect },
      tasks: { select: taskSelect, orderBy: { createdAt: "asc" } },
      expenses: { select: expenseSelect, orderBy: { expenseDate: "desc" } },
    },
  });

  if (!plan) throw notFound("Kế hoạch không tồn tại");

  // Tính tổng chi tiêu
  const totalSpent = await getTotalSpent(planId);

  return { ...plan, totalSpent };
}

export async function listMyPlans(userId: string, dto: PlanFilterDto) {
  const { status, cursor, limit } = dto;

  // Lấy cả plans mình tạo lẫn plans mình là member
  const membershipIds = await prisma.planMember.findMany({
    where: { userId },
    select: { planId: true },
  });
  const planIds = membershipIds.map((m) => m.planId);

  const where: Prisma.PlanWhereInput = {
    OR: [{ creatorId: userId }, { id: { in: planIds } }],
    ...(status && { status }),
  };

  const plans = await prisma.plan.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: planSummarySelect,
  });

  const hasNextPage = plans.length > limit;
  const items = hasNextPage ? plans.slice(0, limit) : plans;

  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  };
}

export async function updatePlan(
  planId: string,
  userId: string,
  dto: UpdatePlanDto
) {
  const { plan } = await requireEditPermission(planId, userId);

  if (plan.status === "COMPLETED" || plan.status === "CANCELLED") {
    throw badRequest("Không thể chỉnh sửa kế hoạch đã hoàn thành hoặc huỷ");
  }

  const updated = await prisma.plan.update({
    where: { id: planId },
    data: {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.startDate !== undefined && { startDate: dto.startDate ? new Date(dto.startDate) : null }),
      ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
      ...(dto.totalBudget !== undefined && { totalBudget: dto.totalBudget }),
      ...(dto.currency !== undefined && { currency: dto.currency }),
      ...(dto.coverImage !== undefined && { coverImage: dto.coverImage }),
      ...(dto.status !== undefined && { status: dto.status }),
    },
    select: planSummarySelect,
  });

  return updated;
}

export async function deletePlan(planId: string, userId: string) {
  await requireOwner(planId, userId);

  await prisma.plan.delete({ where: { id: planId } });
  return { message: "Đã xoá kế hoạch" };
}

// ─── MEMBERS ──────────────────────────────────────────────────

export async function inviteMembers(
  planId: string,
  inviterId: string,
  dto: InviteMembersDto
) {
  await requireOwner(planId, inviterId);

  const users = await prisma.user.findMany({
    where: { id: { in: dto.userIds } },
    select: userPreview,
  });
  if (users.length !== dto.userIds.length) {
    throw badRequest("Một số người dùng không tồn tại");
  }

  const existing = await prisma.planMember.findMany({
    where: { planId, userId: { in: dto.userIds } },
    select: { userId: true },
  });
  const existingIds = new Set(existing.map((m) => m.userId));
  const newIds = dto.userIds.filter((id) => !existingIds.has(id));

  if (newIds.length === 0) {
    throw badRequest("Tất cả người dùng đã là thành viên");
  }

  await prisma.planMember.createMany({
    data: newIds.map((userId) => ({ planId, userId, role: dto.role })),
  });

  // Thông báo qua socket đến từng người được mời
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: { title: true },
  });

  for (const userId of newIds) {
    emitToUser(userId, "error" as any, {
      type: "PLAN_INVITE",
      planId,
      planTitle: plan?.title,
      message: `Bạn được mời tham gia kế hoạch "${plan?.title}"`,
    });
  }

  return {
    invited: newIds.length,
    skipped: existingIds.size,
    message: `Đã mời ${newIds.length} thành viên`,
  };
}

export async function updateMemberRole(
  planId: string,
  ownerId: string,
  targetUserId: string,
  dto: UpdateMemberRoleDto
) {
  await requireOwner(planId, ownerId);

  if (dto.role === "OWNER") throw badRequest("Không thể đặt thêm OWNER");

  const member = await prisma.planMember.findUnique({
    where: { planId_userId: { planId, userId: targetUserId } },
  });
  if (!member) throw notFound("Thành viên không tồn tại trong kế hoạch");

  return prisma.planMember.update({
    where: { planId_userId: { planId, userId: targetUserId } },
    data: { role: dto.role },
    select: planMemberSelect,
  });
}

export async function removeMember(
  planId: string,
  ownerId: string,
  targetUserId: string
) {
  if (ownerId === targetUserId) throw badRequest("Dùng /leave để tự rời kế hoạch");
  await requireOwner(planId, ownerId);

  const member = await prisma.planMember.findUnique({
    where: { planId_userId: { planId, userId: targetUserId } },
  });
  if (!member) throw notFound("Thành viên không tồn tại");
  if (member.role === "OWNER") throw forbidden("Không thể xoá OWNER");

  await prisma.planMember.delete({
    where: { planId_userId: { planId, userId: targetUserId } },
  });

  return { message: "Đã xoá thành viên" };
}

export async function leavePlan(planId: string, userId: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw notFound("Kế hoạch không tồn tại");

  if (plan.creatorId === userId) {
    throw badRequest("Chủ kế hoạch không thể tự rời. Hãy xoá kế hoạch hoặc chuyển quyền.");
  }

  const member = await prisma.planMember.findUnique({
    where: { planId_userId: { planId, userId } },
  });
  if (!member) throw notFound("Bạn không phải thành viên kế hoạch");

  await prisma.planMember.delete({
    where: { planId_userId: { planId, userId } },
  });

  return { message: "Đã rời kế hoạch" };
}

// ─── TASKS ────────────────────────────────────────────────────

export async function createTask(
  planId: string,
  userId: string,
  dto: CreateTaskDto
) {
  await requireEditPermission(planId, userId);

  if (dto.assigneeId) {
    const assigneeMember = await prisma.planMember.findUnique({
      where: { planId_userId: { planId, userId: dto.assigneeId } },
    });
    const plan = await prisma.plan.findUnique({ where: { id: planId }, select: { creatorId: true } });
    if (!assigneeMember && plan?.creatorId !== dto.assigneeId) {
      throw badRequest("Người được giao phải là thành viên kế hoạch");
    }
  }

  const task = await prisma.task.create({
    data: {
      planId,
      title: dto.title,
      description: dto.description ?? null,
      assigneeId: dto.assigneeId ?? null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      priority: dto.priority,
    },
    select: taskSelect,
  });

  // Thông báo cho người được giao task
  if (dto.assigneeId && dto.assigneeId !== userId) {
    emitToUser(dto.assigneeId, "error" as any, {
      type: "TASK_ASSIGNED",
      planId,
      taskId: task.id,
      taskTitle: task.title,
      message: `Bạn được giao task "${task.title}"`,
    });
  }

  return task;
}

export async function getTasks(
  planId: string,
  userId: string,
  dto: TaskFilterDto
) {
  await requirePlanMember(planId, userId);

  const { status, priority, assigneeId, cursor, limit } = dto;

  const tasks = await prisma.task.findMany({
    where: {
      planId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assigneeId && { assigneeId }),
    },
    orderBy: [
      { priority: "desc" },
      { dueDate: "asc" },
      { createdAt: "asc" },
    ],
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: taskSelect,
  });

  const hasNextPage = tasks.length > limit;
  const items = hasNextPage ? tasks.slice(0, limit) : tasks;

  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  };
}

export async function updateTask(
  planId: string,
  taskId: string,
  userId: string,
  dto: UpdateTaskDto
) {
  await requireEditPermission(planId, userId);

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.planId !== planId) throw notFound("Task không tồn tại");

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
      ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.status !== undefined && { status: dto.status }),
    },
    select: taskSelect,
  });

  // Thông báo khi task hoàn thành
  if (dto.status === "DONE" && task.assigneeId && task.assigneeId !== userId) {
    emitToUser(task.assigneeId, "error" as any, {
      type: "TASK_DONE",
      planId,
      taskId,
      taskTitle: updated.title,
    });
  }

  // Broadcast task update đến plan room
  try {
    getIO().to(`plan:${planId}`).emit("plan:task_updated" as any, { planId, task: updated });
  } catch { /* io chưa init trong test */ }

  return updated;
}

export async function deleteTask(
  planId: string,
  taskId: string,
  userId: string
) {
  await requireEditPermission(planId, userId);

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.planId !== planId) throw notFound("Task không tồn tại");

  await prisma.task.delete({ where: { id: taskId } });
  return { message: "Đã xoá task" };
}

export async function getTaskStats(planId: string, userId: string) {
  await requirePlanMember(planId, userId);

  const stats = await prisma.task.groupBy({
    by: ["status"],
    where: { planId },
    _count: { status: true },
  });

  const total = await prisma.task.count({ where: { planId } });
  const byStatus = stats.reduce(
    (acc, s) => ({ ...acc, [s.status]: s._count.status }),
    {} as Record<string, number>
  );

  const doneCount = byStatus["DONE"] ?? 0;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return { total, byStatus, progress };
}

// ─── EXPENSES ─────────────────────────────────────────────────

export async function createExpense(
  planId: string,
  userId: string,
  dto: CreateExpenseDto
) {
  await requirePlanMember(planId, userId);

  const expense = await prisma.expense.create({
    data: {
      planId,
      paidById: userId,
      title: dto.title,
      amount: dto.amount,
      currency: dto.currency,
      category: dto.category,
      expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : null,
      receiptUrl: dto.receiptUrl ?? null,
      notes: dto.notes ?? null,
    },
    select: expenseSelect,
  });

  // Broadcast chi tiêu mới đến plan room
  try {
    getIO().to(`plan:${planId}`).emit("plan:expense_added" as any, { planId, expense });
  } catch { /* io chưa init trong test */ }

  return expense;
}

export async function getExpenses(
  planId: string,
  userId: string,
  dto: CursorPageDto
) {
  await requirePlanMember(planId, userId);
  const { cursor, limit } = dto;

  const expenses = await prisma.expense.findMany({
    where: { planId },
    orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: expenseSelect,
  });

  const hasNextPage = expenses.length > limit;
  const items = hasNextPage ? expenses.slice(0, limit) : expenses;

  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  };
}

export async function updateExpense(
  planId: string,
  expenseId: string,
  userId: string,
  dto: UpdateExpenseDto
) {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense || expense.planId !== planId) throw notFound("Chi tiêu không tồn tại");

  // Chỉ người tạo hoặc editor/owner mới sửa được
  if (expense.paidById !== userId) {
    await requireEditPermission(planId, userId);
  }

  return prisma.expense.update({
    where: { id: expenseId },
    data: {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.currency !== undefined && { currency: dto.currency }),
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.expenseDate !== undefined && { expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : null }),
      ...(dto.receiptUrl !== undefined && { receiptUrl: dto.receiptUrl }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    },
    select: expenseSelect,
  });
}

export async function deleteExpense(
  planId: string,
  expenseId: string,
  userId: string
) {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense || expense.planId !== planId) throw notFound("Chi tiêu không tồn tại");

  if (expense.paidById !== userId) {
    await requireEditPermission(planId, userId);
  }

  await prisma.expense.delete({ where: { id: expenseId } });
  return { message: "Đã xoá chi tiêu" };
}

export async function getExpenseSummary(planId: string, userId: string) {
  await requirePlanMember(planId, userId);

  const [byCategory, byMember, plan] = await Promise.all([
    // Tổng theo danh mục
    prisma.expense.groupBy({
      by: ["category"],
      where: { planId },
      _sum: { amount: true },
      _count: { id: true },
    }),
    // Tổng theo từng người trả
    prisma.expense.groupBy({
      by: ["paidById"],
      where: { planId },
      _sum: { amount: true },
    }),
    prisma.plan.findUnique({
      where: { id: planId },
      select: { totalBudget: true, currency: true },
    }),
  ]);

  const totalSpent = await getTotalSpent(planId);

  // Lấy tên user cho byMember
  const memberIds = byMember.map((b) => b.paidById);
  const users = await prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: userPreview,
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return {
    totalSpent,
    totalBudget: plan?.totalBudget ?? null,
    currency: plan?.currency ?? "VND",
    remaining: plan?.totalBudget
      ? Number(plan.totalBudget) - totalSpent
      : null,
    byCategory: byCategory.map((b) => ({
      category: b.category,
      total: Number(b._sum.amount ?? 0),
      count: b._count.id,
    })),
    byMember: byMember.map((b) => ({
      user: userMap.get(b.paidById),
      total: Number(b._sum.amount ?? 0),
    })),
  };
}

async function getTotalSpent(planId: string): Promise<number> {
  const agg = await prisma.expense.aggregate({
    where: { planId },
    _sum: { amount: true },
  });
  return Number(agg._sum.amount ?? 0);
}

// ─── PLAN MESSAGES ────────────────────────────────────────────

export async function sendPlanMessage(
  planId: string,
  userId: string,
  dto: SendPlanMessageDto
) {
  await requirePlanMember(planId, userId);

  const message = await prisma.planMessage.create({
    data: {
      planId,
      senderId: userId,
      content: dto.content ?? null,
      mediaUrl: dto.mediaUrl ?? null,
    },
    select: planMessageSelect,
  });

  // Broadcast realtime đến tất cả members đang online trong plan room
  try {
    getIO().to(`plan:${planId}`).emit("plan:message_new" as any, { planId, message });
  } catch { /* io chưa init trong test */ }

  return message;
}

export async function getPlanMessages(
  planId: string,
  userId: string,
  dto: CursorPageDto
) {
  await requirePlanMember(planId, userId);
  const { cursor, limit } = dto;

  const messages = await prisma.planMessage.findMany({
    where: { planId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: planMessageSelect,
  });

  const hasNextPage = messages.length > limit;
  const items = hasNextPage ? messages.slice(0, limit) : messages;

  return {
    items: items.reverse(),
    nextCursor: hasNextPage ? messages[limit].id : null,
    hasNextPage,
  };
}