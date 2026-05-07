import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtAccessPayload } from "../utils/jwt";
import { unauthorized } from "../utils/errors";

// Mở rộng Request để có req.user
declare global {
  namespace Express {
    interface Request {
      user?: JwtAccessPayload;
    }
  }
}

/**
 * authenticate — bắt buộc đăng nhập
 * Lấy JWT từ cookie (ưu tiên) hoặc Authorization header (Bearer token)
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    // 1. Lấy token từ cookie
    let token = req.cookies?.access_token as string | undefined;

    // 2. Fallback: Authorization: Bearer <token>
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (!token) throw unauthorized();

    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(unauthorized());
  }
}

/**
 * optionalAuthenticate — không bắt buộc đăng nhập
 * Gắn req.user nếu có token hợp lệ, bỏ qua nếu không
 */
export function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token =
      req.cookies?.access_token ||
      req.headers.authorization?.replace("Bearer ", "");
    if (token) req.user = verifyAccessToken(token);
  } catch {
    // bỏ qua lỗi
  }
  next();
}