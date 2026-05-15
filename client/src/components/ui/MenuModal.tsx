import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "../../utils";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export default function MenuModal({
  open,
  onClose,
  children,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handle);
    }

    return () => {
      document.removeEventListener("mousedown", handle);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute right-0 top-full mt-2 z-50 min-w-55 overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-xl",
        className
      )}
    >
      {children}
    </div>
  );
}