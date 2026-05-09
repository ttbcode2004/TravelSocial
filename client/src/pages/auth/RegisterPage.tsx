import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";
import { Spinner } from "../../components/ui/Avatar";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { message } = await register(form.username, form.email, form.password);
      toast.success(message);
      navigate("/login");
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.[0]?.message
        ?? err?.response?.data?.message
        ?? "Đăng ký thất bại";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 animate-slide-up">
      <h2 className="text-xl font-semibold mb-1">Tạo tài khoản</h2>
      <p className="text-sm text-fg-muted mb-6">Tham gia cộng đồng travel social</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Tên người dùng</label>
          <input className="input" placeholder="travel_lover" value={form.username} onChange={set("username")} required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]+" />
          <p className="text-xs text-fg-subtle mt-1">Chỉ gồm chữ, số và dấu _</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Mật khẩu</label>
          <input type="password" className="input" placeholder="Ít nhất 8 ký tự, 1 hoa, 1 số" value={form.password} onChange={set("password")} required minLength={8} />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Spinner className="w-4 h-4" /> : "Đăng ký"}
        </button>
      </form>

      <p className="text-center text-sm text-fg-muted mt-6">
        Đã có tài khoản?{" "}
        <Link to="/login" className="text-primary hover:underline font-medium">Đăng nhập</Link>
      </p>
    </div>
  );
}