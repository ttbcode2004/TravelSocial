import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";

// Register
//    ↓
// generate verify token
//    ↓
// sendVerificationEmail()
//    ↓
// Nodemailer
//    ↓
// SMTP server
//    ↓
// User inbox

// biến global để không tạo lại nhiều lần
let transporter: Transporter;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

// ─── Templates ───────────────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  username: string,
  token: string
): Promise<void> {
  const link = `${env.CLIENT_URL}/auth/verify-email?token=${token}`;

  await getTransporter().sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: "Xác nhận email của bạn — Travel Social",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Xin chào ${username}! 👋</h2>
        <p>Cảm ơn bạn đã đăng ký. Nhấn vào nút bên dưới để xác nhận email:</p>
        <a href="${link}"
          style="display:inline-block;padding:12px 24px;background:#4f46e5;
                 color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Xác nhận email
        </a>
        <p style="color:#666;font-size:13px;margin-top:16px">
          Link có hiệu lực trong 24 giờ. Nếu bạn không đăng ký, hãy bỏ qua email này.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  username: string,
  token: string
): Promise<void> {
  const link = `${env.CLIENT_URL}/auth/reset-password?token=${token}`;

  await getTransporter().sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: "Đặt lại mật khẩu — Travel Social",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Xin chào ${username}!</h2>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu của bạn.</p>
        <a href="${link}"
          style="display:inline-block;padding:12px 24px;background:#ef4444;
                 color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Đặt lại mật khẩu
        </a>
        <p style="color:#666;font-size:13px;margin-top:16px">
          Link có hiệu lực trong 24 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.
        </p>
      </div>
    `,
  });
}