import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, MoreHorizontal, Globe, Users, Lock } from "lucide-react";
import { api } from "../../lib/api";
import { cn, timeAgo, REACTION_EMOJI, formatCount } from "../../utils";
import Avatar from "../../components/ui/Avatar";
import type { Post, ReactionType } from "../../types";
import toast from "react-hot-toast";

const REACTIONS: { type: ReactionType; emoji: string }[] = [
  { type: "LIKE", emoji: "👍" },
  { type: "LOVE", emoji: "❤️" },
  { type: "HAHA", emoji: "😂" },
  { type: "WOW", emoji: "😮" },
  { type: "SAD", emoji: "😢" },
  { type: "ANGRY", emoji: "😡" },
];

const VISIBILITY_ICON = { PUBLIC: Globe, FRIENDS: Users, PRIVATE: Lock };

export default function PostCard({ post }: { post: Post }) {
  const [showReactions, setShowReactions] = useState(false);
  const qc = useQueryClient();
  const VIcon = VISIBILITY_ICON[post.visibility];

  const react = async (type: ReactionType) => {
    setShowReactions(false);
    try {
      if (post.viewerReaction === type) {
        await api.delete(`/posts/${post.id}/reactions`);
      } else {
        await api.post(`/posts/${post.id}/reactions`, { type });
      }
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["post", post.id] });
    } catch {
      toast.error("Không thể react");
    }
  };

  return (
    <article className="card animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3">
        <Link to={`/profile/${post.user.username}`} className="flex items-center gap-3 group">
          <Avatar src={post.user.avatarUrl} name={post.user.username} size="md" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm group-hover:text-primary transition-colors">
                {post.user.username}
              </span>
              {post.user.isVerified && (
                <span className="text-primary text-xs">✓</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-fg-subtle text-xs mt-0.5">
              <VIcon size={11} />
              <span>{timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </Link>
        <button className="btn-icon"><MoreHorizontal size={18} /></button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Media */}
      {post.mediaUrls.length > 0 && (
        <div className={cn(
          "grid gap-0.5 overflow-hidden",
          post.mediaUrls.length === 1 ? "grid-cols-1" :
          post.mediaUrls.length === 2 ? "grid-cols-2" : "grid-cols-3"
        )}>
          {post.mediaUrls.slice(0, 3).map((url, i) => (
            <div key={i} className="relative aspect-square bg-bg-muted">
              <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              {i === 2 && post.mediaUrls.length > 3 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">+{post.mediaUrls.length - 3}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Counts */}
      {(post.counts.reactions > 0 || post.counts.comments > 0) && (
        <div className="flex items-center justify-between px-4 py-2 text-xs text-fg-muted border-t border-border mt-1">
          <span>{post.counts.reactions > 0 ? `${formatCount(post.counts.reactions)} lượt thích` : ""}</span>
          <span>{post.counts.comments > 0 ? `${formatCount(post.counts.comments)} bình luận` : ""}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex border-t border-border mx-1">
        {/* React button with picker */}
        <div className="relative flex-1">
          <button
            className={cn(
              "btn-ghost w-full py-2.5 text-xs rounded-lg",
              post.viewerReaction && "text-primary"
            )}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
            onClick={() => react(post.viewerReaction ?? "LIKE")}
          >
            {post.viewerReaction ? (
              <span className="text-base mr-1">{REACTION_EMOJI[post.viewerReaction]}</span>
            ) : (
              <Heart size={16} />
            )}
            {post.viewerReaction ?? "Thích"}
          </button>

          {/* Reaction picker */}
          {showReactions && (
            <div
              className="absolute bottom-full left-0 mb-2 flex gap-1 bg-bg-elevated
                         border border-border rounded-2xl shadow-elevated p-2 z-20 animate-scale-in"
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
            >
              {REACTIONS.map(({ type, emoji }) => (
                <button
                  key={type}
                  className="text-xl hover:scale-125 transition-transform cursor-pointer p-1"
                  onClick={() => react(type)}
                  title={type}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="btn-ghost flex-1 py-2.5 text-xs rounded-lg">
          <MessageCircle size={16} />
          Bình luận
        </button>

        <button className="btn-ghost flex-1 py-2.5 text-xs rounded-lg">
          <Share2 size={16} />
          Chia sẻ
        </button>
      </div>
    </article>
  );
}