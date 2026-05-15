// pages/ProfilePage.tsx
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProfileStore } from "../../stores/user.store";
import { useFriendStore } from "../../stores/friend.store";
import { useAuthStore } from "../../stores/auth.store";
import { useConversationStore } from "../../stores/conversation.store"; // nếu có

import ProfileHeader from "../../components/profile/ProfileHeader";
import FriendButton from "../../components/profile/FriendButton";
import PostCard from "../../components/post/PostCard";

import { Spinner, EmptyState } from "../../components/ui/Avatar";
import { MessageCircle } from "lucide-react";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const currentUser = useAuthStore((s) => s.user);

  const isOwnProfile = currentUser?.username === username;

  const {
    profileUser,
    isLoadingProfile,
    friendshipStatus,
    posts,
    isLoadingPosts,
    isFetchingMore,
    hasMorePosts,
    fetchProfile,
    fetchFriendshipStatus,
    fetchPosts,
    fetchMorePosts,
  } = useProfileStore();

  const { createPrivateConversation } = useConversationStore(); // nếu bạn có

  // Fetch data
  useEffect(() => {
    if (!username) return;
    useProfileStore.getState().reset();
    fetchProfile(username);
  }, [username, fetchProfile]);

  useEffect(() => {
    if (profileUser?.id && !isOwnProfile) {
      fetchFriendshipStatus(profileUser.id);
    }
  }, [profileUser?.id, isOwnProfile, fetchFriendshipStatus]);

  useEffect(() => {
    if (profileUser?.id) {
      fetchPosts(profileUser.id, true);
    }
  }, [profileUser?.id, fetchPosts]);

  if (isLoadingProfile) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  if (!profileUser) {
    return (
      <EmptyState
        icon={null}
        title="Người dùng không tồn tại"
        description="Không tìm thấy hồ sơ này"
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Cover Photo */}
      <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 relative rounded-b-3xl overflow-hidden">
        {profileUser.coverUrl && (
          <img
            src={profileUser.coverUrl}
            className="w-full h-full object-cover"
            alt="cover"
          />
        )}
      </div>

      <ProfileHeader user={profileUser} isOwnProfile={isOwnProfile}>
        {!isOwnProfile && (
          <>
            <FriendButton
              userId={profileUser.id}
              status={friendshipStatus?.status ?? "NONE"}
              friendshipId={friendshipStatus?.friendshipId ?? null}
            />
            <button
              className="btn-secondary gap-2"
              onClick={() => createPrivateConversation?.(profileUser.id)}
            >
              <MessageCircle size={16} /> Nhắn tin
            </button>
          </>
        )}

        {isOwnProfile && (
          <button className="btn-secondary">Chỉnh sửa hồ sơ</button>
        )}
      </ProfileHeader>

      {/* Posts Section */}
      <div className="px-4 mt-2">
        <h2 className="font-semibold text-sm text-fg-muted uppercase tracking-widest mb-4">
          Bài viết
        </h2>

        {isLoadingPosts && posts.length === 0 ? (
          <Spinner className="mx-auto mt-10" />
        ) : posts.length === 0 ? (
          <EmptyState title="Chưa có bài viết nào" />
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {hasMorePosts && (
              <div className="flex justify-center my-8">
                <button
                  className="btn-secondary"
                  onClick={() => fetchMorePosts(profileUser.id)}
                  disabled={isFetchingMore}
                >
                  {isFetchingMore ? <Spinner className="w-4 h-4" /> : "Xem thêm bài viết"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}