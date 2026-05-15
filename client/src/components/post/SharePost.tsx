// src/components/post/SharePost.tsx
import { Share2 } from "lucide-react";
import toast from "react-hot-toast";

import { usePostStore } from "../../stores/post.store";

interface Props {
  postId: string;
}

export default function SharePost({
  postId,
}: Props) {
  const sharePost = usePostStore(
    (s) => s.sharePost
  );

  const handleShare = async () => {
    const success = await sharePost(postId);

    if (success) {
      toast.success("Đã chia sẻ bài viết");
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 text-fg-subtle hover:text-primary transition"
    >
      <Share2 size={18} />
      <span>Chia sẻ</span>
    </button>
  );
}