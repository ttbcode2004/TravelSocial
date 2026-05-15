import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import toast from "react-hot-toast";

import Modal from "../ui/Modal";
import { Spinner } from "../ui/Avatar";

import { usePlanStore } from "../../stores/plan.store";
import type { PlanStatus } from "../../types";

interface Props {
  onClose: () => void;
}

const STATUS_OPTIONS: PlanStatus[] = [
  "DRAFT",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];

const STATUS_LABEL: Record<PlanStatus, string> = {
  DRAFT: "Nháp",
  ACTIVE: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

export default function CreatePlanModal({ onClose }: Props) {
  const createPlan = usePlanStore((s) => s.createPlan);

  const [isLoading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    totalBudget: "",
    currency: "VND",
    coverImage: "",
  });

  const setField =
    (key: keyof typeof form) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      setForm((prev) => ({
        ...prev,
        [key]: e.target.value,
      }));
    };

  const submit = async (e: any) => {
    e.preventDefault();

    try {
      setLoading(true);

      const ok = await createPlan({
        title: form.title,
        description: form.description || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        totalBudget: form.totalBudget
          ? Number(form.totalBudget)
          : undefined,
        currency: form.currency || undefined,
        coverImage: form.coverImage || undefined,
      });

      if (!ok) {
        toast.error("Tạo kế hoạch thất bại");
        return;
      }

      toast.success("Tạo kế hoạch thành công");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Tạo kế hoạch mới"
      onClose={onClose}
      className="max-w-2xl"
    >
      <form onSubmit={submit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="label">
            Tên kế hoạch *
          </label>

          <input
            className="input"
            placeholder="Chuyến đi Đà Lạt 2025"
            value={form.title}
            onChange={setField("title")}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="label">
            Mô tả
          </label>

          <textarea
            className="input min-h-[100px] resize-none"
            placeholder="Mô tả chuyến đi..."
            value={form.description}
            onChange={setField("description")}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">
              Ngày bắt đầu
            </label>

            <input
              type="date"
              className="input"
              value={form.startDate}
              onChange={setField("startDate")}
            />
          </div>

          <div>
            <label className="label">
              Ngày kết thúc
            </label>

            <input
              type="date"
              className="input"
              value={form.endDate}
              onChange={setField("endDate")}
            />
          </div>
        </div>

        {/* Budget */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">
              Ngân sách
            </label>

            <input
              type="number"
              min={0}
              className="input"
              placeholder="5000000"
              value={form.totalBudget}
              onChange={setField("totalBudget")}
            />
          </div>

          <div>
            <label className="label">
              Tiền tệ
            </label>

            <select
              className="input"
              value={form.currency}
              onChange={setField("currency")}
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {/* Cover Image */}
        <div>
          <label className="label">
            Ảnh bìa
          </label>

          <input
            className="input"
            placeholder="https://..."
            value={form.coverImage}
            onChange={setField("coverImage")}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Huỷ
          </button>

          <button
            type="submit"
            className="btn-primary min-w-[140px]"
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner className="w-4 h-4" />
            ) : (
              "Tạo kế hoạch"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}