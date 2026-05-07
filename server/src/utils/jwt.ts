import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "./errors";

// Login
//   ↓
// Access Token (15m)
// Refresh Token (7d)

// Access hết hạn
//   ↓
// Refresh API
//   ↓
// New Access Token

export interface JwtAccessPayload {
  sub: string; // userId
  username: string;
  email: string;
  type: "access";
}

export interface JwtRefreshPayload {
  sub: string; // userId
  type: "refresh";
}

export interface JwtEmailPayload {
  sub: string; // userId
  email: string;
  type: "email_verify" | "password_reset";
}

// Omit<T, K> lấy tất cả thuộc tính của T nhưng bỏ đi K
export function signAccessToken(
  payload: Omit<JwtAccessPayload, "type">,
): string {
  return jwt.sign(
    { ...payload, type: "access" },
    env.JWT_SECRET as string,
    { expiresIn: env.JWT_EXPIRES_IN ?? "1h" } as SignOptions,
  );
}

export function signRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: "refresh" },
    env.JWT_REFRESH_SECRET as string,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN ?? "7d" } as SignOptions,
  );
}

export function signEmailToken(payload: JwtEmailPayload): string {
  return jwt.sign(
    payload,
    env.JWT_EMAIL_SECRET as string,
    {
      expiresIn: "24h",
    } as SignOptions,
  );
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  return jwt.verify(token, env.JWT_SECRET as string) as JwtAccessPayload;
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  return jwt.verify(
    token,
    env.JWT_REFRESH_SECRET as string,
  ) as JwtRefreshPayload;
}

export function verifyEmailToken(
  token: string,
  expectedType: JwtEmailPayload["type"],
): JwtEmailPayload {
  const payload = jwt.verify(
    token,
    env.JWT_EMAIL_SECRET as string,
  ) as JwtEmailPayload;

  if (payload.type !== expectedType) {
    throw new AppError(400, "Invalid token type");
  }

  return payload;
}
