import { useEffect, useState } from "react";
import { EmptyState, Spinner } from "../../components/ui/Avatar";
import { Plus, ClipboardList } from "lucide-react";
import type { PlanStatus } from "../../types";
import PlanCard from "../../components/plan/PlanCard";
import CreatePlanModal from "../../components/plan/CreatePlanModal";
import { cn } from "../../utils";
import { usePlanStore } from "../../stores/plan.store";

const STATUS_LABEL: Record<PlanStatus, string> = {
  DRAFT: "Nháp", ACTIVE: "Đang thực hiện", COMPLETED: "Hoàn thành", CANCELLED: "Đã huỷ",
};

export default function PlansPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PlanStatus | "">("");

  const fetchPlans = usePlanStore((s) => s.fetchPlans);
  const plans = usePlanStore((s) => s.plans);
  const isLoading = usePlanStore((s) => s.isLoading)
  
  useEffect(() => {
    fetchPlans(undefined, statusFilter || undefined);
  }, [statusFilter, fetchPlans]);

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
              "shrink-0 text-xs py-1.5 px-3 rounded-full border transition-all",
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {plans.map((p) => <PlanCard key={p.id} plan={p} />)}
        </div>
      )}

      {showCreate && <CreatePlanModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}