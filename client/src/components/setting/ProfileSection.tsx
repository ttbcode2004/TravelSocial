import { useState } from "react";
import { useAuthStore } from "../../stores/auth.store";
import { api } from "../../lib/api";
import Avatar, { Spinner } from "../ui/Avatar";
import { Save } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [form, setForm] = useState({
    bio: user?.bio ?? "",
    avatarUrl: user?.avatarUrl ?? "",
    coverUrl: (user as any)?.coverUrl ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch("/users/me", form);
      updateUser(res.data.data);
      toast.success("Đã lưu thay đổi hồ sơ!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar src={form.avatarUrl} name={user?.username || ""} size="xl" />
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Ảnh đại diện (URL)</label>
          <input className="input" value={form.avatarUrl} onChange={handleChange("avatarUrl")} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Giới thiệu</label>
        <textarea
          className="input min-h-[100px] resize-y"
          value={form.bio}
          onChange={handleChange("bio")}
          maxLength={500}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ảnh bìa (URL)</label>
        <input className="input" value={form.coverUrl} onChange={handleChange("coverUrl")} />
      </div>

      <button type="submit" className="btn-primary gap-2" disabled={saving}>
        {saving ? <Spinner className="w-4 h-4" /> : <Save size={16} />}
        Lưu thay đổi
      </button>
    </form>
  );
}