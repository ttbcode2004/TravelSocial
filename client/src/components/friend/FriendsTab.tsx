// components/friends/FriendsTab.tsx
import { useState, useEffect } from "react";
import { useFriendStore } from "../../stores/friend.store";
import UserCard from "./UserCard";
import { Spinner, EmptyState } from "../ui/Avatar";
import { Search, Users } from "lucide-react";

export default function FriendsTab() {
  const [search, setSearch] = useState("");
  const { friends, isLoadingFriends, fetchFriends, unfriend } = useFriendStore();

  useEffect(() => {
    fetchFriends(true, { q: search });
  }, [fetchFriends, search]);

  if (isLoadingFriends && friends.length === 0) {
    return <Spinner className="mx-auto mt-12" />;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
        <input
          className="input pl-10"
          placeholder="Tìm kiếm bạn bè..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {friends.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title={search ? "Không tìm thấy" : "Chưa có bạn bè"}
          description={search ? "" : "Hãy kết bạn để bắt đầu"}
        />
      ) : (
        <div className="space-y-2">
          {friends.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              actions={
                <button
                  className="btn-ghost text-sm px-4 hover:text-danger"
                  onClick={() => unfriend(user.id)}
                >
                  Huỷ kết bạn
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}