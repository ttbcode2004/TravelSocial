import { Response } from "express";
import { env } from "../config/env";

const BASE_OPTIONS = {
  httpOnly: true,              // không đọc được từ JS chông XSS
  secure: env.COOKIE_SECURE,   // chỉ HTTPS khi production
  sameSite: "lax" as const,    // chống CSRF, vẫn cho phép gửi cookie khi redirect từ email
  domain: env.COOKIE_DOMAIN,
  path: "/",
};

// access token: 15 phút
export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie("access_token", token, {
    ...BASE_OPTIONS,
    maxAge: 60 * 60 * 1000, // 60 phút
  });
}

// refresh token: 30 ngày
export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie("refresh_token", token, {
    ...BASE_OPTIONS,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
    path: "/api/auth/refresh",         // chỉ gửi khi gọi endpoint refresh
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("access_token", { ...BASE_OPTIONS });
  res.clearCookie("refresh_token", {
    ...BASE_OPTIONS,
    path: "/api/auth/refresh",
  });
}