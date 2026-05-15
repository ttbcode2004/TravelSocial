import { useState } from "react";
import { Link } from "react-router-dom";
import {MessageCircle, MoreHorizontal, Globe, Users, Lock } from "lucide-react";
import { cn, timeAgo } from "../../utils";
import Avatar from "../ui/Avatar";

import LikePost from "./LikePost";
import CommentPost from "./CommentPost";
import SharePost from "./SharePost";
import PostCounts from "./PostCounts";
import ReactionUsersModal from "./ReactionUsersModal";
import ShareUsersModal from "./ShareUsersModal";
import PostMedia from "./PostMedia";

import type { Post } from "../../types";

const VISIBILITY_ICON = {
  PUBLIC: Globe,
  FRIENDS: Users,
  PRIVATE: Lock,
};

interface Props {
  post: Post;
}

export default function PostCard({ post }: Props) {
  const [showComments, setShowComments] = useState(false);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [showSharesModal, setShowSharesModal] = useState(false);

  const VIcon = VISIBILITY_ICON[post.visibility];
  return (
    <>
      <article className="card overflow-hidden animate-fade-in">
        {/* HEADER */}
        <div className="flex items-start justify-between p-4">
          <div className="flex items-start gap-3">
            <Link
              to={`/profile/${post?.user?.username}`}
              className="group shrink-0"
            >
              <Avatar
                src={post?.user?.avatarUrl}
                name={post?.user?.username}
                size="md"
              />
            </Link>

            <div>
              <div className="flex items-center gap-1.5">
                <Link
                  to={`/profile/${post?.user?.username}`}
                  className="font-medium text-base group-hover:text-primary transition-colors hover:text-primary"
                >
                  {post?.user?.username}
                </Link>

                {/* {post?.user?.isVerified && (
                  <span className="text-primary text-xs">✓</span>
                )} */}
              </div>

              <div className="flex items-center gap-1 text-fg-subtle text-xs mt-0.5">
                <VIcon size={12} />

                <Link to={`/feed/${post.id}`} className="hover:underline">
                  {post?.createdAt && timeAgo(post?.createdAt )}
                </Link>
              </div>
            </div>
          </div>

          <button className="btn-icon">
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* CONTENT */}
        {post.content && (
          <div className="px-4 pb-3">
            <p className="text-base whitespace-pre-wrap leading-relaxed">
              {post?.content}
            </p>
          </div>
        )}

        {/* MEDIA */}
        <PostMedia mediaUrls={post?.mediaUrls} />

        {/* COUNTS */}
        <PostCounts
          post={post}
          onOpenReactions={() => setShowReactionsModal(true)}
          onOpenShares={() => setShowSharesModal(true)}
          onToggleComments={() => setShowComments(!showComments)}
        />

        {/* ACTIONS */}
        <div className="flex border-t border-border mx-1">
          <LikePost post={post} />

          <button
            className={cn(
              "btn-ghost flex-1 py-2.5 text-xs rounded-lg",
              showComments && "text-primary",
            )}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle size={16} />
            Bình luận
          </button>

          <div className="flex-1 flex items-center justify-center">
            <SharePost postId={post?.id} />
          </div>
        </div>

        {/* COMMENTS */}
        {showComments && (
          <div className="border-t border-border p-4">
            <CommentPost postId={post?.id} />
          </div>
        )}
      </article>

      {/* MODALS */}
      <ReactionUsersModal
        postId={post.id}
        open={showReactionsModal}
        onClose={() => setShowReactionsModal(false)}
      />

      <ShareUsersModal
        open={showSharesModal}
        onClose={() => setShowSharesModal(false)}
      />
    </>
  );
}
