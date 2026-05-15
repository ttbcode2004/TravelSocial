import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import {
  signAccessToken,
  signRefreshToken,
  signEmailToken,
  verifyRefreshToken,
  verifyEmailToken,
} from "../utils/jwt";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email";
import { badRequest, conflict, notFound, unauthorized } from "../utils/errors";
import type {
  RegisterDto,
  LoginDto,
  AuthUser,
  OAuthProfile,
  ResetPasswordDto,
} from "../types/auth.type";

const SALT_ROUNDS = 12;

// ─── Helpers ──────────────────────────────────────────────────

function toAuthUser(user: {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  isVerified: boolean;
  createdAt: Date;
}): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}

function generateTokenPair(user: AuthUser) {
  const accessToken = signAccessToken({
    sub: user.id,
    username: user.username,
    email: user.email,
  });
  const refreshToken = signRefreshToken(user.id);
  return { accessToken, refreshToken };
}

// Username đã tồn tại → tự sinh username mới
async function resolveUsername(base: string): Promise<string> {
  const clean = base.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20) || "user";
  const exists = await prisma.user.findUnique({ where: { username: clean } });
  if (!exists) return clean;
  // thêm số random
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `${clean}${suffix}`;
}

// ─── Email / Password ─────────────────────────────────────────

export async function registerWithEmail(dto: RegisterDto) {
  // kiểm tra email đã tồn tại
  const existingEmail = await prisma.user.findUnique({
    where: { email: dto.email },
  });
  if (existingEmail) throw conflict("Email đã được sử dụng", "EMAIL_TAKEN");

  // kiểm tra username
  const existingUsername = await prisma.user.findUnique({
    where: { username: dto.username },
  });
  if (existingUsername) throw conflict("Username đã tồn tại", "USERNAME_TAKEN");

  const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username: dto.username,
      email: dto.email,
      passwordHash,
      isVerified: false,
    },
  });

  // gửi email xác nhận
  const token = signEmailToken({ sub: user.id, email: user.email, type: "email_verify" });
  await sendVerificationEmail(user.email, user.username, token);

  return { message: "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản." };
}

export async function verifyEmail(token: string) {
  const payload = verifyEmailToken(token, "email_verify");

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw notFound("Tài khoản không tồn tại");
  if (user.isVerified) return { message: "Email đã được xác nhận trước đó." };

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true },
  });

  return { message: "Xác nhận email thành công! Bạn có thể đăng nhập." };
}

export async function loginWithEmail(dto: LoginDto) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });

  if (!user || !user.passwordHash) {
    throw unauthorized("Email hoặc mật khẩu không đúng");
  }

  const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
  if (!isMatch) throw unauthorized("Email hoặc mật khẩu không đúng");

  if (!user.isVerified) {
    throw badRequest(
      "Tài khoản chưa xác nhận email. Vui lòng kiểm tra hộp thư.",
      "EMAIL_NOT_VERIFIED"
    );
  }

  const authUser = toAuthUser(user);
  const tokens = generateTokenPair(authUser);
  return { user: authUser, ...tokens };
}

// ─── Refresh Token ────────────────────────────────────────────

export async function refreshTokens(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw unauthorized("Tài khoản không tồn tại");

  const authUser = toAuthUser(user);
  const tokens = generateTokenPair(authUser);
  return { user: authUser, ...tokens };
}

// ─── Forgot / Reset Password ──────────────────────────────────

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // không tiết lộ email có tồn tại không (tránh enumeration attack)
  // if (!user || user.provider !== "local") {
  //   return { message: "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu." };
  // }

  if (!user) {
    return {
      success: false,
      message: "Không tìm thấy tài khoản với email này. Vui lòng kiểm tra lại hoặc đăng ký mới.",
    };
  }

  const token = signEmailToken({ sub: user.id, email: user.email, type: "password_reset" });
  await sendPasswordResetEmail(user.email, user.username, token);

  return { success: true, message: "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu." };
}

export async function resetPassword(dto: ResetPasswordDto) {
  const payload = verifyEmailToken(dto.token, "password_reset");

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw notFound("Tài khoản không tồn tại");

  const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { success: true, message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại." };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.passwordHash) {
    throw badRequest("Tài khoản này không dùng mật khẩu");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw badRequest("Mật khẩu hiện tại không đúng", "WRONG_PASSWORD");

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { message: "Đổi mật khẩu thành công." };
}

// ─── OAuth (Google & GitHub) ──────────────────────────────────

export async function handleOAuthLogin(
  provider: "google" | "github",
  profile: OAuthProfile
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
  const providerField = provider === "google" ? "googleId" : "githubId";

  // 1. Tìm theo providerId
  let user = await prisma.user.findFirst({
    where: { [providerField]: profile.providerId },
  });

  if (!user) {
    // 2. Tìm theo email (liên kết tài khoản cũ)
    user = await prisma.user.findUnique({ where: { email: profile.email } });

    if (user) {
      // liên kết provider vào tài khoản có sẵn
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          [providerField]: profile.providerId,
          isVerified: true, // email từ OAuth đã xác thực
          avatarUrl: user.avatarUrl ?? profile.avatarUrl ?? null,
        },
      });
    } else {
      // 3. Tạo tài khoản mới
      const username = await resolveUsername(profile.username);
      user = await prisma.user.create({
        data: {
          username,
          email: profile.email,
          passwordHash: null,
          avatarUrl: profile.avatarUrl ?? null,
          isVerified: true, // OAuth email đã xác thực
          provider,
          [providerField]: profile.providerId,
        },
      });
    }
  }

  const authUser = toAuthUser(user);
  const tokens = generateTokenPair(authUser);
  return { user: authUser, ...tokens };
}

// ─── Resend Verification ──────────────────────────────────────

export async function resendVerificationEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.isVerified) {
    return { message: "Nếu email tồn tại và chưa xác nhận, bạn sẽ nhận được email mới." };
  }

  const token = signEmailToken({ sub: user.id, email: user.email, type: "email_verify" });
  await sendVerificationEmail(user.email, user.username, token);

  return { message: "Nếu email tồn tại và chưa xác nhận, bạn sẽ nhận được email mới." };
}