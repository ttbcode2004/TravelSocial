// pages/FriendsPage.tsx
import { useState } from "react";
import { UserPlus, Users, Sparkles } from "lucide-react";
import { cn } from "../../utils";
import ReceivedRequestsTab from "../../components/friend/ReceivedRequestsTab";
import FriendsTab from "../../components/friend/FriendsTab";
import SuggestionsTab from "../../components/friend/SuggestionsTab";

type Tab = "requests" | "friends" | "suggestions";

const TABS = [
  { id: "requests" as Tab, label: "Lời mời", icon: UserPlus },
  { id: "friends" as Tab, label: "Bạn bè", icon: Users },
  { id: "suggestions" as Tab, label: "Gợi ý", icon: Sparkles },
];

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("friends");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Bạn bè</h1>

      {/* Tab Navigation */}
      <div className="flex bg-bg-muted p-1 rounded-2xl mb-8">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-xl transition-all",
              activeTab === id
                ? "bg-bg-elevated shadow-sm text-fg"
                : "text-fg-muted hover:text-fg hover:bg-bg-elevated/50"
            )}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "requests" && <ReceivedRequestsTab />}
      {activeTab === "friends" && <FriendsTab />}
      {activeTab === "suggestions" && <SuggestionsTab />}
    </div>
  );
}