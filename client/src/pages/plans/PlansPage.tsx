import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import Avatar, { EmptyState, Spinner } from "../../components/ui/Avatar";
import { cn, formatDate, formatCurrency } from "../../utils";
import { Plus, ClipboardList, Users, Calendar, Wallet, X } from "lucide-react";
import toast from "react-hot-toast";
import type { Plan, PlanStatus } from "../../types";

const STATUS_STYLE: Record<PlanStatus, string> = {
  DRAFT:     "badge-muted",
  ACTIVE:    "badge-primary",
  COMPLETED: "badge-success",
  CANCELLED: "badge bg-danger/10 text-danger",
};
const STATUS_LABEL: Record<PlanStatus, string> = {
  DRAFT: "Nháp", ACTIVE: "Đang thực hiện", COMPLETED: "Hoàn thành", CANCELLED: "Đã huỷ",
};

// ─── Create Plan Modal ────────────────────────────────────────

function CreatePlanModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "", description: "", startDate: "", endDate: "",
    totalBudget: "", currency: "VND",
  });

  const create = useMutation({
    mutationFn: (data: object) => api.post("/plans", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Đã tạo kế hoạch!");
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Lỗi tạo kế hoạch"),
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      title: form.title,
      description: form.description || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      totalBudget: form.totalBudget ? Number(form.totalBudget) : undefined,
      currency: form.currency,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md shadow-modal animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">Tạo kế hoạch mới</h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Tên kế hoạch *</label>
            <input className="input" placeholder="Chuyến đi Đà Lạt 2025" value={form.title} onChange={set("title")} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Mô tả</label>
            <textarea className="input min-h-[80px] resize-none" placeholder="Mô tả chuyến đi..." value={form.description} onChange={set("description") as any} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Ngày bắt đầu</label>
              <input type="date" className="input" value={form.startDate} onChange={set("startDate")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Ngày kết thúc</label>
              <input type="date" className="input" value={form.endDate} onChange={set("endDate")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Ngân sách</label>
              <input type="number" className="input" placeholder="5000000" value={form.totalBudget} onChange={set("totalBudget")} min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Tiền tệ</label>
              <select className="input" value={form.currency} onChange={set("currency")}>
                <option value="VND">VND</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Huỷ</button>
            <button type="submit" className="btn-primary flex-1" disabled={create.isPending}>
              {create.isPending ? <Spinner className="w-4 h-4" /> : "Tạo kế hoạch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────

function PlanCard({ plan }: { plan: Plan }) {
  const progress = plan._count.tasks > 0
    ? Math.round(((plan as any).doneTasksCount ?? 0) / plan._count.tasks * 100)
    : 0;

  return (
    <Link to={`/plans/${plan.id}`} className="card p-5 block hover:shadow-elevated transition-shadow group">
      {/* Cover */}
      {plan.coverImage && (
        <div className="h-32 rounded-lg overflow-hidden mb-4 -mx-1">
          <img src={plan.coverImage} alt={plan.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">{plan.title}</h3>
        <span className={cn("badge flex-shrink-0", STATUS_STYLE[plan.status])}>{STATUS_LABEL[plan.status]}</span>
      </div>

      {plan.description && <p className="text-sm text-fg-muted line-clamp-2 mb-3">{plan.description}</p>}

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fg-muted mb-3">
        {plan.startDate && (
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(plan.startDate)}
            {plan.endDate && ` → ${formatDate(plan.endDate)}`}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users size={12} />
          {plan._count.members} thành viên
        </span>
        {plan.totalBudget && (
          <span className="flex items-center gap-1">
            <Wallet size={12} />
            {formatCurrency(plan.totalBudget, plan.currency)}
          </span>
        )}
      </div>

      {/* Task progress */}
      {plan._count.tasks > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-fg-muted mb-1">
            <span>Tiến độ tasks</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Members preview */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {plan.members?.slice(0, 4).map((m) => (
            <Avatar key={m.id} src={m.user.avatarUrl} name={m.user.username} size="xs" className="ring-2 ring-bg-elevated" />
          ))}
          {(plan._count.members > 4) && (
            <div className="w-6 h-6 rounded-full bg-bg-muted border-2 border-bg-elevated flex items-center justify-center text-xs text-fg-muted">
              +{plan._count.members - 4}
            </div>
          )}
        </div>
        <span className="text-xs text-fg-subtle ml-1">{plan._count.expenses} chi tiêu</span>
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function PlansPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PlanStatus | "">("");

  const { data, isLoading } = useQuery({
    queryKey: ["plans", statusFilter],
    queryFn: () =>
      api.get("/plans", { params: { status: statusFilter || undefined, limit: 20 } }).then((r) => r.data),
  });

  const plans: Plan[] = data?.items ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold">Kế hoạch của tôi</h1>
        <button className="btn-primary gap-2" onClick={() => setShowCreate(true)}>
          <Plus size={18} />
          Tạo kế hoạch
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
        {(["", "DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"] as const).map((s) => (
          <button
            key={s}
            className={cn(
              "flex-shrink-0 text-xs py-1.5 px-3 rounded-full border transition-all",
              statusFilter === s
                ? "bg-primary text-primary-fg border-primary"
                : "border-border text-fg-muted hover:border-border-strong"
            )}
            onClick={() => setStatusFilter(s)}
          >
            {s === "" ? "Tất cả" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Plans grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={40} />}
          title="Chưa có kế hoạch nào"
          description="Lên kế hoạch chuyến đi cùng bạn bè ngay!"
          action={
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Tạo kế hoạch đầu tiên
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((p) => <PlanCard key={p.id} plan={p} />)}
        </div>
      )}

      {showCreate && <CreatePlanModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}