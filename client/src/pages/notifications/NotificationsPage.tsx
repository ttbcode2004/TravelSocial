import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useNotificationStore } from "../../stores/notification.store";
import Avatar, { EmptyState, Spinner } from "../../components/ui/Avatar";
import { cn, timeAgo } from "../../utils";
import { Bell, BellOff, Check, Trash2 } from "lucide-react";
import type { Notification } from "../../types";

// ─── Notification type labels & colors ────────────────────────

const TYPE_META: Record<string, { label: string; color: string }> = {
  REACTION:        { label: "đã react bài của bạn",     color: "text-accent" },
  COMMENT:         { label: "đã bình luận bài của bạn", color: "text-primary" },
  COMMENT_REPLY:   { label: "đã trả lời bình luận",     color: "text-primary" },
  POST_SHARE:      { label: "đã chia sẻ bài của bạn",   color: "text-success" },
  FRIEND_REQUEST:  { label: "gửi lời mời kết bạn",      color: "text-warning" },
  FRIEND_ACCEPTED: { label: "đã chấp nhận kết bạn",     color: "text-success" },
  NEW_MESSAGE:     { label: "đã nhắn tin cho bạn",       color: "text-accent" },
  PLAN_INVITE:     { label: "mời bạn vào kế hoạch",      color: "text-warning" },
  PLAN_UPDATE:     { label: "cập nhật kế hoạch",         color: "text-fg-muted" },
  TASK_ASSIGNED:   { label: "giao task cho bạn",          color: "text-danger" },
  TASK_DONE:       { label: "hoàn thành task",            color: "text-success" },
  LOCATION_SAVED:  { label: "lưu địa điểm mới",          color: "text-primary" },
};

function getEntityLink(n: Notification): string | null {
  if (!n.entityId) return null;
  switch (n.entityType) {
    case "POST":       return `/feed#${n.entityId}`;
    case "PLAN":       return `/plans/${n.entityId}`;
    case "MESSAGE":    return `/chat/${n.entityId}`;
    case "FRIENDSHIP": return `/friends`;
    default:           return null;
  }
}

// ─── Single notification row ──────────────────────────────────

function NotifRow({ n }: { n: Notification }) {
  const markAsRead     = useNotificationStore((s) => s.markAsRead);
  const deleteNotif    = useNotificationStore((s) => s.deleteNotification);
  const meta           = TYPE_META[n.type] ?? { label: n.type, color: "text-fg-muted" };
  const link           = getEntityLink(n);
  const preview        = (n.metadata as any)?.preview ?? (n.metadata as any)?.planTitle ?? (n.metadata as any)?.taskTitle;

  const content = (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-xl transition-colors group",
      !n.isRead ? "bg-primary-subtle/40" : "hover:bg-bg-muted"
    )}>
      {/* Actor avatar */}
      <div className="relative flex-shrink-0">
        <Avatar
          src={n.actor?.avatarUrl}
          name={n.actor?.username ?? "System"}
          size="md"
        />
        {!n.isRead && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-bg-elevated" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          {n.actor && (
            <Link
              to={`/profile/${n.actor.username}`}
              className="font-semibold hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {n.actor.username}
            </Link>
          )}
          {" "}
          <span className={cn("font-medium", meta.color)}>{meta.label}</span>
        </p>
        {preview && (
          <p className="text-xs text-fg-muted mt-0.5 line-clamp-1">"{preview}"</p>
        )}
        <p className="text-xs text-fg-subtle mt-1">{timeAgo(n.createdAt)}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {!n.isRead && (
          <button
            className="btn-icon p-1.5 text-primary"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAsRead(n.id); }}
            title="Đánh dấu đã đọc"
          >
            <Check size={14} />
          </button>
        )}
        <button
          className="btn-icon p-1.5 text-danger hover:bg-danger/10"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNotif(n.id); }}
          title="Xoá"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );

  return link ? (
    <Link to={link} className="block" onClick={() => !n.isRead && markAsRead(n.id)}>
      {content}
    </Link>
  ) : (
    <div onClick={() => !n.isRead && markAsRead(n.id)} className="cursor-pointer">
      {content}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function NotificationsPage() {
  const {
    notifications,
    isLoading,
    nextCursor,
    fetchNotifications,
    markAllAsRead,
    clearAll,
    unreadCount,
  } = useNotificationStore();

  const hasNextPage = !!nextCursor;

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Bell size={20} />
            Thông báo
            {unreadCount > 0 && (
              <span className="badge-primary">{unreadCount}</span>
            )}
          </h1>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button className="btn-secondary text-xs py-1.5 px-3 gap-1.5" onClick={markAllAsRead}>
              <Check size={14} />
              Đọc tất cả
            </button>
          )}
          {notifications.length > 0 && (
            <button className="btn-ghost text-xs py-1.5 px-3 gap-1.5 hover:text-danger" onClick={clearAll}>
              <Trash2 size={14} />
              Xoá tất cả
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading && notifications.length === 0 ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<BellOff size={40} />}
          title="Không có thông báo nào"
          description="Khi có hoạt động mới, thông báo sẽ xuất hiện ở đây"
        />
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => <NotifRow key={n.id} n={n} />)}

          {hasNextPage && (
            <div className="flex justify-center pt-3">
              <button
                className="btn-secondary text-sm"
                onClick={() => fetchNotifications()}
                disabled={isLoading}
              >
                {isLoading ? <Spinner className="w-4 h-4" /> : "Xem thêm"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}