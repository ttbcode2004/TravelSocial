import { z } from "zod";

// User trả về client (bỏ passwordHash)
export type AuthUser = {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  isVerified: boolean;
  createdAt: Date;
};

// Thông tin từ OAuth provider
export type OAuthProfile = {
  providerId: string;
  email: string;
  username: string;
  avatarUrl?: string;
};

// ─── Request schemas ─────────────────────────────────────────

export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, "Username ít nhất 3 ký tự")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username chỉ gồm chữ, số và dấu _"),
  email: z.email("Email không hợp lệ"),
  password: z
    .string()
    .min(8, "Mật khẩu ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Cần ít nhất 1 chữ hoa")
    .regex(/[0-9]/, "Cần ít nhất 1 chữ số"),
});

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const ForgotPasswordSchema = z.object({
  email: z.email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});

// ─── Types ───────────────────────────────────────────────────
// TypeScript tự suy ra type từ schema Zod
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;