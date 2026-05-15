// components/settings/PasswordSection.tsx
import { useState } from "react";
import { useAuthStore } from "../../stores/auth.store";
import { api } from "../../lib/api";
import { Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { Spinner } from "../ui/Avatar";

export default function PasswordSection() {
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
  });

  const [saving, setSaving] = useState(false);

  // Nếu user đăng nhập bằng Google/Facebook/... thì không cho đổi mật khẩu
  if (user?.provider !== "local") {
    return (
      <div className="card p-8 text-center">
        <Lock size={40} className="mx-auto text-fg-subtle mb-4" />
        <h3 className="font-medium text-lg">Không thể đổi mật khẩu</h3>
        <p className="text-fg-muted mt-2">
          Tài khoản của bạn được đăng nhập qua <strong>{user?.provider}</strong>.<br />
          Không có mật khẩu riêng để thay đổi.
        </p>
      </div>
    );
  }

  const handleChange = (field: keyof typeof form) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

  const toggleShow = (field: "current" | "new") => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (form.newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }

    setSaving(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      toast.success("Đổi mật khẩu thành công!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Đổi mật khẩu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1.5">Mật khẩu hiện tại</label>
        <div className="relative">
          <input
            type={showPassword.current ? "text" : "password"}
            className="input pr-10"
            value={form.currentPassword}
            onChange={handleChange("currentPassword")}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
            onClick={() => toggleShow("current")}
          >
            {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Mật khẩu mới</label>
        <div className="relative">
          <input
            type={showPassword.new ? "text" : "password"}
            className="input pr-10"
            value={form.newPassword}
            onChange={handleChange("newPassword")}
            required
            minLength={8}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
            onClick={() => toggleShow("new")}
          >
            {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <p className="text-xs text-fg-subtle mt-1">
          Ít nhất 8 ký tự (nên có chữ hoa, chữ thường và số)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Xác nhận mật khẩu mới</label>
        <input
          type="password"
          className="input"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          required
        />
      </div>

      <button
        type="submit"
        className="btn-primary w-full flex items-center justify-center gap-2"
        disabled={saving}
      >
        {saving ? <Spinner className="w-4 h-4" /> : <Lock size={18} />}
        {saving ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
      </button>
    </form>
  );
}