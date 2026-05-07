import { Request, Response, NextFunction } from "express";

// ─── AppError ─────────────────────────────────────────────────

// default Error just has message, nhưng AppError có thêm statusCode và code để dễ dàng phân loại lỗi
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    // Gọi constructor của Error để thiết lập message
    super(message);
    // AppError: Không tìm thấy user thay vi Error: Không tìm thấy user
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

// Shorthand helpers
// throw badRequest("Email không hợp lệ", "INVALID_EMAIL") thay vì throw new AppError(400, "Email không hợp lệ", "INVALID_EMAIL")
export const badRequest = (msg: string, code?: string) =>
  new AppError(400, msg, code);
export const unauthorized = (msg = "Chưa đăng nhập") =>
  new AppError(401, msg, "UNAUTHORIZED");
export const forbidden = (msg = "Không có quyền") =>
  new AppError(403, msg, "FORBIDDEN");
export const notFound = (msg: string) => new AppError(404, msg, "NOT_FOUND");
export const conflict = (msg: string, code?: string) =>
  new AppError(409, msg, code);

// ─── asyncHandler ────────────────────────────────────────────
// Bọc async controller, tự động forward lỗi đến error middleware
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };