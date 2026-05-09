import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useUser } from "../../stores/auth.store";
import Avatar, { EmptyState, Spinner, SkeletonPost } from "../../components/ui/Avatar";
import { cn, timeAgo } from "../../utils";
import { UserPlus, UserCheck, UserX, Users, Sparkles, Search } from "lucide-react";
import toast from "react-hot-toast";
import type { UserPreview } from "../../types";

type Tab = "requests" | "friends" | "suggestions";

// ─── User card ────────────────────────────────────────────────

function UserCard({
  user,
  badge,
  actions,
}: {
  user: UserPreview;
  badge?: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <Link to={`/profile/${user.username}`}>
        <Avatar src={user.avatarUrl} name={user.username} size="md" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${user.username}`} className="font-medium text-sm hover:text-primary transition-colors">
          {user.username}
        </Link>
        {user.isVerified && <span className="text-primary text-xs ml-1">✓</span>}
        {badge && <div className="mt-0.5">{badge}</div>}
      </div>
      <div className="flex gap-2 flex-shrink-0">{actions}</div>
    </div>
  );
}

// ─── Received requests tab ────────────────────────────────────

function ReceivedRequestsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["friend-requests-received"],
    queryFn: () => api.get("/friends/requests/received").then((r) => r.data),
  });

  const accept = useMutation({
    mutationFn: (friendshipId: string) =>
      api.patch(`/friends/requests/${friendshipId}/accept`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friend-requests-received"] });
      qc.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Đã chấp nhận kết bạn!");
    },
  });

  const decline = useMutation({
    mutationFn: (friendshipId: string) =>
      api.patch(`/friends/requests/${friendshipId}/decline`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friend-requests-received"] });
      toast.success("Đã từ chối");
    },
  });

  if (isLoading) return <Spinner className="mx-auto mt-8" />;
  const items = data?.items ?? [];

  if (items.length === 0)
    return <EmptyState icon={<UserPlus size={36} />} title="Không có lời mời nào" description="Bạn chưa nhận được lời mời kết bạn mới" />;

  return (
    <div className="space-y-3">
      {items.map((item: any) => (
        <UserCard
          key={item.id}
          user={item.requester}
          badge={<span className="text-xs text-fg-muted">{timeAgo(item.createdAt)}</span>}
          actions={
            <>
              <button
                className="btn-primary text-xs py-1.5 px-3"
                onClick={() => accept.mutate(item.id)}
                disabled={accept.isPending}
              >
                <UserCheck size={14} /> Chấp nhận
              </button>
              <button
                className="btn-secondary text-xs py-1.5 px-3"
                onClick={() => decline.mutate(item.id)}
                disabled={decline.isPending}
              >
                <UserX size={14} /> Từ chối
              </button>
            </>
          }
        />
      ))}
    </div>
  );
}

// ─── Friends list tab ─────────────────────────────────────────

function FriendsTab() {
  const [q, setQ] = useState("");
  const me = useUser();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["friends", q],
    queryFn: () => api.get("/friends", { params: { q: q || undefined, limit: 50 } }).then((r) => r.data),
  });

  const unfriend = useMutation({
    mutationFn: (userId: string) => api.delete(`/friends/${userId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["friends"] }); toast.success("Đã huỷ kết bạn"); },
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
        <input
          className="input pl-9"
          placeholder="Tìm bạn bè..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Spinner className="mx-auto mt-8" />
      ) : items.length === 0 ? (
        <EmptyState icon={<Users size={36} />} title={q ? "Không tìm thấy" : "Chưa có bạn bè"} />
      ) : (
        <div className="space-y-2">
          {items.map((user: UserPreview) => (
            <UserCard
              key={user.id}
              user={user}
              actions={
                <button
                  className="btn-ghost text-xs py-1.5 px-3 hover:text-danger"
                  onClick={() => unfriend.mutate(user.id)}
                  disabled={unfriend.isPending}
                >
                  <UserX size={14} /> Huỷ kết bạn
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Suggestions tab ──────────────────────────────────────────

function SuggestionsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["friend-suggestions"],
    queryFn: () => api.get("/friends/suggestions", { params: { limit: 20 } }).then((r) => r.data),
  });

  const addFriend = useMutation({
    mutationFn: (userId: string) => api.post(`/friends/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friend-suggestions"] });
      toast.success("Đã gửi lời mời kết bạn!");
    },
  });

  if (isLoading) return <Spinner className="mx-auto mt-8" />;
  const items = data?.items ?? [];

  if (items.length === 0)
    return <EmptyState icon={<Sparkles size={36} />} title="Không có gợi ý" description="Hãy kết bạn thêm để có gợi ý" />;

  return (
    <div className="space-y-2">
      {items.map((user: UserPreview & { mutualFriendsCount: number }) => (
        <UserCard
          key={user.id}
          user={user}
          badge={
            user.mutualFriendsCount > 0 ? (
              <span className="text-xs text-fg-muted">
                {user.mutualFriendsCount} bạn chung
              </span>
            ) : undefined
          }
          actions={
            <button
              className="btn-primary text-xs py-1.5 px-3"
              onClick={() => addFriend.mutate(user.id)}
              disabled={addFriend.isPending}
            >
              <UserPlus size={14} /> Kết bạn
            </button>
          }
        />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>("requests");

  const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "requests",    label: "Lời mời",   icon: UserPlus },
    { id: "friends",     label: "Bạn bè",    icon: Users },
    { id: "suggestions", label: "Gợi ý",     icon: Sparkles },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-5">Bạn bè</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-muted p-1 rounded-xl mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-lg transition-all",
              tab === id
                ? "bg-bg-elevated text-fg font-medium shadow-card"
                : "text-fg-muted hover:text-fg"
            )}
            onClick={() => setTab(id)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "requests"    && <ReceivedRequestsTab />}
      {tab === "friends"     && <FriendsTab />}
      {tab === "suggestions" && <SuggestionsTab />}
    </div>
  );
}