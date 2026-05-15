import { useState } from "react";
import { usePlanStore } from "../../../stores/plan.store";
import { Spinner } from "../../ui/Avatar";
import { AlertTriangle, X } from "lucide-react";
import toast from "react-hot-toast";
import type { Expense } from "../../../types";

interface DeleteExpenseConfirmProps {
  open: boolean;
  onClose: () => void;
  expense: Expense;
  planId: string;
}

export function DeleteExpenseConfirm({
  open, onClose, expense, planId,
}: DeleteExpenseConfirmProps) {
  const deleteExpense = usePlanStore((s) => s.deleteExpense);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const ok = await deleteExpense(planId, expense.id);
    setLoading(false);
    if (ok) { toast.success("Đã xoá chi tiêu"); onClose(); }
    else toast.error("Không thể xoá");
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-bg-elevated border border-border rounded-2xl shadow-modal w-full max-w-sm p-6 pointer-events-auto animate-scale-in">
          {/* Icon */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
              <AlertTriangle size={24} className="text-danger" />
            </div>
            <button className="btn-icon" onClick={onClose}><X size={18} /></button>
          </div>

          {/* Content */}
          <h3 className="font-semibold text-base mb-1">Xoá chi tiêu?</h3>
          <p className="text-sm text-fg-muted mb-1">
            Khoản chi <span className="font-medium text-fg">"{expense.title}"</span> sẽ bị xoá vĩnh viễn.
          </p>
          <p className="text-xs text-fg-subtle mb-5">Thao tác này không thể hoàn tác.</p>

          {/* Actions */}
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={onClose} disabled={loading}>Huỷ</button>
            <button className="btn-danger flex-1" onClick={handleDelete} disabled={loading}>
              {loading ? <Spinner className="w-4 h-4" /> : "Xoá chi tiêu"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}