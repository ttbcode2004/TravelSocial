import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { env } from "../config/env";
import jwt from "jsonwebtoken";

const { JsonWebTokenError, TokenExpiredError } = jwt;

// Request
//    ↓
// Controller / Service
//    ↓ throw error
// asyncHandler.catch(next)
//    ↓
// errorMiddleware
//    ↓
// JSON response chuẩn

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ─── Zod validation error ──────────────────────────────────
  // RegisterSchema.parse(req.body); nếu req.body không hợp lệ sẽ throw ZodError
  // error middleware sẽ bắt được và trả về lỗi 400 với chi tiết lỗi
  if (err instanceof ZodError) {
    const errors = err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Dữ liệu không hợp lệ",
      errors,
    });
    return;
  }

  // ─── JWT errors ────────────────────────────────────────────
  if (err instanceof TokenExpiredError) {
    res.status(401).json({
      success: false,
      code: "TOKEN_EXPIRED",
      message: "Phiên đăng nhập đã hết hạn",
    });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({
      success: false,
      code: "TOKEN_INVALID",
      message: "Token không hợp lệ",
    });
    return;
  }

  // ─── App errors ────────────────────────────────────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
    return;
  }

  // ─── Prisma unique constraint ──────────────────────────────
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as any).code === "P2002"
  ) {
    const fields = (err as any).meta?.target?.join(", ");
    res.status(409).json({
      success: false,
      code: "UNIQUE_CONSTRAINT",
      message: `Giá trị đã tồn tại: ${fields}`,
    });
    return;
  }

  // ─── Unknown errors ────────────────────────────────────────
  console.error("[Unhandled Error]", err);

  res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    message: "Lỗi máy chủ nội bộ",
    ...(env.NODE_ENV !== "production" && {
      detail: err instanceof Error ? err.message : String(err),
    }),
  });
}