import { asyncHandler, badRequest } from "../utils/errors";
import {
  CreatePlanSchema,
  UpdatePlanSchema,
  InviteMembersSchema,
  UpdateMemberRoleSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  CreateExpenseSchema,
  UpdateExpenseSchema,
  SendPlanMessageSchema,
  CursorPageSchema,
  PlanFilterSchema,
  TaskFilterSchema,
  PlanIdParam,
  UserIdParam,
  TaskIdParam,
  ExpenseIdParam,
} from "../types/plan.type";
import * as PlansService from "../services/plan.service";

// ─── Plans ────────────────────────────────────────────────────

export const createPlan = asyncHandler(async (req, res) => {
  const dto = CreatePlanSchema.parse(req.body);
  const plan = await PlansService.createPlan(req.user!.sub, dto);
  res.status(201).json({ success: true, data: plan });
});

export const listMyPlans = asyncHandler(async (req, res) => {
  const dto = PlanFilterSchema.parse(req.query);
  const result = await PlansService.listMyPlans(req.user!.sub, dto);
  res.json({ success: true, ...result });
});

export const getPlan = asyncHandler(async (req, res) => {
  const {planId} = PlanIdParam.parse(req.params);
  const plan = await PlansService.getPlan(planId, req.user!.sub);
  res.json({ success: true, data: plan });
});

export const updatePlan = asyncHandler(async (req, res) => {
  const dto = UpdatePlanSchema.parse(req.body);
  const {planId} = PlanIdParam.parse(req.params);
  const plan = await PlansService.updatePlan(planId, req.user!.sub, dto);
  res.json({ success: true, data: plan });
});

export const deletePlan = asyncHandler(async (req, res) => {
  const {planId} = PlanIdParam.parse(req.params);
  const result = await PlansService.deletePlan(planId, req.user!.sub);
  res.json({ success: true, ...result });
});

export const leavePlan = asyncHandler(async (req, res) => {
  const {planId} = PlanIdParam.parse(req.params);
  const result = await PlansService.leavePlan(planId, req.user!.sub);
  res.json({ success: true, ...result });
});

// ─── Members ──────────────────────────────────────────────────

export const inviteMembers = asyncHandler(async (req, res) => {
  const dto = InviteMembersSchema.parse(req.body);
  const {planId} = PlanIdParam.parse(req.params);
  const result = await PlansService.inviteMembers(planId, req.user!.sub, dto);
  res.status(201).json({ success: true, ...result });
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  const dto = UpdateMemberRoleSchema.parse(req.body);
  const {planId} = PlanIdParam.parse(req.params);
  const member = await PlansService.updateMemberRole(
    planId,
    req.user!.sub,
    UserIdParam.parse(req.params).userId,
    dto
  );
  res.json({ success: true, data: member });
});

export const removeMember = asyncHandler(async (req, res) => {
  const {planId} = PlanIdParam.parse(req.params);
  const result = await PlansService.removeMember(
    planId,
    req.user!.sub,
    UserIdParam.parse(req.params).userId
  );
  res.json({ success: true, ...result });
});

// ─── Tasks ────────────────────────────────────────────────────

export const createTask = asyncHandler(async (req, res) => {
  const dto = CreateTaskSchema.parse(req.body);
  const {planId} = PlanIdParam.parse(req.params);
  const task = await PlansService.createTask(planId, req.user!.sub, dto);
  res.status(201).json({ success: true, data: task });
});

export const getTasks = asyncHandler(async (req, res) => {
  const dto = TaskFilterSchema.parse(req.query);
  const {planId} = PlanIdParam.parse(req.params);
  const result = await PlansService.getTasks(planId, req.user!.sub, dto);
  res.json({ success: true, ...result });
});

export const getTaskStats = asyncHandler(async (req, res) => {
  const {planId} = PlanIdParam.parse(req.params);
  const result = await PlansService.getTaskStats(planId, req.user!.sub);
  res.json({ success: true, data: result });
});

export const updateTask = asyncHandler(async (req, res) => {
  const dto = UpdateTaskSchema.parse(req.body);
  const {planId} = PlanIdParam.parse(req.params);
  const task = await PlansService.updateTask(
    planId,
    TaskIdParam.parse(req.params).taskId,
    req.user!.sub,
    dto
  );
  res.json({ success: true, data: task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const {planId} = PlanIdParam.parse(req.params);
  const result = await PlansService.deleteTask(
    planId,
    TaskIdParam.parse(req.params).taskId,
    req.user!.sub
  );
  res.json({ success: true, ...result });
});

// ─── Expenses ─────────────────────────────────────────────────

export const createExpense = asyncHandler(async (req, res) => {
  const dto = CreateExpenseSchema.parse(req.body);
  const {planId} = PlanIdParam.parse(req.params);
  const expense = await PlansService.createExpense(planId, req.user!.sub, dto);
  res.status(201).json({ success: true, data: expense });
});

export const getExpenses = asyncHandler(async (req, res) => {
  const dto = CursorPageSchema.parse(req.query);
  const {planId} = PlanIdParam.parse(req.params);
  const result = await PlansService.getExpenses(planId, req.user!.sub, dto);
  res.json({ success: true, ...result });
});

export const getExpenseSummary = asyncHandler(async (req, res) => {
  const {planId} = PlanIdParam.parse(req.params);
  const result = await PlansService.getExpenseSummary(planId, req.user!.sub);
  res.json({ success: true, data: result });
});

export const updateExpense = asyncHandler(async (req, res) => {
  const dto = UpdateExpenseSchema.parse(req.body);
  const {planId} = PlanIdParam.parse(req.params);
  const expense = await PlansService.updateExpense(
    planId,
    ExpenseIdParam.parse(req.params).expenseId,
    req.user!.sub,
    dto
  );
  res.json({ success: true, data: expense });
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const {planId} = PlanIdParam.parse(req.params);
  const result = await PlansService.deleteExpense(
    planId,
    ExpenseIdParam.parse(req.params).expenseId,
    req.user!.sub
  );
  res.json({ success: true, ...result });
});

// ─── Plan Messages ────────────────────────────────────────────

export const sendPlanMessage = asyncHandler(async (req, res) => {
  const dto = SendPlanMessageSchema.parse(req.body);
  const {planId} = PlanIdParam.parse(req.params);
  const message = await PlansService.sendPlanMessage(
    planId,
    req.user!.sub,
    dto
  );
  res.status(201).json({ success: true, data: message });
});

export const getPlanMessages = asyncHandler(async (req, res) => {
  const dto = CursorPageSchema.parse(req.query);
  const {planId} = PlanIdParam.parse(req.params);
  const result = await PlansService.getPlanMessages(
    planId,
    req.user!.sub,
    dto
  );
  res.json({ success: true, ...result });
});