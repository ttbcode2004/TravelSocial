import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Spinner } from "../../components/ui/Avatar";
import { Mail, KeyRound, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthLoading, useAuthStore } from "../../stores/auth.store";

// ─── Forgot Password ───────────────────────────────────────────

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const isLoading = useAuthLoading();

  const submit = async (e: any) => {
    e.preventDefault();

    const result = await forgotPassword(email);

    if (!result.success) {
      return toast.error(result.message || "Có lỗi xảy ra");
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="card p-8 text-center animate-slide-up">
        <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-success" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Kiểm tra hộp thư của bạn</h2>
        <p className="text-sm text-fg-muted mb-6">
          Nếu email <strong>{email}</strong> tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong vài phút.
        </p>
        <p className="text-xs text-fg-subtle mb-6">Không thấy email? Kiểm tra thư mục spam.</p>
        <Link to="/login" className="btn-primary w-full justify-center">
          Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-8 animate-slide-up">
      <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg mb-5 -ml-1 font-bold">
        <ArrowLeft size={15} /> Quay lại đăng nhập
      </Link>

      <div className="w-12 h-12 rounded-xl bg-primary-subtle flex items-center justify-center mb-4">
        <Mail size={22} className="text-primary" />
      </div>

      <h2 className="text-xl font-semibold mb-1">Quên mật khẩu?</h2>
      <p className="text-sm text-fg-muted mb-6">
        Nhập email đăng ký để nhận link đặt lại mật khẩu.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? <Spinner className="w-4 h-4" /> : "Gửi link đặt lại mật khẩu"}
        </button>
      </form>

      <p className="text-center text-sm text-fg-muted mt-5">
        Nhớ ra mật khẩu?{" "}
        <Link to="/login" className="text-primary hover:underline font-medium">Đăng nhập</Link>
      </p>
    </div>
  );
}

// ─── Reset Password ────────────────────────────────────────────

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);

  const isLoading = useAuthLoading();
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Mật khẩu xác nhận không khớp"); return; }
    
    const result = await resetPassword(token, password);

    if (!result.success) {
      return toast.error(result.message || "Đặt lại mật khẩu thất bại");
    }

    setDone(true);
  };

  if (!token) {
    return (
      <div className="card p-8 text-center animate-slide-up">
        <p className="text-fg-muted mb-4">Link không hợp lệ.</p>
        <Link to="/forgot-password" className="btn-primary">Thử lại</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card p-8 text-center animate-slide-up">
        <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-success" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Đặt lại mật khẩu thành công!</h2>
        <p className="text-sm text-fg-muted mb-6">Bạn có thể đăng nhập với mật khẩu mới.</p>
        <button className="btn-primary w-full" onClick={() => navigate("/login")}>
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return (
    <div className="card p-8 animate-slide-up">
      <div className="w-12 h-12 rounded-sm bg-primary-subtle flex items-center justify-center mb-4">
        <KeyRound size={22} className="text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-1">Đặt lại mật khẩu</h2>
      <p className="text-sm text-fg-muted mb-6">Tạo mật khẩu mới cho tài khoản của bạn.</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Mật khẩu mới</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              className="input pr-10"
              placeholder="Ít nhất 8 ký tự, 1 hoa, 1 số"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoFocus
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
              onClick={() => setShowPw((v) => !v)}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Xác nhận mật khẩu</label>
          <input
            type="password"
            className="input"
            placeholder="Nhập lại mật khẩu mới"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {confirm && password !== confirm && (
            <p className="text-xs text-danger mt-1">Mật khẩu không khớp</p>
          )}
        </div>

        {/* Password strength */}
        <div className="space-y-1">
          {[
            { ok: password.length >= 8,    label: "Ít nhất 8 ký tự" },
            { ok: /[A-Z]/.test(password),  label: "Có chữ hoa" },
            { ok: /[0-9]/.test(password),  label: "Có chữ số" },
          ].map(({ ok, label }) => (
            <div key={label} className={cn("flex items-center gap-1.5 text-sm", ok ? "text-success" : "text-fg-subtle")}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ok ? "currentColor" : undefined, border: ok ? undefined : "1.5px solid currentColor" }} />
              {label}
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={isLoading || password !== confirm || password.length < 8}
        >
          {isLoading ? <Spinner className="w-4 h-4" /> : "Đặt lại mật khẩu"}
        </button>
      </form>
    </div>
  );
}

// cn helper inline
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}