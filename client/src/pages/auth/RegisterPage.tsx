import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthLoading, useAuthStore } from "../../stores/auth.store";
import { Spinner } from "../../components/ui/Avatar";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const isLoading = useAuthLoading();
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const result = await register(form.username, form.email, form.password);

    if (!result.success) {
      return toast.error(result.message || "Đăng ký thất bại");
    }

    toast.success("Đăng ký thành công");
    navigate("/login");
  };

  return (
    <div className="card p-8 animate-slide-up">
      <h2 className="text-xl font-semibold mb-1">Tạo tài khoản</h2>
      <p className="text-sm text-fg-muted mb-6">
        Tham gia cộng đồng travel social
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Tên người dùng
          </label>
          <input
            className="input"
            placeholder="travel_lover"
            value={form.username}
            onChange={set("username")}
            required
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_]+"
          />
          <p className="text-xs text-fg-subtle mt-1">
            Chỉ gồm chữ, số và dấu _
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            value={form.email}
            onChange={set("email")}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Mật khẩu</label>
          <div className="relative">
            <input
              name="password"
              type={showPw ? "text" : "password"}
              className="input"
              placeholder="Ít nhất 8 ký tự, 1 hoa, 1 số"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? <Spinner className="w-4 h-4" /> : "Đăng ký"}
        </button>
      </form>

      <p className="text-center text-sm text-fg-muted mt-6">
        Đã có tài khoản?{" "}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
