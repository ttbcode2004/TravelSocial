import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { SkeletonPost, EmptyState } from "../../components/ui/Avatar";
import PostCard from "../../components/post/PostCard";
import CreatePost from "../../components/post/CreatePost";
import { Newspaper } from "lucide-react";
import type { Post, CursorPage } from "../../types";

export default function FeedPage() {
  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: async ({ pageParam }) => {
      const res = await api.get<{ items: Post[]; nextCursor: string | null; hasNextPage: boolean }>(
        "/posts/feed",
        { params: { cursor: pageParam, limit: 20 } }
      );
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <CreatePost />

      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <SkeletonPost key={i} />)
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<Newspaper size={40} />}
          title="Chưa có bài viết nào"
          description="Hãy đăng bài đầu tiên hoặc kết bạn thêm để xem bảng tin"
        />
      ) : (
        <>
          {posts.map((post) => <PostCard key={post.id} post={post} />)}

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                className="btn-secondary"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Đang tải..." : "Xem thêm"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}