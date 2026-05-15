// src/components/post/CommentPost.tsx

import { useEffect, useState } from "react";

import { Send } from "lucide-react";

import { usePostStore } from "../../stores/post.store";

import Avatar from "../ui/Avatar";

import { useUser } from "../../stores/auth.store";

interface Props {
  postId: string;
}

export default function CommentPost({ postId }: Props) {
  const user = useUser();

  const comments = usePostStore((s) => s.comments);

  const getComments = usePostStore((s) => s.getComments);

  const createComment = usePostStore((s) => s.createComment);

  const [content, setContent] = useState("");

  const [replyTo, setReplyTo] = useState<string | null>(null);

  useEffect(() => {
    getComments(postId);
  }, [postId]);

  const submit = async () => {
    if (!content.trim()) return;

    const ok = await createComment(postId, content, replyTo || undefined);

    if (ok) {
      setContent("");
      setReplyTo(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="flex gap-3">
        <Avatar src={user?.avatarUrl || null} name={user?.username || ""} size="sm" />

        <div className="flex-1 flex gap-2">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyTo ? "Trả lời bình luận..." : "Viết bình luận..."}
            className="input flex-1"
          />

          <button onClick={submit} className="btn-primary px-3">
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-4">
        {comments?.items.map((comment) => (
          <div key={comment.id}>
            {/* Main comment */}
            <div className="flex gap-3">
              <Avatar
                src={comment.user?.avatarUrl || null}
                name={comment.user?.username || ""}
                size="sm"
              />

              <div className="flex-1">
                <div className="bg-bg-muted rounded-2xl px-4 py-3">
                  <p className="font-medium text-sm">{comment.user.username}</p>

                  <p className="text-sm mt-1">{comment.content}</p>
                </div>

                <div className="flex items-center gap-3 mt-1 px-2">
                  <button
                    className="text-xs text-fg-muted hover:text-primary"
                    onClick={() => setReplyTo(comment.id)}
                  >
                    Trả lời
                  </button>

                  <span className="text-xs text-fg-subtle">
                    {comment._count?.replies || 0} phản hồi
                  </span>
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-4 mt-3 space-y-3 border-l border-border pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-2">
                        <Avatar
                          src={reply.user?.avatarUrl || null}
                          name={reply.user.username}
                          size="xs"
                        />

                        <div className="bg-bg-subtle rounded-2xl px-3 py-2 flex-1">
                          <p className="font-medium text-xs">
                            {reply.user.username}
                          </p>

                          <p className="text-sm mt-1">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
