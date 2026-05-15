// components/friends/SuggestionsTab.tsx
import { useEffect } from "react";
import { useFriendStore } from "../../stores/friend.store";
import UserCard from "./UserCard";
import { Spinner, EmptyState } from "../ui/Avatar";
import { Sparkles, UserPlus } from "lucide-react";

export default function SuggestionsTab() {
  const { suggestions, isLoadingSuggestions, fetchSuggestions, sendRequest } =
    useFriendStore();

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  if (isLoadingSuggestions && suggestions.length === 0) {
    return <Spinner className="mx-auto mt-12" />;
  }

  if (suggestions.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles size={40} />}
        title="Chưa có gợi ý"
        description="Hãy kết bạn nhiều hơn để có gợi ý tốt hơn"
      />
    );
  }

  return (
    <div className="space-y-2">
      {suggestions.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          badge={
            user.mutualFriendsCount && user.mutualFriendsCount > 0
              ? `${user.mutualFriendsCount} bạn chung`
              : undefined
          }
          actions={
            <button
              className="btn-primary text-sm px-5"
              onClick={() => sendRequest(user.id)}
            >
              <UserPlus size={16} className="mr-1" />
              Kết bạn
            </button>
          }
        />
      ))}
    </div>
  );
}