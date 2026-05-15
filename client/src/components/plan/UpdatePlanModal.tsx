import { useState } from "react";
import Modal from "../ui/Modal";
import type { Plan, PlanStatus } from "../../types";
import { usePlanStore } from "../../stores/plan.store";

interface Props {
  plan: Plan;
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

export default function UpdatePlanModal({
  plan,
  onClose,
}: Props) {
  const isLoading = usePlanStore((s) => s.isLoading);
  const updatePlan = usePlanStore((s) => s.updatePlan);

  const [title, setTitle] = useState(plan.title);
  const [description, setDescription] = useState(plan.description || "");
  const [startDate, setStartDate] = useState(
    plan.startDate?.slice(0, 10) || ""
  );
  const [endDate, setEndDate] = useState(
    plan.endDate?.slice(0, 10) || ""
  );
  const [totalBudget, setTotalBudget] = useState(
    plan.totalBudget?.toString() || ""
  );
  const [currency, setCurrency] = useState(plan.currency || "VND");
  const [coverImage, setCoverImage] = useState(plan.coverImage || "");
  const [status, setStatus] = useState<PlanStatus>(plan.status);

  const handleSubmit = async () => {
    await updatePlan(plan.id, {
      title,
      description,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      totalBudget: totalBudget ? Number(totalBudget) : undefined,
      currency,
      coverImage,
      status,
    });

    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      title="Cập nhật kế hoạch"
      className="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="label">Tên kế hoạch</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="label">Mô tả</label>
          <textarea
            className="input min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Ngày bắt đầu</label>
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Ngày kết thúc</label>
            <input
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Budget */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Ngân sách</label>
            <input
              type="number"
              className="input"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Tiền tệ</label>
            <input
              className="input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>
        </div>

        {/* Cover */}
        <div>
          <label className="label">Ảnh bìa</label>
          <input
            className="input"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://..."
          />
        </div>

        {/* Status */}
        <div>
          <label className="label">Trạng thái</label>

          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as PlanStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            className="btn-ghost"
            onClick={onClose}
          >
            Huỷ
          </button>

          <button
            className="btn-primary"
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </Modal>
  );
}