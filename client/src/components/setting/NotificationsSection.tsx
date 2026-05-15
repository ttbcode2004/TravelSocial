// components/settings/NotificationsSection.tsx
import { useEffect } from "react";
import { useNotificationSettingsStore } from "../../stores/notificationSettings.store";
import { Spinner } from "../ui/Avatar";

const NOTIF_GROUPS = [
  { label: "Mạng xã hội", types: ["REACTION", "COMMENT", "COMMENT_REPLY", "POST_SHARE"] as const },
  { label: "Bạn bè",      types: ["FRIEND_REQUEST", "FRIEND_ACCEPTED"] as const },
  { label: "Tin nhắn",    types: ["NEW_MESSAGE"] as const },
  { label: "Kế hoạch",    types: ["PLAN_INVITE", "PLAN_UPDATE", "TASK_ASSIGNED", "TASK_DONE"] as const },
  { label: "Bản đồ",      types: ["LOCATION_SAVED"] as const },
];

const NOTIF_LABEL: Record<string, string> = {
  REACTION: "Lượt react", COMMENT: "Bình luận", COMMENT_REPLY: "Trả lời bình luận",
  POST_SHARE: "Chia sẻ bài", FRIEND_REQUEST: "Lời mời kết bạn",
  FRIEND_ACCEPTED: "Chấp nhận kết bạn", NEW_MESSAGE: "Tin nhắn mới",
  PLAN_INVITE: "Mời vào kế hoạch", PLAN_UPDATE: "Cập nhật kế hoạch",
  TASK_ASSIGNED: "Giao task", TASK_DONE: "Hoàn thành task", LOCATION_SAVED: "Địa điểm mới",
};

export default function NotificationsSection() {
  const { settings, isLoading, fetchSettings, updateSetting } = useNotificationSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (isLoading && settings.length === 0) {
    return <Spinner className="mx-auto mt-12" />;
  }

  return (
    <div className="space-y-8">
      {NOTIF_GROUPS.map(({ label, types }) => (
        <div key={label}>
          <h3 className="text-sm font-semibold text-fg-subtle uppercase tracking-widest mb-4">
            {label}
          </h3>
          <div className="space-y-1">
            {types.map((type) => {
              const setting = settings.find((s) => s.type === type) || {
                type,
                inApp: true,
                push: true,
                email: false,
              };

              return (
                <div
                  key={type}
                  className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-bg-muted transition-colors"
                >
                  <span className="text-sm">{NOTIF_LABEL[type]}</span>
                  <div className="flex items-center gap-6">
                    {(["inApp", "push", "email"] as const).map((field) => (
                      <label key={field} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!setting[field]}
                          onChange={(e) => updateSetting(type, field, e.target.checked)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-xs text-fg-muted capitalize">
                          {field === "inApp" ? "Trong app" : field}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}