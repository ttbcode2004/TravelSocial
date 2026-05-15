import {
  useEffect,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  X,
} from "lucide-react";

import {Spinner} from "../../components/ui/Avatar";

import PostCard from "../../components/post/PostCard";

import {
  usePostStore,
} from "../../stores/post.store";

export default function PostDetailsPage() {
  const navigate = useNavigate();

  const { id } = useParams();

  const {
    currentPost,
    getPost,
    isLoading,
  } = usePostStore();

  useEffect(() => {
    if (id) {
      getPost(id);
    }
  }, [id]);

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      {/* BACKDROP */}
      <div
        className="absolute inset-0"
        onClick={handleClose}
      />

      {/* CONTENT */}
      <div className="relative z-10 w-full max-w-2xl">
        <button
          onClick={handleClose}
          className="absolute -top-12 right-0 btn-icon text-white"
        >
          <X size={22} />
        </button>

        {isLoading ? (
          <div className="card p-10 flex justify-center">
            <Spinner />
          </div>
        ) : currentPost ? (
          <PostCard
            post={currentPost}
          />
        ) : (
          <div className="card p-10 text-center">
            Không tìm thấy bài viết
          </div>
        )}
      </div>
    </div>
  );
}