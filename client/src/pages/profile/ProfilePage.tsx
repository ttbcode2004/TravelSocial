import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useUser } from "../../stores/auth.store";
import Avatar, { EmptyState, Spinner, SkeletonPost } from "../../components/ui/Avatar";
import PostCard from "../../components/post/PostCard";
import { cn, formatDate } from "../../utils";
import { UserPlus, UserCheck, UserMinus, MessageCircle, MapPin, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import type { Post, FriendshipView } from "../../types";

// ─── Friend action button ─────────────────────────────────────

function FriendButton({ userId, status, friendshipId }: {
  userId: string;
  status: FriendshipView;
  friendshipId: string | null;
}) {
  const qc = useQueryClient();

  const sendRequest = useMutation({
    mutationFn: () => api.post(`/friends/${userId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["friendship-status", userId] }); toast.success("Đã gửi lời mời!"); },
  });

  const cancelRequest = useMutation({
    mutationFn: () => api.delete(`/friends/requests/${friendshipId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["friendship-status", userId] }); toast.success("Đã huỷ lời mời"); },
  });

  const acceptRequest = useMutation({
    mutationFn: () => api.patch(`/friends/requests/${friendshipId}/accept`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["friendship-status", userId] }); toast.success("Đã chấp nhận kết bạn!"); },
  });

  const unfriend = useMutation({
    mutationFn: () => api.delete(`/friends/${userId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["friendship-status", userId] }); toast.success("Đã huỷ kết bạn"); },
  });

  if (status === "ACCEPTED") return (
    <button className="btn-secondary gap-2" onClick={() => unfriend.mutate()}>
      <UserCheck size={16} /> Bạn bè
    </button>
  );

  if (status === "PENDING_SENT") return (
    <button className="btn-secondary gap-2" onClick={() => cancelRequest.mutate()}>
      <UserMinus size={16} /> Huỷ lời mời
    </button>
  );

  if (status === "PENDING_RECEIVED") return (
    <button className="btn-primary gap-2" onClick={() => acceptRequest.mutate()}>
      <UserCheck size={16} /> Chấp nhận
    </button>
  );

  return (
    <button className="btn-primary gap-2" onClick={() => sendRequest.mutate()} disabled={sendRequest.isPending}>
      <UserPlus size={16} /> Kết bạn
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const me = useUser();
  const isOwnProfile = me?.username === username;

  // Fetch user profile
  const { data: profileUser, isLoading: loadingUser } = useQuery({
    queryKey: ["user-profile", username],
    queryFn: () =>
      api.get(`/users/${username}`).then((r) => r.data.data).catch(() => null),
  });

  // Friendship status
  const { data: friendStatus } = useQuery({
    queryKey: ["friendship-status", profileUser?.id],
    queryFn: () =>
      api.get(`/friends/${profileUser!.id}/status`).then((r) => r.data.data),
    enabled: !!profileUser && !isOwnProfile,
  });

  // Posts
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: loadingPosts } = useInfiniteQuery({
    queryKey: ["user-posts", profileUser?.id],
    queryFn: async ({ pageParam }) => {
      const res = await api.get(`/posts/user/${profileUser!.id}`, {
        params: { cursor: pageParam, limit: 20 },
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: any) => last.nextCursor ?? undefined,
    enabled: !!profileUser,
  });

  const posts: Post[] = data?.pages.flatMap((p: any) => p.items) ?? [];

  if (loadingUser) return <div className="flex justify-center py-20"><Spinner /></div>;

  // Fallback if user not found via API — show basic from auth
  const user = profileUser ?? (isOwnProfile ? me : null);
  if (!user) return (
    <div className="flex justify-center py-20">
      <EmptyState icon={<UserPlus size={40} />} title="Người dùng không tồn tại" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Cover */}
      <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 relative rounded-b-2xl overflow-hidden">
        {(user as any).coverUrl && (
          <img src={(user as any).coverUrl} className="w-full h-full object-cover" alt="cover" />
        )}
      </div>

      {/* Profile info */}
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between -mt-12 mb-4">
          <Avatar
            src={user.avatarUrl}
            name={user.username}
            size="xl"
            className="ring-4 ring-bg"
          />
          <div className="flex gap-2 pb-1">
            {!isOwnProfile && profileUser && (
              <>
                <FriendButton
                  userId={profileUser.id}
                  status={friendStatus?.status ?? "NONE"}
                  friendshipId={friendStatus?.friendshipId ?? null}
                />
                <button className="btn-secondary gap-2">
                  <MessageCircle size={16} /> Nhắn tin
                </button>
              </>
            )}
            {isOwnProfile && (
              <button className="btn-secondary">Chỉnh sửa hồ sơ</button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{user.username}</h1>
            {user.isVerified && <span className="text-primary font-bold">✓</span>}
          </div>
          {(user as any).bio && (
            <p className="text-sm text-fg-muted mt-1">{(user as any).bio}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-fg-subtle">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> Tham gia {formatDate(user.createdAt)}
            </span>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4 mt-5">
          <h2 className="font-semibold text-sm text-fg-muted uppercase tracking-wide">Bài viết</h2>
          {loadingPosts ? (
            Array.from({ length: 2 }).map((_, i) => <SkeletonPost key={i} />)
          ) : posts.length === 0 ? (
            <EmptyState icon={<MapPin size={36} />} title="Chưa có bài viết nào" />
          ) : (
            <>
              {posts.map((post) => <PostCard key={post.id} post={post} />)}
              {hasNextPage && (
                <div className="flex justify-center">
                  <button className="btn-secondary" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                    {isFetchingNextPage ? <Spinner className="w-4 h-4" /> : "Xem thêm"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}