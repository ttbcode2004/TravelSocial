// components/ui/MenuItem.tsx

import type { ReactNode } from "react";
import { cn } from "../../utils";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

export default function MenuItem({
  children,
  onClick,
  danger,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-4 py-3 text-left text-sm transition-colors hover:bg-bg-muted",
        danger && "text-danger hover:bg-danger/10"
      )}
    >
      {children}
    </button>
  );
}