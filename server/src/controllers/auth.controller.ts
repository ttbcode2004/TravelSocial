import { Request, Response } from "express";
import { env } from "../config/env";
import { asyncHandler, badRequest } from "../utils/errors";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
} from "../utils/cookie";
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
} from "../types/auth.type";
import * as AuthService from "../services/auth.service";
import type { OAuthProfile } from "../types/auth.type";

// ─── Email / Password ─────────────────────────────────────────

export const register = asyncHandler(async (req, res) => {
  const dto = RegisterSchema.parse(req.body);
  const result = await AuthService.registerWithEmail(dto);
  res.status(201).json({ success: true, ...result });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token || typeof token !== "string") throw badRequest("Token không hợp lệ");

  const result = await AuthService.verifyEmail(token);
  res.json({ success: true, ...result });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw badRequest("Vui lòng cung cấp email");

  const result = await AuthService.resendVerificationEmail(email);
  res.json({ success: true, ...result });
});

export const login = asyncHandler(async (req, res) => {
  const dto = LoginSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await AuthService.loginWithEmail(dto);

  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);

  res.json({ success: true, user });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookies(res);
  res.json({ success: true, message: "Đã đăng xuất." });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) throw badRequest("Không có refresh token");

  const { user, accessToken, refreshToken } = await AuthService.refreshTokens(token);
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);

  res.json({ success: true, user });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = ForgotPasswordSchema.parse(req.body);
  const result = await AuthService.forgotPassword(email);
  res.json({ success: true, ...result });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const dto = ResetPasswordSchema.parse(req.body);
  const result = await AuthService.resetPassword(dto);
  res.json({ success: true, ...result });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = ChangePasswordSchema.parse(req.body);
  // req.user được gắn bởi auth middleware
  const userId = (req as any).user.sub as string;
  const result = await AuthService.changePassword(userId, currentPassword, newPassword);
  res.json({ success: true, ...result });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: (req as any).user });
});

// ─── Google OAuth ─────────────────────────────────────────────
// Frontend click "Login with Google"
//         ↓
// Backend redirect tới Google
//         ↓
// User login Google
//         ↓
// Google redirect về backend callback
//         ↓
// Backend lấy user info
//         ↓
// Tạo JWT của hệ thống bạn

export const googleRedirect = asyncHandler(async (_req, res) => {
  if (!env.GOOGLE_CLIENT_ID) throw badRequest("Google OAuth chưa được cấu hình");

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID as string,
    redirect_uri: env.GOOGLE_CALLBACK_URL as string,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

export const googleCallback = asyncHandler(async (req, res) => {
  const { code, error } = req.query;

  if (error || !code || typeof code !== "string") {
    return res.redirect(`${env.CLIENT_URL}/auth/login?error=google_denied`);
  }

  // Đổi code lấy access_token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID as string,
      client_secret: env.GOOGLE_CLIENT_SECRET as string,
      redirect_uri: env.GOOGLE_CALLBACK_URL as string,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = (await tokenRes.json()) as any;
  if (tokenData.error) {
    return res.redirect(`${env.CLIENT_URL}/auth/login?error=google_token`);
  }

  // Lấy thông tin user
  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const googleUser = (await userRes.json()) as any;

  const profile: OAuthProfile = {
    providerId: googleUser.sub,
    email: googleUser.email,
    username: googleUser.name?.replace(/\s+/g, "").toLowerCase() || "user",
    avatarUrl: googleUser.picture,
  };

  const { user, accessToken, refreshToken } = await AuthService.handleOAuthLogin(
    "google",
    profile
  );

  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);

  res.redirect(`${env.CLIENT_URL}/auth/callback?success=true`);
});

// ─── GitHub OAuth ─────────────────────────────────────────────

export const githubRedirect = asyncHandler(async (_req, res) => {
  if (!env.GITHUB_CLIENT_ID) throw badRequest("GitHub OAuth chưa được cấu hình");

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID as string,
    redirect_uri: env.GITHUB_CALLBACK_URL as string,
    scope: "user:email read:user",
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

export const githubCallback = asyncHandler(async (req, res) => {
  const { code, error } = req.query;

  if (error || !code || typeof code !== "string") {
    return res.redirect(`${env.CLIENT_URL}/auth/login?error=github_denied`);
  }

  // Đổi code lấy access_token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID as string,
      client_secret: env.GITHUB_CLIENT_SECRET as string,
      code,
      redirect_uri: env.GITHUB_CALLBACK_URL as string,
    }),
  });

  const tokenData = (await tokenRes.json()) as any;
  if (tokenData.error) {
    return res.redirect(`${env.CLIENT_URL}/auth/login?error=github_token`);
  }

  const ghToken = tokenData.access_token;

  // Lấy profile
  const [profileRes, emailsRes] = await Promise.all([
    fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${ghToken}`, "User-Agent": "TravelSocial" },
    }),
    fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${ghToken}`, "User-Agent": "TravelSocial" },
    }),
  ]);

  const ghUser = (await profileRes.json()) as any;
  const ghEmails = (await emailsRes.json()) as any[];

  // Ưu tiên email primary đã verify
  const primaryEmail =
    ghEmails.find((e) => e.primary && e.verified)?.email ??
    ghEmails.find((e) => e.verified)?.email ??
    ghUser.email;

  if (!primaryEmail) {
    return res.redirect(`${env.CLIENT_URL}/auth/login?error=github_no_email`);
  }

  const profile: OAuthProfile = {
    providerId: String(ghUser.id),
    email: primaryEmail,
    username: ghUser.login,
    avatarUrl: ghUser.avatar_url,
  };

  const { user, accessToken, refreshToken } = await AuthService.handleOAuthLogin(
    "github",
    profile
  );

  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);

  res.redirect(`${env.CLIENT_URL}/auth/callback?success=true`);
});