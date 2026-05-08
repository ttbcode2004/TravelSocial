/**
 * In-memory presence tracker.
 * Mỗi userId → Set của socketId đang kết nối.
 * Dùng Map để O(1) lookup.
 *
 * Scale note: Đối với production multi-instance, thay bằng Redis adapter.
 */

interface PresenceEntry {
  socketIds: Set<string>;
  lastSeenAt: Date;
}

const presence = new Map<string, PresenceEntry>();

// ─── Public API ───────────────────────────────────────────────

export function userConnected(userId: string, socketId: string): boolean {
  const entry = presence.get(userId);
  const wasOffline = !entry || entry.socketIds.size === 0;

  if (entry) {
    entry.socketIds.add(socketId);
  } else {
    presence.set(userId, { socketIds: new Set([socketId]), lastSeenAt: new Date() });
  }

  return wasOffline; // true nếu đây là kết nối đầu tiên (vừa online)
}

export function userDisconnected(userId: string, socketId: string): boolean {
  const entry = presence.get(userId);
  if (!entry) return false;

  entry.socketIds.delete(socketId);
  entry.lastSeenAt = new Date();

  const isNowOffline = entry.socketIds.size === 0;
  return isNowOffline; // true nếu không còn socket nào → vừa offline
}

export function isOnline(userId: string): boolean {
  const entry = presence.get(userId);
  return !!entry && entry.socketIds.size > 0;
}

export function getLastSeen(userId: string): Date | null {
  return presence.get(userId)?.lastSeenAt ?? null;
}

export function getOnlineUsers(userIds: string[]): string[] {
  return userIds.filter((id) => isOnline(id));
}

export function getPresenceMap(userIds: string[]): Record<string, { online: boolean; lastSeenAt: Date | null }> {
  return Object.fromEntries(
    userIds.map((id) => [
      id,
      { online: isOnline(id), lastSeenAt: getLastSeen(id) },
    ])
  );
}