import type { CursorPage, Expense, ExpenseCategory, Plan, PlanMemberRole, PlanStatus, Task, TaskStatus } from "../../types";

interface CreatePlanData {
  title: string;

  description?: string;

  startDate?: string;

  endDate?: string;

  totalBudget?: number;

  currency?: string;

  coverImage?: string;
}

interface UpdatePlanData {
  title?: string;

  description?: string;

  startDate?: string;

  endDate?: string;

  totalBudget?: number;

  currency?: string;

  coverImage?: string;

  status?: PlanStatus;
}

interface CreateTaskData {
  title: string;

  description?: string;

  assigneeId?: string;

  dueDate?: string;

  priority?: TaskPriority;
}

interface UpdateTaskData {
  title?: string;

  description?: string;

  assigneeId?: string;

  dueDate?: string;

  priority?: TaskPriority;

  status?: TaskStatus;
}

interface CreateExpenseData {
  title: string;

  amount: number;

  currency?: string;

  category: ExpenseCategory;

  expenseDate?: string;

  receiptUrl?: string;

  notes?: string;
}

interface SendMessageData {
  content?: string;

  mediaUrl?: string;
}

// ─────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────

export interface PlanStore {
  // ─── State ────────────────────────────────────

  plans: CursorPage<Plan> | null;

  currentPlan: Plan | null;

  tasks: CursorPage<Task> | null;

  expenses: CursorPage<Expense> | null;

  isLoading: boolean;

  // ─── Plans ────────────────────────────────────

  getPlans: (
    cursor?: string,
    status?: PlanStatus
  ) => Promise<void>;

  getPlan: (
    planId: string
  ) => Promise<void>;

  createPlan: (
    data: CreatePlanData
  ) => Promise<boolean>;

  updatePlan: (
    planId: string,
    data: UpdatePlanData
  ) => Promise<boolean>;

  deletePlan: (
    planId: string
  ) => Promise<boolean>;

  leavePlan: (
    planId: string
  ) => Promise<boolean>;

  // ─── Members ──────────────────────────────────

  inviteMembers: (
    planId: string,
    userIds: string[],
    role: PlanMemberRole
  ) => Promise<boolean>;

  updateMemberRole: (
    planId: string,
    userId: string,
    role: PlanMemberRole
  ) => Promise<boolean>;

  removeMember: (
    planId: string,
    userId: string
  ) => Promise<boolean>;

  // ─── Tasks ────────────────────────────────────

  getTasks: (
    planId: string,
    cursor?: string
  ) => Promise<void>;

  createTask: (
    planId: string,
    data: CreateTaskData
  ) => Promise<boolean>;

  updateTask: (
    planId: string,
    taskId: string,
    data: UpdateTaskData
  ) => Promise<boolean>;

  deleteTask: (
    planId: string,
    taskId: string
  ) => Promise<boolean>;

  // ─── Expenses ─────────────────────────────────

  getExpenses: (
    planId: string,
    cursor?: string
  ) => Promise<void>;

  createExpense: (
    planId: string,
    data: CreateExpenseData
  ) => Promise<boolean>;

  updateExpense: (
    planId: string,
    expenseId: string,
    data: Partial<CreateExpenseData>
  ) => Promise<boolean>;

  deleteExpense: (
    planId: string,
    expenseId: string
  ) => Promise<boolean>;

  // ─── Messages ─────────────────────────────────

  getMessages: (
    planId: string,
    cursor?: string
  ) => Promise<void>;

  sendMessage: (
    planId: string,
    data: SendMessageData
  ) => Promise<boolean>;

  // ─── Utils ────────────────────────────────────

  reset: () => void;
}
