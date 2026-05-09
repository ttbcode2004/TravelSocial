import { cn, getInitials } from "../../utils";

// ─── Avatar ───────────────────────────────────────────────────

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  online?: boolean;
}

const SIZE = { xs: "w-6 h-6 text-xs", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base", xl: "w-20 h-20 text-xl" };

export default function Avatar({ src, name, size = "md", className, online }: AvatarProps) {
  return (
    <div className={cn("relative flex-shrink-0 inline-flex", className)}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn("avatar", SIZE[size])}
        />
      ) : (
        <div className={cn("avatar bg-primary-subtle text-primary font-medium flex items-center justify-center", SIZE[size])}>
          {getInitials(name)}
        </div>
      )}
      {online !== undefined && (
        <span className={cn(
          "absolute bottom-0 right-0 rounded-full border-2 border-bg-elevated",
          size === "xs" || size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5",
          online ? "bg-success" : "bg-fg-subtle"
        )} />
      )}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin text-primary", className ?? "w-5 h-5")}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ─── PageLoader ───────────────────────────────────────────────

export function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="w-8 h-8" />
        <p className="text-sm text-fg-muted">Đang tải...</p>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────

interface EmptyProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="text-fg-subtle mb-4">{icon}</div>}
      <h3 className="text-base font-medium text-fg">{title}</h3>
      {description && <p className="text-sm text-fg-muted mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────

export function SkeletonPost() {
  return (
    <div className="card p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <div className="skeleton h-3 w-28 rounded" />
          <div className="skeleton h-2.5 w-20 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
      </div>
      <div className="skeleton h-40 w-full rounded-lg" />
    </div>
  );
}