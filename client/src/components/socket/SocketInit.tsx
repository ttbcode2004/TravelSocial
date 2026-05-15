// components/SocketInit.tsx
import { useEffect, useRef } from "react";
import { useAuthStore } from "../../stores/auth.store";
import { useNotificationStore } from "../../stores/notification.store";
import { useConversationStore } from "../../stores/conversation.store";
import { usePresenceStore } from "../../stores/presence.store";

export default function SocketInit() {
  const userId = useAuthStore((s) => s.user?.id);

  const initNotif = useNotificationStore((s) => s.initSocketListeners);
  const initConv = useConversationStore((s) => s.initSocketListeners);
  const initPresence = usePresenceStore((s) => s.initSocketListeners);

  const fetchNotifUnread = useNotificationStore((s) => s.fetchUnreadCount);
  const fetchConvUnread = useConversationStore((s) => s.fetchUnreadCount);

  const setupRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setupRef.current = null;
      return;
    }

    // Tránh setup nhiều lần với cùng user
    if (setupRef.current === userId) return;
    setupRef.current = userId;

    const cleanupNotif = initNotif();
    const cleanupConv = initConv();
    const cleanupPresence = initPresence();

    // Fetch initial unread count
    fetchNotifUnread();
    fetchConvUnread();

    return () => {
      cleanupNotif();
      cleanupConv();
      cleanupPresence();
      setupRef.current = null;
    };
  }, [userId, initNotif, initConv, initPresence, fetchNotifUnread, fetchConvUnread]);

  return null;
}