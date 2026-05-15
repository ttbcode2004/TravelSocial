// src/components/post/LikePost.tsx
import { useState } from "react";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";
import { cn, REACTION_EMOJI } from "../../utils";
import { usePostStore } from "../../stores/post.store";

import type { Post, ReactionType } from "../../types";

const REACTIONS: {
  type: ReactionType;
  emoji: string;
}[] = [
  { type: "LIKE", emoji: "👍" },
  { type: "LOVE", emoji: "❤️" },
  { type: "HAHA", emoji: "😂" },
  { type: "WOW", emoji: "😮" },
  { type: "SAD", emoji: "😢" },
  { type: "ANGRY", emoji: "😡" },
];

interface Props {
  post: Post;
}

export default function LikePost({
  post,
}: Props) {
  const [showReactions, setShowReactions] = useState(false);
  const reactPost = usePostStore((s) => s.reactPost);
  const removeReaction = usePostStore((s) => s.removeReaction);

  const react = async ( type: ReactionType) => {
    try {
      setShowReactions(false);

      if (post.viewerReaction === type) {
        await removeReaction(post.id);

        toast.success("Đã bỏ cảm xúc");
      } else {
        await reactPost(post.id, type);

        toast.success("Đã thả cảm xúc");
      }
    } catch {
      toast.error("Không thể react");
    }
  };

  return (
    <div className="relative flex-1">
      <button
        className={cn(
          "btn-ghost w-full py-2.5 text-xs rounded-lg",
          post.viewerReaction && "text-primary"
        )}
        onMouseEnter={() => setShowReactions(true)}
        onMouseLeave={() => setShowReactions(false)}
        onClick={() =>
          react( post.viewerReaction ?? "LIKE" )
        }
      >
        {post.viewerReaction ? (
          <span className="text-base mr-1">
            { REACTION_EMOJI[post.viewerReaction]}
          </span>
        ) : (
          <Heart size={16} />
        )}

        {post.viewerReaction ?? "Thích"}
      </button>

      {/* Picker */}
      {showReactions && (
        <div
          className="absolute bottom-full left-0 mb-0 flex gap-1 bg-bg-elevated border border-border rounded-xl shadow-elevated p-2 z-20 animate-scale-in"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          {REACTIONS.map(
            ({ type, emoji }) => (
              <button
                key={type}
                className="text-xl hover:scale-125 transition-transform cursor-pointer p-1"
                onClick={() => react(type)}
                title={type}
              >
                {emoji}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}