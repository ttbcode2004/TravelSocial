// components/ui/Modal.tsx

import { createPortal } from "react-dom";
import { X, TriangleAlert } from "lucide-react";
import { useEffect } from "react";

import type { ReactNode } from "react";
import { cn } from "../../utils";

interface ModalProps {
  children: ReactNode;
  onClose: () => void;

  open?: boolean;

  title?: string;
  description?: string;

  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_STYLE = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function Modal({
  children,
  onClose,
  open = true,
  title,
  description,
  className,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEsc);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in" />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative z-10 w-full rounded-2xl border border-border bg-bg-elevated shadow-xl animate-in zoom-in-95",
          SIZE_STYLE[size],
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              {title && (
                <h2 className="text-lg font-semibold">
                  {title}
                </h2>
              )}

              {description && (
                <p className="mt-1 text-sm text-fg-muted">
                  {description}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1 transition-colors hover:bg-bg-muted"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────
// Confirm Modal
// ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  open: boolean;

  onClose: () => void;
  onConfirm: () => void | Promise<void>;

  title?: string;
  description?: string;

  confirmLabel?: string;
  cancelLabel?: string;

  danger?: boolean;
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,

  title = "Xác nhận",
  description,

  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",

  danger = true,
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      className="overflow-hidden"
    >
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div
          className={cn(
            "mb-4 flex h-14 w-14 items-center justify-center rounded-full",
            danger
              ? "bg-danger/10 text-danger"
              : "bg-primary/10 text-primary"
          )}
        >
          <TriangleAlert size={26} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="mt-2 text-sm text-fg-muted">
            {description}
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1",
              danger
                ? "btn-danger"
                : "btn-primary"
            )}
          >
            {loading
              ? "Đang xử lý..."
              : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}