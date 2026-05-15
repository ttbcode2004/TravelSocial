import { useState, useEffect } from "react";
import { usePlanStore } from "../../../stores/plan.store";
import { Spinner } from "../../ui/Avatar";
import { cn } from "../../../utils";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import type { Expense, ExpenseCategory } from "../../../types";

const CATEGORIES: ExpenseCategory[] = [
  "TRANSPORT", "ACCOMMODATION", "FOOD", "ACTIVITY", "SHOPPING", "OTHER",
];

export const CATEGORY_META: Record<ExpenseCategory, { label: string; emoji: string; color: string }> = {
  TRANSPORT:     { label: "Di chuyển",  emoji: "🚗", color: "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400"   },
  ACCOMMODATION: { label: "Chỗ ở",      emoji: "🏨", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  FOOD:          { label: "Ăn uống",    emoji: "🍜", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  ACTIVITY:      { label: "Hoạt động",  emoji: "🎡", color: "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400"  },
  SHOPPING:      { label: "Mua sắm",    emoji: "🛍️", color: "bg-pink-100   text-pink-700   dark:bg-pink-900/30   dark:text-pink-400"   },
  OTHER:         { label: "Khác",       emoji: "📦", color: "bg-gray-100   text-gray-600   dark:bg-gray-800/50   dark:text-gray-400"   },
};

interface ExpenseFormDrawerProps {
  open: boolean;
  onClose: () => void;
  planId: string;
  currency: string;
  expense?: Expense; // nếu có → edit, không có → create
}

export function ExpenseFormDrawer({
  open, onClose, planId, currency, expense,
}: ExpenseFormDrawerProps) {
  const createExpense = usePlanStore((s) => s.createExpense);
  const updateExpense = usePlanStore((s) => s.updateExpense);

  const [form, setForm] = useState({
    title:       "",
    amount:      "",
    currency:    currency,
    category:    "OTHER" as ExpenseCategory,
    expenseDate: "",
    notes:       "",
    receiptUrl:  "",
  });
  const [saving, setSaving] = useState(false);

  // Sync form when expense changes
  useEffect(() => {
    if (expense) {
      setForm({
        title:       expense.title,
        amount:      expense.amount.toString(),
        currency:    expense.currency,
        category:    expense.category,
        expenseDate: expense.expenseDate?.slice(0, 10) ?? "",
        notes:       expense.notes ?? "",
        receiptUrl:  expense.receiptUrl ?? "",
      });
    } else {
      setForm({ title: "", amount: "", currency, category: "OTHER", expenseDate: "", notes: "", receiptUrl: "" });
    }
  }, [expense, currency, open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [open, onClose]);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) return;
    setSaving(true);

    const payload = {
      title:       form.title.trim(),
      amount:      Number(form.amount),
      currency:    form.currency,
      category:    form.category,
      expenseDate: form.expenseDate || undefined,
      notes:       form.notes.trim() || undefined,
      receiptUrl:  form.receiptUrl.trim() || undefined,
    };

    const ok = expense
      ? await updateExpense(planId, expense.id, payload)
      : !!(await createExpense(planId, payload));

    setSaving(false);
    if (ok) {
      toast.success(expense ? "Đã cập nhật chi tiêu!" : "Đã thêm chi tiêu!");
      onClose();
    } else {
      toast.error("Không thể lưu chi tiêu");
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-bg-elevated border-l border-border shadow-modal flex flex-col animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-semibold text-base">
              {expense ? "Chỉnh sửa chi tiêu" : "Thêm chi tiêu"}
            </h2>
            <p className="text-xs text-fg-muted mt-0.5">
              {expense ? "Cập nhật thông tin chi tiêu" : "Ghi lại khoản chi cho kế hoạch"}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Tên */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Tên chi tiêu <span className="text-danger">*</span>
            </label>
            <input
              className="input"
              placeholder="Vé máy bay, Khách sạn..."
              value={form.title}
              onChange={set("title")}
              required
              autoFocus
            />
          </div>

          {/* Danh mục */}
          <div>
            <label className="block text-sm font-medium mb-2">Danh mục</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => {
                const meta = CATEGORY_META[c];
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, category: c }))}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs transition-all",
                      form.category === c
                        ? "border-primary bg-primary-subtle text-primary font-medium"
                        : "border-border text-fg-muted hover:border-border-strong"
                    )}
                  >
                    <span className="text-xl">{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Số tiền + tiền tệ */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3">
              <label className="block text-sm font-medium mb-1.5">
                Số tiền <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                className="input"
                placeholder="500,000"
                value={form.amount}
                onChange={set("amount")}
                required
                min={0}
                step="any"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1.5">Tiền tệ</label>
              <select className="input" value={form.currency} onChange={set("currency")}>
                {["VND", "USD", "EUR", "THB", "JPY", "SGD"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ngày */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Ngày chi tiêu</label>
            <input type="date" className="input" value={form.expenseDate} onChange={set("expenseDate")} />
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Ghi chú</label>
            <textarea
              className="input resize-none min-h-[72px] text-sm"
              placeholder="Mô tả thêm về khoản chi..."
              value={form.notes}
              onChange={set("notes") as any}
            />
          </div>

          {/* Receipt URL */}
          <div>
            <label className="block text-sm font-medium mb-1.5">URL hoá đơn</label>
            <input
              className="input text-sm"
              placeholder="https://..."
              value={form.receiptUrl}
              onChange={set("receiptUrl")}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex gap-3 flex-shrink-0 bg-bg-elevated">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Huỷ</button>
          <button
            type="submit"
            form="expense-form"
            className="btn-primary flex-1"
            disabled={saving}
            onClick={submit as any}
          >
            {saving ? <Spinner className="w-4 h-4" /> : expense ? "Lưu thay đổi" : "Thêm chi tiêu"}
          </button>
        </div>
      </div>
    </>
  );
}