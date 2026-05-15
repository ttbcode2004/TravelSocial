import { MessageCircle } from "lucide-react";

import { EmptyState } from "../ui/Avatar";

export default function EmptyChat() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <EmptyState
        icon={<MessageCircle size={48} />}
        title="Chọn một cuộc trò chuyện"
        description="Hoặc bắt đầu nhắn tin với ai đó"
      />
    </div>
  );
}