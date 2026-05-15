// src/pages/feed/FeedPage.tsx
import { useEffect } from "react";
import { Newspaper } from "lucide-react";

import { usePostStore } from "../../stores/post.store";

import { SkeletonPost, EmptyState } from "../../components/ui/Avatar";
import PostCard from "../../components/post/PostCard";
import CreatePost from "../../components/post/CreatePost";

export default function FeedPage() {
  const feed = usePostStore((s) => s.feed);
  const getFeed = usePostStore((s) => s.getFeed);
  const isLoading = usePostStore((s) => s.isLoading);

  useEffect(() => {
    if (!feed) {
      getFeed();
    }
  }, []);

  const posts = feed?.items ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <CreatePost />

      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <SkeletonPost key={i} />
        ))
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<Newspaper size={40} />}
          title="Chưa có bài viết nào"
          description="Hãy đăng bài đầu tiên hoặc kết bạn thêm để xem bảng tin"
        />
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {feed?.hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                className="btn-secondary"
                onClick={() => getFeed(feed.nextCursor ?? undefined)}
              >
                Xem thêm
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}