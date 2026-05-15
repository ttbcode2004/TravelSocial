import { useState, useEffect } from "react";
import { usePlanStore } from "../../../stores/plan.store";
import { EmptyState, Spinner } from "../../ui/Avatar";
import { Plus, Receipt } from "lucide-react";
import { cn } from "../../../utils";
import type { ExpenseCategory, Plan } from "../../../types";

import { ExpenseSummary } from "./ExpenseSummary";
import { ExpenseCard } from "./ExpenseCard";
import { CATEGORY_META, ExpenseFormDrawer } from "./ExpenseFormDrawer";

const CATEGORIES: ExpenseCategory[] = [
  "TRANSPORT", "ACCOMMODATION", "FOOD", "ACTIVITY", "SHOPPING", "OTHER",
];

interface ExpensesTabProps {
  planId: string;
  plan: Plan;           // giả sử bạn import type Plan từ types
  canEdit: boolean;
}

export default function ExpensesTab({ planId, plan, canEdit }: ExpensesTabProps) {
  const expenses = usePlanStore((s) => s.expenses);
  const isLoading = usePlanStore((s) => s.isLoadingExpenses);
  
  const fetchExpenses = usePlanStore((s) => s.fetchExpenses);
  const fetchSummary = usePlanStore((s) => s.fetchExpenseSummary);

  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [filterCat, setFilterCat] = useState<ExpenseCategory | "">("");

  // Fetch data
  useEffect(() => {
    fetchExpenses(planId);
    fetchSummary(planId);
  }, [planId, fetchExpenses, fetchSummary]);

  // Filter expenses
  const filteredExpenses = filterCat
    ? expenses.filter((e) => e.category === filterCat)
    : expenses;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <ExpenseSummary currency={plan.currency} />

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 flex-1 overflow-x-auto no-scrollbar pb-1">
          {/* All button */}
          <button
            onClick={() => setFilterCat("")}
            className={cn(
              "flex-shrink-0 text-xs px-4 py-1.5 rounded-full border transition-all whitespace-nowrap",
              !filterCat
                ? "bg-primary text-primary-fg border-primary font-medium"
                : "border-border hover:border-border-strong text-fg-muted"
            )}
          >
            Tất cả ({expenses.length})
          </button>

          {/* Category filters */}
          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat]; // từ ExpenseFormDrawer
            const count = expenses.filter((e) => e.category === cat).length;

            if (count === 0) return null;

            return (
              <button
                key={cat}
                onClick={() => setFilterCat((prev) => (prev === cat ? "" : cat))}
                className={cn(
                  "flex-shrink-0 text-xs px-4 py-1.5 rounded-full border transition-all inline-flex items-center gap-1.5 whitespace-nowrap",
                  filterCat === cat
                    ? "bg-primary text-primary-fg border-primary font-medium"
                    : "border-border hover:border-border-strong text-fg-muted"
                )}
              >
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {canEdit && (
          <button
            onClick={() => setShowCreateDrawer(true)}
            className="btn-primary gap-2 flex-shrink-0"
          >
            <Plus size={16} />
            Thêm chi tiêu
          </button>
        )}
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={<Receipt size={48} className="text-fg-muted" />}
            title={filterCat ? "Không tìm thấy chi tiêu" : "Chưa có chi tiêu nào"}
            description={
              canEdit
                ? "Hãy thêm khoản chi đầu tiên để theo dõi chi phí nhóm"
                : "Nhóm chưa ghi nhận khoản chi nào"
            }
            action={
              canEdit ? (
                <button
                  onClick={() => setShowCreateDrawer(true)}
                  className="btn-primary gap-2 mt-4"
                >
                  <Plus size={16} />
                  Thêm chi tiêu đầu tiên
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              planId={planId}
              currency={plan.currency}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      {/* Create Drawer */}
      <ExpenseFormDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        planId={planId}
        currency={plan.currency}
      />
    </div>
  );
}