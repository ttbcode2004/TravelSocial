import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import Avatar, { Spinner, EmptyState } from "../../components/ui/Avatar";
import { cn, formatDate, formatCurrency, PRIORITY_COLOR, STATUS_COLOR, timeAgo } from "../../utils";
import {
  CheckSquare, DollarSign, Users, MessageSquare,
  Plus, Check, Clock, Trash2, ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Plan, Task, Expense, TaskStatus } from "../../types";

type Tab = "tasks" | "expenses" | "members" | "chat";

// ─── Task Item ────────────────────────────────────────────────

function TaskItem({ task, planId }: { task: Task; planId: string }) {
  const qc = useQueryClient();

  const cycleStatus = useMutation({
    mutationFn: () => {
      const next: Record<TaskStatus, TaskStatus> = {
        TODO: "IN_PROGRESS", IN_PROGRESS: "DONE", DONE: "TODO", CANCELLED: "TODO",
      };
      return api.patch(`/plans/${planId}/tasks/${task.id}`, { status: next[task.status] });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan-tasks", planId] }),
  });

  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-bg-muted transition-colors",
      task.status === "DONE" && "opacity-60")}>
      <button
        className={cn("mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors",
          task.status === "DONE" ? "bg-success border-success text-white" : "border-border hover:border-primary"
        )}
        onClick={() => cycleStatus.mutate()}
      >
        {task.status === "DONE" && <Check size={12} />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", task.status === "DONE" && "line-through text-fg-muted")}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={cn("badge text-xs", STATUS_COLOR[task.status])}>{task.status}</span>
          <span className={cn("text-xs font-medium", PRIORITY_COLOR[task.priority])}>{task.priority}</span>
          {task.dueDate && (
            <span className="flex items-center gap-1 text-xs text-fg-muted">
              <Clock size={11} />{formatDate(task.dueDate)}
            </span>
          )}
          {task.assignee && (
            <div className="flex items-center gap-1">
              <Avatar src={task.assignee.avatarUrl} name={task.assignee.username} size="xs" />
              <span className="text-xs text-fg-muted">{task.assignee.username}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Expense Item ─────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  TRANSPORT: "🚗", ACCOMMODATION: "🏨", FOOD: "🍜", ACTIVITY: "🎡", SHOPPING: "🛍️", OTHER: "📦",
};

function ExpenseItem({ expense }: { expense: Expense }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
      <div className="w-9 h-9 rounded-lg bg-bg-muted flex items-center justify-center text-lg flex-shrink-0">
        {CATEGORY_EMOJI[expense.category] ?? "📦"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-1">{expense.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Avatar src={expense.paidBy.avatarUrl} name={expense.paidBy.username} size="xs" />
          <span className="text-xs text-fg-muted">{expense.paidBy.username}</span>
          {expense.expenseDate && <span className="text-xs text-fg-subtle">{formatDate(expense.expenseDate)}</span>}
        </div>
      </div>
      <p className="font-semibold text-sm text-right flex-shrink-0">
        {formatCurrency(expense.amount, expense.currency)}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const [tab, setTab] = useState<Tab>("tasks");
  const qc = useQueryClient();

  // Plan detail
  const { data: plan, isLoading } = useQuery<Plan>({
    queryKey: ["plan", planId],
    queryFn: () => api.get(`/plans/${planId}`).then((r) => r.data.data),
  });

  // Tasks
  const { data: tasksData } = useQuery({
    queryKey: ["plan-tasks", planId],
    queryFn: () => api.get(`/plans/${planId}/tasks`).then((r) => r.data),
    enabled: tab === "tasks",
  });

  // Expenses summary
  const { data: expSummary } = useQuery({
    queryKey: ["plan-expense-summary", planId],
    queryFn: () => api.get(`/plans/${planId}/expenses/summary`).then((r) => r.data.data),
    enabled: tab === "expenses",
  });

  // Expenses list
  const { data: expData } = useQuery({
    queryKey: ["plan-expenses", planId],
    queryFn: () => api.get(`/plans/${planId}/expenses`).then((r) => r.data),
    enabled: tab === "expenses",
  });

  // Messages
  const { data: msgData } = useQuery({
    queryKey: ["plan-messages", planId],
    queryFn: () => api.get(`/plans/${planId}/messages`).then((r) => r.data),
    enabled: tab === "chat",
  });

  if (isLoading || !plan) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  const tasks: Task[]    = tasksData?.items ?? [];
  const expenses: Expense[] = expData?.items ?? [];
  const messages         = msgData?.items ?? [];
  const doneTasks        = tasks.filter((t) => t.status === "DONE").length;
  const progress         = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const TABS = [
    { id: "tasks" as Tab,    label: "Tasks",       icon: CheckSquare, count: tasks.length },
    { id: "expenses" as Tab, label: "Chi tiêu",    icon: DollarSign,  count: expenses.length },
    { id: "members" as Tab,  label: "Thành viên",  icon: Users,       count: plan.members?.length ?? plan._count.members },
    { id: "chat" as Tab,     label: "Chat",         icon: MessageSquare, count: messages.length },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Plan header */}
      <div className="card overflow-hidden">
        {plan.coverImage && (
          <img src={plan.coverImage} alt={plan.title} className="w-full h-40 object-cover" />
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="text-xl font-semibold">{plan.title}</h1>
              {plan.description && <p className="text-sm text-fg-muted mt-1">{plan.description}</p>}
            </div>
            <span className={cn("badge flex-shrink-0",
              plan.status === "ACTIVE" ? "badge-primary" :
              plan.status === "COMPLETED" ? "badge-success" :
              plan.status === "CANCELLED" ? "badge bg-danger/10 text-danger" : "badge-muted"
            )}>
              {plan.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-fg-muted mb-4">
            {plan.startDate && (
              <span>📅 {formatDate(plan.startDate)}{plan.endDate && ` → ${formatDate(plan.endDate)}`}</span>
            )}
            {plan.totalBudget && (
              <span>💰 Ngân sách: {formatCurrency(plan.totalBudget, plan.currency)}</span>
            )}
            {expSummary && (
              <span className={cn(expSummary.remaining < 0 ? "text-danger" : "text-success")}>
                💳 Đã chi: {formatCurrency(expSummary.totalSpent, plan.currency)}
              </span>
            )}
          </div>

          {tasks.length > 0 && (
            <div>
              <div className="flex justify-between text-xs text-fg-muted mb-1">
                <span>Tiến độ: {doneTasks}/{tasks.length} tasks</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-muted p-1 rounded-xl">
        {TABS.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-lg transition-all",
              tab === id ? "bg-bg-elevated text-fg font-medium shadow-card" : "text-fg-muted hover:text-fg"
            )}
            onClick={() => setTab(id)}
          >
            <Icon size={14} />{label}
            {count > 0 && <span className="text-xs opacity-60">({count})</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "tasks" && (
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <EmptyState icon={<CheckSquare size={36} />} title="Chưa có task nào" />
          ) : (
            tasks.map((t) => <TaskItem key={t.id} task={t} planId={planId!} />)
          )}
        </div>
      )}

      {tab === "expenses" && (
        <div className="space-y-3">
          {expSummary && (
            <div className="card p-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-fg-muted">Tổng chi</p>
                <p className="font-semibold mt-0.5">{formatCurrency(expSummary.totalSpent, plan.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-fg-muted">Ngân sách</p>
                <p className="font-semibold mt-0.5">{plan.totalBudget ? formatCurrency(plan.totalBudget, plan.currency) : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-fg-muted">Còn lại</p>
                <p className={cn("font-semibold mt-0.5", expSummary.remaining < 0 ? "text-danger" : "text-success")}>
                  {expSummary.remaining != null ? formatCurrency(expSummary.remaining, plan.currency) : "—"}
                </p>
              </div>
            </div>
          )}
          {expenses.length === 0 ? (
            <EmptyState icon={<DollarSign size={36} />} title="Chưa có chi tiêu nào" />
          ) : (
            <div className="space-y-2">
              {expenses.map((e) => <ExpenseItem key={e.id} expense={e} />)}
            </div>
          )}
        </div>
      )}

      {tab === "members" && (
        <div className="space-y-2">
          {(plan.members ?? []).map((m) => (
            <div key={m.id} className="card p-3 flex items-center gap-3">
              <Avatar src={m.user.avatarUrl} name={m.user.username} size="md" />
              <div className="flex-1">
                <p className="text-sm font-medium">{m.user.username}</p>
                <p className="text-xs text-fg-muted">{formatDate(m.joinedAt)} tham gia</p>
              </div>
              <span className={cn("badge text-xs",
                m.role === "OWNER" ? "badge-primary" :
                m.role === "EDITOR" ? "badge-success" : "badge-muted"
              )}>
                {m.role}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "chat" && (
        <div className="space-y-3">
          {messages.length === 0 ? (
            <EmptyState icon={<MessageSquare size={36} />} title="Chưa có tin nhắn" description="Bắt đầu thảo luận về kế hoạch" />
          ) : (
            messages.map((m: any) => (
              <div key={m.id} className="flex gap-3">
                <Avatar src={m.sender.avatarUrl} name={m.sender.username} size="sm" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{m.sender.username}</span>
                    <span className="text-xs text-fg-subtle">{timeAgo(m.createdAt)}</span>
                  </div>
                  <p className="text-sm text-fg-muted mt-0.5">{m.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}