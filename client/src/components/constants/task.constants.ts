import {  TaskPriority, TaskStatus, PlanStatus } from "../../types";

export const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
  CANCELLED: "TODO",
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "Chưa làm",
  IN_PROGRESS: "Đang làm",
  DONE: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

export const PRIORITY_OPTIONS: TaskPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
};

export const PRIORITY_BADGE: Record<TaskPriority, string> = {
  LOW: "badge-muted",
  MEDIUM: "badge bg-warning/10 text-warning",
  HIGH: "badge bg-danger/10 text-danger",
  URGENT: "badge bg-danger text-white",
};

export function getPlanStatusLabel(status: PlanStatus): string {
  switch (status) {
    case "DRAFT":
      return "Bản nháp";

    case "ACTIVE":
      return "Đang hoạt động";

    case "COMPLETED":
      return "Hoàn thành";

    case "CANCELLED":
      return "Đã hủy";

    default:
      return "Không xác định";
  }
}