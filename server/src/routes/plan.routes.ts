import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as PlansController from "../controllers/plan.controller";

const router = Router();

// Tất cả routes đều cần đăng nhập
router.use(authenticate);

// ─── Plans ────────────────────────────────────────────────────
//  Danh sách kế hoạch của tôi
router.get("/", PlansController.listMyPlans);

// Tạo kế hoạch mới
router.post("/", PlansController.createPlan);

// Chi tiết kế hoạch (members + tasks + expenses)
router.get("/:planId", PlansController.getPlan);

// Cập nhật kế hoạch
router.patch("/:planId", PlansController.updatePlan);

// Xoá kế hoạch (owner only)
router.delete("/:planId", PlansController.deletePlan);

// Rời kế hoạch
router.post("/:planId/leave", PlansController.leavePlan);

// ─── Members ──────────────────────────────────────────────────
// Mời thành viên
router.post("/:planId/members", PlansController.inviteMembers);

// Đổi role
router.patch("/:planId/members/:userId", PlansController.updateMemberRole);

// Xoá thành viên
router.delete("/:planId/members/:userId", PlansController.removeMember);

// ─── Tasks ────────────────────────────────────────────────────
// Danh sách task (có filter)
router.get("/:planId/tasks", PlansController.getTasks);

// Thống kê task theo status
router.get("/:planId/tasks/stats", PlansController.getTaskStats);

// Tạo task mới
router.post("/:planId/tasks", PlansController.createTask);

// Cập nhật task (status, assignee, v.v.)
router.patch("/:planId/tasks/:taskId", PlansController.updateTask);

// Xoá task
router.delete("/:planId/tasks/:taskId", PlansController.deleteTask);

// ─── Expenses ─────────────────────────────────────────────────
// Danh sách chi tiêu
router.get("/:planId/expenses", PlansController.getExpenses);

// Tổng hợp chi tiêu (theo category, member)
router.get("/:planId/expenses/summary", PlansController.getExpenseSummary);

// Thêm chi tiêu
router.post("/:planId/expenses", PlansController.createExpense);

// Sửa chi tiêu
router.patch("/:planId/expenses/:expenseId", PlansController.updateExpense);

// Xoá chi tiêu
router.delete("/:planId/expenses/:expenseId", PlansController.deleteExpense);

// ─── Plan Chat ────────────────────────────────────────────────
//  Lịch sử tin nhắn nhóm plan (cursor)
router.get("/:planId/messages", PlansController.getPlanMessages);

// Gửi tin nhắn trong plan
router.post("/:planId/messages", PlansController.sendPlanMessage);

export default router;