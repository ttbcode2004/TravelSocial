import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";

// ─── Class name helper ────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date helpers ─────────────────────────────────────────────
export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
}

export function formatMessageTime(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return `Hôm qua ${format(d, "HH:mm")}`;
  return format(d, "dd/MM/yyyy HH:mm");
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy");
}

// ─── Number helpers ───────────────────────────────────────────
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatCurrency(amount: number, currency = "VND"): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(amount);
}

// ─── String helpers ───────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "…" : str;
}

// ─── Conversation helpers ─────────────────────────────────────
export function getConversationName(
  conv: { type: string; name: string | null; members: Array<{ user: { username: string } }> },
  myId: string
): string {
  if (conv.type === "GROUP") return conv.name ?? "Nhóm chat";
  const other = conv.members.find((m) => m.user.username !== myId);
  return other?.user.username ?? "Cuộc trò chuyện";
}

// ─── Reaction emoji map ───────────────────────────────────────
export const REACTION_EMOJI: Record<string, string> = {
  LIKE: "👍", LOVE: "❤️", HAHA: "😂", WOW: "😮", SAD: "😢", ANGRY: "😡",
};

// ─── Task priority colors ─────────────────────────────────────
export const PRIORITY_COLOR: Record<string, string> = {
  LOW: "text-fg-subtle",
  MEDIUM: "text-warning",
  HIGH: "text-danger",
  URGENT: "text-danger font-semibold",
};

export const STATUS_COLOR: Record<string, string> = {
  TODO: "badge-muted",
  IN_PROGRESS: "badge-primary",
  DONE: "badge-success",
  CANCELLED: "badge bg-bg-muted text-fg-subtle line-through",
};