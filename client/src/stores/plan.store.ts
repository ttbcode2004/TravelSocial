import { create } from "zustand";
import { api } from "../lib/api";
import { onSocket } from "../lib/socket";
import type {
  CursorPage, Plan, PlanMember, Task, Expense,
  PlanStatus, PlanMemberRole, TaskStatus, TaskPriority, ExpenseCategory,
} from "../types";

// ─── DTOs ─────────────────────────────────────────────────────

export interface PlanMessage {
  id: string;
  content?: string | null;
  mediaUrl?: string | null;
  createdAt: string;
  sender: { id: string; username: string; avatarUrl: string | null };
}

export interface ExpenseSummary {
  totalSpent: number;
  totalBudget: number | null;
  currency: string;
  remaining: number | null;
  byCategory: { category: string; total: number; count: number }[];
  byMember: { user: { id: string; username: string; avatarUrl: string | null }; total: number }[];
}

export interface TaskStats {
  total: number;
  byStatus: Record<string, number>;
  progress: number;
}

interface CreatePlanData {
  title: string; description?: string; startDate?: string; endDate?: string;
  totalBudget?: number; currency?: string; coverImage?: string;
}

interface UpdatePlanData extends Partial<CreatePlanData> { status?: PlanStatus; }

interface CreateTaskData {
  title: string; description?: string; assigneeId?: string;
  dueDate?: string; priority?: TaskPriority;
}

interface CreateExpenseData {
  title: string; amount: number; currency?: string; category: ExpenseCategory;
  expenseDate?: string; receiptUrl?: string; notes?: string;
}

// ─── Store ────────────────────────────────────────────────────

interface PlanStore {
  // State
  plans: Plan[];
  nextPlanCursor: string | null;
  hasMorePlans: boolean;
  currentPlan: Plan | null;
  tasks: Task[];
  taskStats: TaskStats | null;
  expenses: Expense[];
  expenseSummary: ExpenseSummary | null;
  messages: PlanMessage[];
  nextMsgCursor: string | null;
  isLoading: boolean;
  isLoadingTasks: boolean;
  isLoadingExpenses: boolean;
  isLoadingMessages: boolean;

  // Plans
  fetchPlans: (cursor?: string, status?: PlanStatus) => Promise<void>;
  fetchPlan: (planId: string) => Promise<void>;
  createPlan: (data: CreatePlanData) => Promise<Plan | null>;
  updatePlan: (planId: string, data: UpdatePlanData) => Promise<boolean>;
  deletePlan: (planId: string) => Promise<boolean>;
  leavePlan: (planId: string) => Promise<boolean>;

  // Members
  inviteMembers: (planId: string, userIds: string[], role: PlanMemberRole) => Promise<boolean>;
  updateMemberRole: (planId: string, userId: string, role: PlanMemberRole) => Promise<boolean>;
  removeMember: (planId: string, userId: string) => Promise<boolean>;

  // Tasks
  fetchTasks: (planId: string, cursor?: string, filter?: { status?: TaskStatus; assigneeId?: string }) => Promise<void>;
  fetchTaskStats: (planId: string) => Promise<void>;
  createTask: (planId: string, data: CreateTaskData) => Promise<Task | null>;
  updateTask: (planId: string, taskId: string, data: Partial<CreateTaskData> & { status?: TaskStatus }) => Promise<boolean>;
  deleteTask: (planId: string, taskId: string) => Promise<boolean>;

  // Expenses
  fetchExpenses: (planId: string, cursor?: string) => Promise<void>;
  fetchExpenseSummary: (planId: string) => Promise<void>;
  createExpense: (planId: string, data: CreateExpenseData) => Promise<Expense | null>;
  updateExpense: (planId: string, expenseId: string, data: Partial<CreateExpenseData>) => Promise<boolean>;
  deleteExpense: (planId: string, expenseId: string) => Promise<boolean>;

  // Messages
  fetchMessages: (planId: string, cursor?: string) => Promise<void>;
  sendMessage: (planId: string, content: string, mediaUrl?: string) => Promise<boolean>;

  // Socket
  initSocketListeners: (planId: string) => () => void;

  // Utils
  resetPlan: () => void;
  reset: () => void;
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  // ── Initial state ─────────────────────────────────────────

  plans: [], nextPlanCursor: null, hasMorePlans: false,
  currentPlan: null,
  tasks: [], taskStats: null,
  expenses: [], expenseSummary: null,
  messages: [], nextMsgCursor: null,
  isLoading: false, isLoadingTasks: false, isLoadingExpenses: false, isLoadingMessages: false,

  // ── Plans ─────────────────────────────────────────────────

  fetchPlans: async (cursor, status) => {
    set({ isLoading: true });
    try {
      const res = await api.get("/plans", { params: { cursor, status, limit: 20 } });
      const { items, nextCursor, hasNextPage } = res.data;
      set((s) => ({
        plans: cursor ? [...s.plans, ...items] : items,
        nextPlanCursor: nextCursor,
        hasMorePlans: hasNextPage,
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPlan: async (planId) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/plans/${planId}`);
      set({ currentPlan: res.data.data });
    } finally {
      set({ isLoading: false });
    }
  },

  createPlan: async (data) => {
    try {
      const res = await api.post("/plans", data);
      const plan: Plan = res.data.data;
      set((s) => ({ plans: [plan, ...s.plans] }));
      return plan;
    } catch { return null; }
  },

  updatePlan: async (planId, data) => {
    try {
      const res = await api.patch(`/plans/${planId}`, data);
      const updated: Plan = res.data.data;
      set((s) => ({
        plans: s.plans.map((p) => (p.id === planId ? updated : p)),
        currentPlan: s.currentPlan?.id === planId ? updated : s.currentPlan,
      }));
      return true;
    } catch { return false; }
  },

  deletePlan: async (planId) => {
    try {
      await api.delete(`/plans/${planId}`);
      set((s) => ({
        plans: s.plans.filter((p) => p.id !== planId),
        currentPlan: s.currentPlan?.id === planId ? null : s.currentPlan,
      }));
      return true;
    } catch { return false; }
  },

  leavePlan: async (planId) => {
    try {
      await api.post(`/plans/${planId}/leave`);
      set((s) => ({ plans: s.plans.filter((p) => p.id !== planId) }));
      return true;
    } catch { return false; }
  },

  // ── Members ───────────────────────────────────────────────

  inviteMembers: async (planId, userIds, role) => {
    try {
      await api.post(`/plans/${planId}/members`, { userIds, role });
      await get().fetchPlan(planId); // refresh to get updated members
      return true;
    } catch { return false; }
  },

  updateMemberRole: async (planId, userId, role) => {
    try {
      const res = await api.patch(`/plans/${planId}/members/${userId}`, { role });
      const member: PlanMember = res.data.data;
      set((s) => ({
        currentPlan: s.currentPlan
          ? { ...s.currentPlan, members: s.currentPlan.members?.map((m) => (m.user.id === userId ? member : m)) }
          : null,
      }));
      return true;
    } catch { return false; }
  },

  removeMember: async (planId, userId) => {
    try {
      await api.delete(`/plans/${planId}/members/${userId}`);
      set((s) => ({
        currentPlan: s.currentPlan
          ? { ...s.currentPlan, members: s.currentPlan.members?.filter((m) => m.user.id !== userId) }
          : null,
      }));
      return true;
    } catch { return false; }
  },

  // ── Tasks ─────────────────────────────────────────────────

  fetchTasks: async (planId, cursor, filter) => {
    set({ isLoadingTasks: true });
    try {
      const res = await api.get(`/plans/${planId}/tasks`, {
        params: { cursor, limit: 50, ...filter },
      });
      const { items } = res.data;
      set((s) => ({ tasks: cursor ? [...s.tasks, ...items] : items }));
    } finally {
      set({ isLoadingTasks: false });
    }
  },

  fetchTaskStats: async (planId) => {
    try {
      const res = await api.get(`/plans/${planId}/tasks/stats`);
      set({ taskStats: res.data.data });
    } catch {
      set({ taskStats: null });
    }
  },

  createTask: async (planId, data) => {
    try {
      const res = await api.post(`/plans/${planId}/tasks`, data);
      const task: Task = res.data.data;
      set((s) => ({ tasks: [task, ...s.tasks] }));
      get().fetchTaskStats(planId);
      return task;
    } catch {
      set({ taskStats: null });
      return null;
    }
  },

  updateTask: async (planId, taskId, data) => {
    try {
      const res = await api.patch(`/plans/${planId}/tasks/${taskId}`, data);
      const task: Task = res.data.data;
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === taskId ? task : t)) }));
      get().fetchTaskStats(planId);
      return true;
    } catch { return false; }
  },

  deleteTask: async (planId, taskId) => {
    try {
      await api.delete(`/plans/${planId}/tasks/${taskId}`);
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) }));
      get().fetchTaskStats(planId);
      return true;
    } catch { return false; }
  },

  // ── Expenses ──────────────────────────────────────────────

  fetchExpenses: async (planId, cursor) => {
    set({ isLoadingExpenses: true });
    try {
      const res = await api.get(`/plans/${planId}/expenses`, {
        params: { cursor, limit: 30 },
      });
      const { items } = res.data;
      set((s) => ({ expenses: cursor ? [...s.expenses, ...items] : items }));
    } finally {
      set({ isLoadingExpenses: false });
    }
  },

  fetchExpenseSummary: async (planId) => {
    try {
      const res = await api.get(`/plans/${planId}/expenses/summary`);
      set({ expenseSummary: res.data.data });
    } catch {
      set({ expenseSummary: null });
    }
  },

  createExpense: async (planId, data) => {
    try {
      const res = await api.post(`/plans/${planId}/expenses`, data);
      const expense: Expense = res.data.data;
      set((s) => ({ expenses: [expense, ...s.expenses] }));
      get().fetchExpenseSummary(planId);
      return expense;
    } catch { return null; }
  },

  updateExpense: async (planId, expenseId, data) => {
    try {
      const res = await api.patch(`/plans/${planId}/expenses/${expenseId}`, data);
      const expense: Expense = res.data.data;
      set((s) => ({ expenses: s.expenses.map((e) => (e.id === expenseId ? expense : e)) }));
      get().fetchExpenseSummary(planId);
      return true;
    } catch { return false; }
  },

  deleteExpense: async (planId, expenseId) => {
    try {
      await api.delete(`/plans/${planId}/expenses/${expenseId}`);
      set((s) => ({ expenses: s.expenses.filter((e) => e.id !== expenseId) }));
      get().fetchExpenseSummary(planId);
      return true;
    } catch { return false; }
  },

  // ── Messages ──────────────────────────────────────────────

  fetchMessages: async (planId, cursor) => {
    set({ isLoadingMessages: true });
    try {
      const res = await api.get(`/plans/${planId}/messages`, { params: { cursor, limit: 30 } });
      const { items, nextCursor } = res.data;
      set((s) => ({
        messages: cursor ? [...items, ...s.messages] : items,
        nextMsgCursor: nextCursor,
      }));
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (planId, content, mediaUrl) => {
    try {
      const res = await api.post(`/plans/${planId}/messages`, { content, mediaUrl });
      const msg: PlanMessage = res.data.data;
      set((s) => ({ messages: [...s.messages, msg] }));
      return true;
    } catch { return false; }
  },

  // ── Socket listeners ──────────────────────────────────────

  initSocketListeners: (planId: string) => {
    const offMsg = onSocket<{ planId: string; message: PlanMessage }>(
      "plan:message_new",
      (data) => {
        if (data.planId !== planId) return;
        set((s) => {
          const exists = s.messages.some((m) => m.id === data.message.id);
          return exists ? {} : { messages: [...s.messages, data.message] };
        });
      }
    );

    const offTask = onSocket<{ planId: string; task: Task }>(
      "plan:task_updated",
      (data) => {
        if (data.planId !== planId) return;
        set((s) => ({
          tasks: s.tasks.some((t) => t.id === data.task.id)
            ? s.tasks.map((t) => (t.id === data.task.id ? data.task : t))
            : [data.task, ...s.tasks],
        }));
      }
    );

    const offExpense = onSocket<{ planId: string; expense: Expense }>(
      "plan:expense_added",
      (data) => {
        if (data.planId !== planId) return;
        set((s) => {
          const exists = s.expenses.some((e) => e.id === data.expense.id);
          return exists ? {} : { expenses: [data.expense, ...s.expenses] };
        });
      }
    );

    return () => { offMsg(); offTask(); offExpense(); };
  },

  // ── Utils ─────────────────────────────────────────────────

  resetPlan: () => set({ currentPlan: null, tasks: [], taskStats: null, expenses: [], expenseSummary: null, messages: [], nextMsgCursor: null }),

  reset: () => set({
    plans: [], nextPlanCursor: null, hasMorePlans: false,
    currentPlan: null, tasks: [], taskStats: null,
    expenses: [], expenseSummary: null, messages: [], nextMsgCursor: null,
    isLoading: false, isLoadingTasks: false, isLoadingExpenses: false, isLoadingMessages: false,
  }),
}));