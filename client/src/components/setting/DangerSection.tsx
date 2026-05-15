// components/settings/DangerSection.tsx
import { useState } from "react";
import { useAuthStore } from "../../stores/auth.store";
import { useNavigate } from "react-router-dom";
import { LogOut, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";

export default function DangerSection() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== user?.username) return;

    try {
      await api.delete("/users/me");
      await logout();
      navigate("/login");
      toast.success("Tài khoản đã được xóa");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không thể xóa tài khoản");
    }
  };

  return (
    <div className="space-y-6">
      {/* Logout */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="font-medium">Đăng xuất</p>
          <p className="text-sm text-fg-muted">Đăng xuất khỏi thiết bị hiện tại</p>
        </div>
        <button onClick={handleLogout} className="btn-secondary gap-2">
          <LogOut size={18} /> Đăng xuất
        </button>
      </div>

      {/* Delete Account */}
      <div className="card p-5 border-danger/30 bg-danger/5">
        <p className="font-medium text-danger mb-1">Xóa tài khoản vĩnh viễn</p>
        <p className="text-sm text-fg-muted mb-4">
          Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa.
        </p>

        {!confirmDelete ? (
          <button
            className="btn-danger"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={16} className="mr-2" />
            Tôi muốn xóa tài khoản
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">
              Nhập <strong>{user?.username}</strong> để xác nhận xóa:
            </p>
            <input
              className="input"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={user?.username}
            />
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setConfirmDelete(false)}>
                Hủy
              </button>
              <button
                className="btn-danger flex-1"
                disabled={deleteInput !== user?.username}
                onClick={handleDeleteAccount}
              >
                Xác nhận xóa tài khoản
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}