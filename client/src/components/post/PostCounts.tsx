import { formatCount } from "../../utils";
import type { Post } from "../../types";

interface Props {
  post: Post;

  onOpenReactions: () => void;
  onOpenShares: () => void;
  onToggleComments: () => void;
}

export default function PostCounts({
  post,
  onOpenReactions,
  onOpenShares,
  onToggleComments,
}: Props) {
  if (
    post.counts.reactions === 0 &&
    post.counts.comments === 0 &&
    post.counts.shares === 0
  ) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm text-fg-muted border-t border-border">
      <div className="flex items-center gap-2">
        {post.counts.reactions > 0 && (
          <button
            onClick={onOpenReactions}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            {formatCount(post.counts.reactions)} lượt thích
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {post.counts.comments > 0 && (
          <button
            onClick={onToggleComments}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            {formatCount(post.counts.comments)} bình luận
          </button>
        )}

        {post.counts.shares > 0 && (
          <button
            onClick={onOpenShares}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            {formatCount(post.counts.shares)} chia sẻ
          </button>
        )}
      </div>
    </div>
  );
}