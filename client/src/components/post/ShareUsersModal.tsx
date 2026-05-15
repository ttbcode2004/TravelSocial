// src/components/post/ShareUsersModal.tsx

import { X } from "lucide-react";

interface Props {
  open: boolean;

  onClose: () => void;
}

export default function ShareUsersModal({
  open,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-bg rounded-2xl p-6 w-full max-w-md border border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            Người đã chia sẻ
          </h2>

          <button
            onClick={onClose}
            className="btn-icon"
          >
            <X size={18} />
          </button>
        </div>

        <div className="py-10 text-center text-sm text-fg-muted">
          Chưa implement API shares
        </div>
      </div>
    </div>
  );
}